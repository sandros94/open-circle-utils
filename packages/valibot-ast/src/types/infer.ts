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
import type {
  GenericObjectSchema,
  GenericObjectSchemaAsync,
  GetObjectRest,
} from "../utils/object/types.ts";
import type {
  GenericArraySchema,
  GenericArraySchemaAsync,
  GenericTupleSchema,
  GenericTupleSchemaAsync,
  GetTupleRest,
} from "../utils/array/types.ts";
import type {
  GenericUnionSchema,
  GenericUnionSchemaAsync,
  GenericVariantSchema,
  GenericVariantSchemaAsync,
  GenericEnumSchema,
  GenericPicklistSchema,
} from "../utils/choice/types.ts";
import type {
  GenericIntersectSchema,
  GenericIntersectSchemaAsync,
  GenericInstanceSchema,
  GenericMapSchema,
  GenericMapSchemaAsync,
  GenericSetSchema,
  GenericSetSchemaAsync,
  GenericFunctionSchema,
} from "../utils/special/types.ts";
import type { GenericRecordSchema, GenericRecordSchemaAsync } from "../utils/record/types.ts";
import type { GenericLiteralSchema } from "../utils/literal/types.ts";
import type { GenericLazySchema, GenericLazySchemaAsync } from "../utils/lazy/types.ts";

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
 * Conditionally adds `rest` to an intersection when the rest schema is not `null`.
 */
type WithRest<_TSchema extends GenericSchema | GenericSchemaAsync, TRest> = TRest extends
  | GenericSchema
  | GenericSchemaAsync
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
      : // ── 3. Object
        TSchema extends GenericObjectSchemaAsync | GenericObjectSchema
        ? ObjectASTNode & {
            type: TSchema["type"];
            entries: InferObjectEntries<TSchema["entries"]>;
          } & WithAsync<TSchema> &
            WithRest<TSchema, GetObjectRest<TSchema>>
        : // ── 4. Array
          TSchema extends GenericArraySchemaAsync | GenericArraySchema
          ? ArrayASTNode & { item: InferASTNode<TSchema["item"]> } & WithAsync<TSchema>
          : // ── 5. Tuple
            TSchema extends GenericTupleSchemaAsync | GenericTupleSchema
            ? TupleASTNode & {
                type: TSchema["type"];
                items: InferSchemaArray<TSchema["items"]>;
              } & WithAsync<TSchema> &
                WithRest<TSchema, GetTupleRest<TSchema>>
            : // ── 6. Union
              TSchema extends GenericUnionSchemaAsync | GenericUnionSchema
              ? UnionASTNode & {
                  options: InferSchemaArray<TSchema["options"]>;
                } & WithAsync<TSchema>
              : // ── 7. Variant
                TSchema extends GenericVariantSchemaAsync<string> | GenericVariantSchema<string>
                ? VariantASTNode & {
                    key: InferVariantKey<TSchema>;
                  } & WithAsync<TSchema>
                : // ── 8. Intersect
                  TSchema extends GenericIntersectSchemaAsync | GenericIntersectSchema
                  ? IntersectASTNode & {
                      options: InferSchemaArray<TSchema["options"]>;
                    } & WithAsync<TSchema>
                  : // ── 9. Literal
                    TSchema extends GenericLiteralSchema
                    ? LiteralASTNode & {
                        literal: InferSerializedBigInt<TSchema["literal"]>;
                      }
                    : // ── 10. Enum
                      TSchema extends GenericEnumSchema
                      ? EnumASTNode
                      : // ── 11. Picklist
                        TSchema extends GenericPicklistSchema
                        ? PicklistASTNode
                        : // ── 12. Record
                          TSchema extends GenericRecordSchemaAsync | GenericRecordSchema
                          ? RecordASTNode & {
                              key: InferASTNode<TSchema["key"]>;
                              value: InferASTNode<TSchema["value"]>;
                            } & WithAsync<TSchema>
                          : // ── 13. Map
                            TSchema extends GenericMapSchemaAsync | GenericMapSchema
                            ? MapASTNode & {
                                key: InferASTNode<TSchema["key"]>;
                                value: InferASTNode<TSchema["value"]>;
                              } & WithAsync<TSchema>
                            : // ── 14. Set
                              TSchema extends GenericSetSchemaAsync | GenericSetSchema
                              ? SetASTNode & {
                                  item: InferASTNode<TSchema["value"]>;
                                } & WithAsync<TSchema>
                              : // ── 15. Instance
                                TSchema extends GenericInstanceSchema
                                ? InstanceASTNode
                                : // ── 16. Lazy
                                  TSchema extends GenericLazySchemaAsync | GenericLazySchema
                                  ? LazyASTNode & WithAsync<TSchema>
                                  : // ── 17. Function
                                    TSchema extends GenericFunctionSchema
                                    ? FunctionASTNode
                                    : // ── 18. Custom (structural — no Generic type exists in utils)
                                      TSchema extends { type: "custom" }
                                      ? CustomASTNode
                                      : // ── 19. Primitives (structural match on type literal)
                                        TSchema extends {
                                            type: infer T extends PrimitiveASTNode["type"];
                                          }
                                        ? PrimitiveASTNode & { type: T }
                                        : // ── 20. Fallback
                                          ASTNode;

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
