import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { ASTNode } from "./kind.ts";
import type {
  PrimitiveASTNode,
  LiteralASTNode,
  ObjectASTNode,
  ArrayASTNode,
  TupleASTNode,
  UnionASTNode,
  VariantASTNode,
  EnumASTNode,
  PicklistASTNode,
  RecordASTNode,
  MapASTNode,
  SetASTNode,
  IntersectASTNode,
  InstanceASTNode,
  LazyASTNode,
  WrappedASTNode,
  FunctionASTNode,
  CustomASTNode,
  ValidationASTNode,
  TransformationASTNode,
  SerializedBigInt,
} from "./nodes.ts";
import type { ASTVersion, ValidationLibrary, DictionaryEntryMeta } from "./document.ts";

// Generic schema types for matching
import type { GenericSchemaWithPipe, GenericSchemaWithPipeAsync } from "../utils/pipe/types.ts";
import type { GenericWrappedSchema, GenericWrappedSchemaAsync } from "../utils/wrapped/types.ts";
import type { GenericVariantSchema, GenericVariantSchemaAsync } from "../utils/choice/types.ts";

// #region Helpers

/**
 * Maps a bigint literal type to {@link SerializedBigInt}, passes through others.
 */
type InferSerializedBigInt<T> = T extends bigint ? SerializedBigInt : T;

/**
 * Recursively maps a record of valibot schemas to their AST node types.
 */
type InferObjectEntries<TEntries> = {
  [K in keyof TEntries]: InferASTNode<TEntries[K]>;
};

/**
 * Recursively maps a tuple/array of valibot schemas to their AST node types.
 */
type InferSchemaArray<T extends readonly unknown[]> = {
  [K in keyof T]: InferASTNode<T[K]>;
};

/**
 * Conditionally adds `async: true` when the schema has `async: true`.
 */
type WithAsync<TSchema> = TSchema extends { async: true } ? { async: true } : unknown;

/**
 * Conditionally adds `rest` when the rest schema is not `null`.
 */
type WithRest<TRest> = TRest extends GenericSchema | GenericSchemaAsync
  ? { rest: InferASTNode<TRest> }
  : unknown;

/**
 * Extracts the variant key from sync or async variant schemas.
 */
type InferVariantKey<TSchema> =
  TSchema extends GenericVariantSchema<infer TKey>
    ? TKey
    : TSchema extends GenericVariantSchemaAsync<infer TKey>
      ? TKey
      : string;

/**
 * Recursively unwraps nested pipe roots to find the actual (non-pipe) root schema.
 * Depth-limited to prevent infinite recursion with wide generic types.
 */
type UnwrapPipeRoot<T, D extends unknown[] = [0, 0, 0, 0, 0]> = D extends [unknown, ...infer DRest]
  ? T extends GenericSchemaWithPipeAsync
    ? UnwrapPipeRoot<T["pipe"][0], DRest>
    : T extends GenericSchemaWithPipe
      ? UnwrapPipeRoot<T["pipe"][0], DRest>
      : T
  : T;

/**
 * Maps a single valibot pipe action to its AST node type.
 * Metadata actions produce `never` (they are lifted to `info`, not included in pipe).
 * Pipe schemas are handled separately by {@link FlatFilterActions} and never reach here.
 */
type InferPipeAction<TAction> = TAction extends {
  kind: "validation";
  type: infer TType extends string;
}
  ? ValidationASTNode & { type: TType }
  : TAction extends { kind: "transformation"; type: infer TType extends string }
    ? TransformationASTNode & { type: TType }
    : TAction extends { kind: "metadata" }
      ? never
      : TAction extends { kind: "schema"; type: "custom" }
        ? ValidationASTNode & { type: "custom" }
        : TAction extends GenericSchema | GenericSchemaAsync
          ? InferASTNode<TAction>
          : ASTNode;

/**
 * Filters and flattens pipe actions, recursively inlining nested pipe schemas.
 *
 * - For pipe schemas at position > 0: emits the unwrapped inner root as a
 *   schema node, then recursively collects the inner pipe's actions.
 * - Metadata actions are dropped (they are lifted to `info`).
 *
 * Depth-limited to prevent infinite recursion with wide generic types.
 */
type FlatFilterActions<
  T extends readonly unknown[],
  D extends unknown[] = [0, 0, 0, 0, 0],
> = D extends [unknown, ...infer DRest]
  ? T extends readonly [infer Head, ...infer Tail]
    ? Head extends GenericSchemaWithPipeAsync
      ? [
          InferASTNode<UnwrapPipeRoot<Head>>,
          ...CollectFlatPipeItems<Head["pipe"], DRest>,
          ...FlatFilterActions<Tail, DRest>,
        ]
      : Head extends GenericSchemaWithPipe
        ? [
            InferASTNode<UnwrapPipeRoot<Head>>,
            ...CollectFlatPipeItems<Head["pipe"], DRest>,
            ...FlatFilterActions<Tail, DRest>,
          ]
        : InferPipeAction<Head> extends never
          ? FlatFilterActions<Tail, D>
          : [InferPipeAction<Head>, ...FlatFilterActions<Tail, D>]
    : []
  : [];

/**
 * Collects all flattened pipe items from a valibot pipe tuple.
 *
 * - If `pipe[0]` (root schema) itself has a pipe, recursively collects
 *   its inner pipe items first (the root is not emitted, it's already
 *   represented by the outer schema node).
 * - Remaining items (`pipe[1:]`) are processed by {@link FlatFilterActions}.
 *
 * Depth-limited to prevent infinite recursion with wide generic types.
 */
type CollectFlatPipeItems<
  TPipe extends readonly unknown[],
  D extends unknown[] = [0, 0, 0, 0, 0],
> = D extends [unknown, ...infer DRest]
  ? TPipe extends readonly [infer Root, ...infer Rest]
    ? Root extends GenericSchemaWithPipeAsync
      ? [...CollectFlatPipeItems<Root["pipe"], DRest>, ...FlatFilterActions<Rest, DRest>]
      : Root extends GenericSchemaWithPipe
        ? [...CollectFlatPipeItems<Root["pipe"], DRest>, ...FlatFilterActions<Rest, DRest>]
        : FlatFilterActions<Rest, D>
    : []
  : [];

/**
 * Conditionally adds `pipe` when pipe actions exist.
 */
type WithPipe<TPipe extends readonly unknown[]> =
  CollectFlatPipeItems<TPipe> extends infer P
    ? P extends readonly [ASTNode, ...ASTNode[]]
      ? { pipe: P }
      : unknown
    : unknown;

// #region Internal map helpers

/**
 * Infers the AST node for object schema variants.
 * Extracts entries, async flag, and rest schema.
 */
type _InferObjectEntry<TSchema, TType extends string> = TSchema extends {
  entries: infer E extends Record<string, unknown>;
}
  ? ObjectASTNode & { type: TType; entries: InferObjectEntries<E> } & WithAsync<TSchema> &
      WithRest<TSchema extends { rest: infer R } ? R : null>
  : ObjectASTNode & { type: TType } & WithAsync<TSchema>;

/**
 * Infers the AST node for tuple schema variants.
 * Extracts items, async flag, and rest schema.
 */
type _InferTupleEntry<TSchema, TType extends string> = TSchema extends {
  items: infer I extends readonly unknown[];
}
  ? TupleASTNode & { type: TType; items: InferSchemaArray<I> } & WithAsync<TSchema> &
      WithRest<TSchema extends { rest: infer R } ? R : null>
  : TupleASTNode & { type: TType } & WithAsync<TSchema>;

/**
 * Internal lookup table mapping schema `.type` strings to narrowed AST node types.
 *
 * Generic in `TSchema` so structural entries (object, array, tuple, …) can
 * extract child types from the schema's own properties.
 *
 * Only the accessed entry is evaluated by TypeScript (interface properties
 * are resolved lazily), keeping conditional depth shallow.
 */
interface _ASTNodeMap<TSchema> {
  // ── Object types ──
  object: _InferObjectEntry<TSchema, "object">;
  loose_object: _InferObjectEntry<TSchema, "loose_object">;
  strict_object: _InferObjectEntry<TSchema, "strict_object">;
  object_with_rest: _InferObjectEntry<TSchema, "object_with_rest">;

  // ── Array ──
  array: TSchema extends { item: infer I }
    ? ArrayASTNode & { item: InferASTNode<I> } & WithAsync<TSchema>
    : ArrayASTNode & WithAsync<TSchema>;

  // ── Tuple types ──
  tuple: _InferTupleEntry<TSchema, "tuple">;
  loose_tuple: _InferTupleEntry<TSchema, "loose_tuple">;
  strict_tuple: _InferTupleEntry<TSchema, "strict_tuple">;
  tuple_with_rest: _InferTupleEntry<TSchema, "tuple_with_rest">;

  // ── Union ──
  union: TSchema extends { options: infer O extends readonly unknown[] }
    ? UnionASTNode & { options: InferSchemaArray<O> } & WithAsync<TSchema>
    : UnionASTNode & WithAsync<TSchema>;

  // ── Variant ──
  variant: VariantASTNode & { key: InferVariantKey<TSchema> } & WithAsync<TSchema>;

  // ── Intersect ──
  intersect: TSchema extends { options: infer O extends readonly unknown[] }
    ? IntersectASTNode & { options: InferSchemaArray<O> } & WithAsync<TSchema>
    : IntersectASTNode & WithAsync<TSchema>;

  // ── Literal ──
  literal: TSchema extends { literal: infer L }
    ? LiteralASTNode & { literal: InferSerializedBigInt<L> }
    : LiteralASTNode;

  // ── Enum & Picklist ──
  enum: EnumASTNode;
  picklist: PicklistASTNode;

  // ── Record ──
  record: TSchema extends { key: infer K; value: infer V }
    ? RecordASTNode & { key: InferASTNode<K>; value: InferASTNode<V> } & WithAsync<TSchema>
    : RecordASTNode & WithAsync<TSchema>;

  // ── Map ──
  map: TSchema extends { key: infer K; value: infer V }
    ? MapASTNode & { key: InferASTNode<K>; value: InferASTNode<V> } & WithAsync<TSchema>
    : MapASTNode & WithAsync<TSchema>;

  // ── Set ──
  set: TSchema extends { value: infer V }
    ? SetASTNode & { item: InferASTNode<V> } & WithAsync<TSchema>
    : SetASTNode & WithAsync<TSchema>;

  // ── Instance ──
  instance: InstanceASTNode;

  // ── Lazy ──
  lazy: LazyASTNode & WithAsync<TSchema>;

  // ── Function ──
  function: FunctionASTNode;

  // ── Custom ──
  custom: CustomASTNode;

  // ── Primitives ──
  string: PrimitiveASTNode & { type: "string" };
  number: PrimitiveASTNode & { type: "number" };
  boolean: PrimitiveASTNode & { type: "boolean" };
  bigint: PrimitiveASTNode & { type: "bigint" };
  date: PrimitiveASTNode & { type: "date" };
  blob: PrimitiveASTNode & { type: "blob" };
  symbol: PrimitiveASTNode & { type: "symbol" };
  any: PrimitiveASTNode & { type: "any" };
  unknown: PrimitiveASTNode & { type: "unknown" };
  never: PrimitiveASTNode & { type: "never" };
  nan: PrimitiveASTNode & { type: "nan" };
  null: PrimitiveASTNode & { type: "null" };
  undefined: PrimitiveASTNode & { type: "undefined" };
  void: PrimitiveASTNode & { type: "void" };
  file: PrimitiveASTNode & { type: "file" };
  promise: PrimitiveASTNode & { type: "promise" };
}

// #region InferASTNode

/**
 * Infers the exact AST node type that {@link schemaToAST} would produce for a
 * given Valibot schema type.
 *
 * When the input is a concrete schema (e.g. `StringSchema`, `ObjectSchema<{…}>`),
 * the result is a narrowed AST node rather than the generic {@link ASTNode} union.
 * For unknown or unrecognized schemas the type gracefully falls back to `ASTNode`.
 *
 * @example
 * ```ts
 * import * as v from "valibot";
 * import type { InferASTNode } from "valibot-ast";
 *
 * // Primitive
 * type A = InferASTNode<v.StringSchema<undefined>>;
 * //   ^? PrimitiveASTNode & { type: "string" }
 *
 * // Object with typed entries
 * type B = InferASTNode<v.ObjectSchema<{ name: v.StringSchema<undefined> }, undefined>>;
 * //   ^? ObjectASTNode & { type: "object"; entries: { name: PrimitiveASTNode & { type: "string" } } }
 * ```
 */
export type InferASTNode<TSchema> =
  // ── 1. Pipe: unwrap to deepest non-pipe root and collect flattened pipe actions
  TSchema extends GenericSchemaWithPipeAsync | GenericSchemaWithPipe
    ? InferASTNode<UnwrapPipeRoot<TSchema["pipe"][0]>> & WithPipe<TSchema["pipe"]>
    : // ── 2. Wrapped (optional, nullable, nullish, …)
      TSchema extends GenericWrappedSchemaAsync | GenericWrappedSchema
      ? WrappedASTNode & {
          type: TSchema["type"];
          wrapped: InferASTNode<TSchema["wrapped"]>;
        } & WithAsync<TSchema>
      : // ── 3. Flat map lookup by `.type` string
        TSchema extends { type: infer TType extends string }
        ? TType extends keyof _ASTNodeMap<TSchema>
          ? _ASTNodeMap<TSchema>[TType]
          : ASTNode
        : ASTNode;

// #region Typed document & result

/**
 * An {@link ASTDocument} with the root schema node narrowed to `TNode`.
 */
export interface TypedASTDocument<TNode extends ASTNode = ASTNode> {
  version: ASTVersion;
  library: ValidationLibrary;
  schema: TNode;
  dictionary?: Record<string, DictionaryEntryMeta>;
  metadata?: Record<string, unknown>;
}

/**
 * A typed result from {@link schemaToAST} with the schema node narrowed.
 */
export interface TypedSchemaToASTResult<TNode extends ASTNode = ASTNode> {
  document: TypedASTDocument<TNode>;
  referencedDictionary: import("../dictionary.ts").DictionaryMap;
}
