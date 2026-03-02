/**
 * Core types for formisch-utils.
 */

import type { ASTNode } from "valibot-ast";
import type { PathKey, Path } from "./utils.ts";

export type { PathKey, Path, RequiredPath, ValidPath } from "./utils.ts";

// ─── Input Constraints ────────────────────────────────────────────────────────

/**
 * HTML input constraint attributes derivable from a schema's pipe validations.
 */
export interface InputConstraints {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  /** Numeric or ISO date string for date inputs. */
  min?: number | string;
  /** Numeric or ISO date string for date inputs. */
  max?: number | string;
  /** From `v.multipleOf()` or `v.integer()` (→ 1). */
  step?: number;
  /** From `v.regex()` — `.source` of the RegExp requirement. */
  pattern?: string;
  /** From `v.mimeType()` — comma-joined MIME types. */
  accept?: string;
}

// ─── Field Options ────────────────────────────────────────────────────────────

/**
 * A single selectable option for leaf fields backed by enum/picklist/union-of-literals.
 * Used to populate `<select>`, radio groups, etc.
 */
export interface FormFieldOption {
  value: string | number | boolean | bigint;
  /** Defaults to `String(value)` when no metadata title is available. */
  label: string;
}

// ─── Field Meta ───────────────────────────────────────────────────────────────

/**
 * Human-readable metadata inferred from a schema node's `info` block.
 */
export interface FormFieldMeta {
  label?: string;
  description?: string;
  placeholder?: string;
}

// ─── Unwrap Result ────────────────────────────────────────────────────────────

/**
 * Result of peeling all wrapper layers (optional/nullable/nullish/…) off an AST node.
 *
 * Alias for `GetWrappedASTNode` from `valibot-ast/utils`.
 */
export type { GetWrappedASTNode as UnwrappedASTNode } from "valibot-ast/utils";

// ─── FormFieldConfig ──────────────────────────────────────────────────────────

/**
 * Base fields shared by every variant of FormFieldConfig.
 *
 * @typeParam TPath - The concrete path tuple type for this field.
 *   Defaults to `Path` (= `readonly PathKey[]`) which accepts any path.
 *   When produced by {@link InferFormFieldConfig}, this narrows to the
 *   exact path tuple (e.g. `readonly ["name"]` or `readonly ["array", number, "title"]`).
 */
export interface BaseFormFieldConfig<TPath extends Path = Path> {
  /** The field's own key (last segment of `path`). Empty string for the root node. */
  key: string;
  /** Full path from the form root, ready for Formisch `path` props. */
  path: TPath;
  /** Human-readable label. Sourced from `v.title()`, falls back to `titleCase(key)`. */
  label?: string;
  /** Field description. Sourced from `v.description()`. */
  description?: string;
  /** Input placeholder. Sourced from `v.metadata({ placeholder })` or first example. */
  placeholder?: string;
  /**
   * Whether the field must have a non-undefined value.
   * False when any optional/nullish/undefinedable wrapper is present.
   */
  required: boolean;
  /**
   * Whether the field accepts `null`.
   * True when a nullable/nullish wrapper is present.
   */
  nullable: boolean;
  /** Default value from the schema's wrapper, if present. */
  default?: unknown;
}

/**
 * A scalar field that maps to a single HTML input element.
 */
export interface LeafFormFieldConfig<TPath extends Path = Path> extends BaseFormFieldConfig<TPath> {
  kind: "leaf";
  /** HTML input `type` attribute value: 'text' | 'email' | 'number' | 'checkbox' | 'date' | 'file' | … */
  inputType: string;
  /**
   * The underlying AST `type` of the innermost schema node (after unwrapping).
   * Framework adapters use this to decide value coercion (e.g. "number" → Number(rawValue)).
   */
  nodeType: string;
  constraints?: InputConstraints;
  /**
   * Available options for fields backed by enum/picklist/union-of-literals.
   * When present the field should be rendered as a `<select>` or radio group.
   */
  options?: FormFieldOption[];
}

/**
 * A nested object field. Renders as a sub-form section.
 *
 * @typeParam TField - Narrowed union of the entry field configs.
 *   Defaults to `FormFieldConfig` for backward compatibility.
 *   When produced by {@link InferFormFieldConfig}, this narrows to the
 *   union of all entry config types (e.g. `LeafFormFieldConfig`).
 */
export interface ObjectFormFieldConfig<
  TField extends FormFieldConfig = FormFieldConfig,
  TPath extends Path = Path,
> extends BaseFormFieldConfig<TPath> {
  kind: "object";
  /**
   * Ordered field configs for each entry, preserving schema definition order.
   * Consumers render these in sequence.
   */
  fields: TField[];
}

/**
 * A dynamic array field, maps to Formisch `FieldArray`.
 *
 * @typeParam TItem - Narrowed config type for the array item template.
 *   Defaults to `FormFieldConfig` for backward compatibility.
 *   When produced by {@link InferFormFieldConfig}, this narrows to the
 *   item schema's config type (e.g. `LeafFormFieldConfig`).
 */
export interface ArrayFormFieldConfig<
  TItem extends FormFieldConfig = FormFieldConfig,
  TPath extends Path = Path,
> extends BaseFormFieldConfig<TPath> {
  kind: "array";
  /** Template config used for every dynamically-added item. */
  item: TItem;
}

/**
 * A fixed-length positional array field.
 *
 * Also the natural representation for **multi-step (wizard) forms** when
 * the root schema is `v.tuple([step1Schema, step2Schema, …])`:
 * each `items[i]` is an `ObjectFormFieldConfig` representing one step,
 * and its `label` / `description` come from `v.title()` / `v.description()`
 * on that step's schema.
 *
 * @typeParam TItems - Narrowed tuple of positional item configs.
 *   Defaults to `FormFieldConfig[]` for backward compatibility.
 *   When produced by {@link InferFormFieldConfig}, each position is
 *   independently narrowed (e.g. `[LeafFormFieldConfig, ObjectFormFieldConfig]`).
 */
export interface TupleFormFieldConfig<
  TItems extends FormFieldConfig[] = FormFieldConfig[],
  TPath extends Path = Path,
> extends BaseFormFieldConfig<TPath> {
  kind: "tuple";
  /** Positional configs. Index corresponds to tuple position (= step number for wizards). */
  items: TItems;
}

/**
 * A non-discriminated union field.
 *
 * UI metaphor: tabs or a radio group at the top that reveals one sub-form at a time.
 * Only the selected branch participates in validation and submission.
 * Each option is an ordered list of fields that must all be valid together.
 */
export interface UnionFormFieldConfig<
  TPath extends Path = Path,
> extends BaseFormFieldConfig<TPath> {
  kind: "union";
  options: FormFieldConfig[][];
}

/**
 * A discriminated union field (Valibot `v.variant()`).
 *
 * UI metaphor: a selector (dropdown/tabs) driven by the discriminator key.
 * Changing the discriminator value switches the visible branch.
 */
export interface VariantFormFieldConfig<
  TPath extends Path = Path,
> extends BaseFormFieldConfig<TPath> {
  kind: "variant";
  /** The field key that acts as the discriminator (e.g. `"type"`). */
  discriminatorKey: string;
  branches: Array<{
    /** The literal value of the discriminator for this branch. */
    value: string | number;
    /** From the branch object's `info.title` if available. */
    label?: string;
    /** Ordered field configs for this branch (the discriminator field is included). */
    fields: FormFieldConfig[];
  }>;
}

/**
 * A dynamic key-value record field (Valibot `v.record()`).
 *
 * UI metaphor: a dynamic list of rows, each with a key input and a value input,
 * plus "add" / "remove" controls — similar to an array but with string keys.
 *
 * Maps to Formisch `FieldArray` where each item is an object with `{ key, value }`.
 *
 * @typeParam TKey   - Narrowed config type for the record key field.
 * @typeParam TValue - Narrowed config type for the record value field.
 *   Both default to `FormFieldConfig` for backward compatibility.
 */
export interface RecordFormFieldConfig<
  TKey extends FormFieldConfig = FormFieldConfig,
  TValue extends FormFieldConfig = FormFieldConfig,
  TPath extends Path = Path,
> extends BaseFormFieldConfig<TPath> {
  kind: "record";
  /** Config for the record key (typically a string leaf). */
  keyField: TKey;
  /** Config for each record value. */
  valueField: TValue;
}

/**
 * A field whose AST node type could not be mapped to a known form construct.
 * Emitted for: `lazy` (without a resolved schema), `instance`, `function`, `map`, `set`.
 * Consumers can inspect `nodeType` and handle these cases manually.
 */
export interface UnsupportedFormFieldConfig<
  TPath extends Path = Path,
> extends BaseFormFieldConfig<TPath> {
  kind: "unsupported";
  /** The AST `type` string of the node we could not map. */
  nodeType: string;
  reason?: string;
}

/**
 * All possible field configuration shapes. Discriminate on `kind`.
 */
export type FormFieldConfig =
  | LeafFormFieldConfig
  | ObjectFormFieldConfig
  | ArrayFormFieldConfig
  | TupleFormFieldConfig
  | UnionFormFieldConfig
  | VariantFormFieldConfig
  | RecordFormFieldConfig
  | UnsupportedFormFieldConfig;

// ─── InferFormFieldConfig ─────────────────────────────────────────────────────

type _WrappedType =
  | "optional"
  | "nullable"
  | "nullish"
  | "non_optional"
  | "non_nullable"
  | "non_nullish"
  | "exact_optional"
  | "undefinedable";

/** Structural type groups that carry child schemas needing recursive inference. */
type _ObjectType = "object" | "loose_object" | "strict_object" | "object_with_rest";
type _TupleType = "tuple" | "loose_tuple" | "strict_tuple" | "tuple_with_rest";

/**
 * Internal lookup table for types whose config does **not** need
 * recursive child inference (leaves, variant, union, intersect).
 *
 * @typeParam TPath - Passed through from {@link InferFormFieldConfig} so the
 *   emitted config carries the correct path tuple type.
 */
interface _FormFieldConfigMap<TPath extends Path = Path> {
  // Discriminated union
  variant: VariantFormFieldConfig<TPath>;
  // Non-discriminated union (may resolve to a leaf OR a full union config)
  union: LeafFormFieldConfig<TPath> | UnionFormFieldConfig<TPath>;
  // Intersect (may merge to object or be unsupported)
  intersect: ObjectFormFieldConfig<FormFieldConfig, TPath> | UnsupportedFormFieldConfig<TPath>;
  // Leaf: choice types
  enum: LeafFormFieldConfig<TPath>;
  picklist: LeafFormFieldConfig<TPath>;
  literal: LeafFormFieldConfig<TPath>;
  // Leaf: primitives
  string: LeafFormFieldConfig<TPath>;
  number: LeafFormFieldConfig<TPath>;
  boolean: LeafFormFieldConfig<TPath>;
  bigint: LeafFormFieldConfig<TPath>;
  date: LeafFormFieldConfig<TPath>;
  blob: LeafFormFieldConfig<TPath>;
  file: LeafFormFieldConfig<TPath>;
  symbol: LeafFormFieldConfig<TPath>;
  any: LeafFormFieldConfig<TPath>;
  unknown: LeafFormFieldConfig<TPath>;
  never: LeafFormFieldConfig<TPath>;
  nan: LeafFormFieldConfig<TPath>;
  null: LeafFormFieldConfig<TPath>;
  undefined: LeafFormFieldConfig<TPath>;
  void: LeafFormFieldConfig<TPath>;
  promise: LeafFormFieldConfig<TPath>;
}

// ─── Structural inference helpers ─────────────────────────────────────────────

/**
 * Follow `.pipe[0]` if `T` is a `SchemaWithPipe`, otherwise return `T` as-is.
 *
 * `SchemaWithPipe` projects the root schema's `.type` but does NOT expose
 * structural properties like `.entries`, `.item`, `.items`, `.key`, `.value`.
 * Going through `.pipe[0]` recovers the actual root schema that carries them.
 */
type _ResolvePipeRoot<T> = T extends { pipe: readonly [infer Root, ...unknown[]] } ? Root : T;

/**
 * Map an object's `entries` record to the union of each entry's inferred config,
 * where each entry carries its own path tuple (`readonly [...TBasePath, key]`).
 *
 * For `{ name: StringSchema; age: NumberSchema }` at path `readonly ["address"]`
 * this produces:
 * `LeafFormFieldConfig<readonly ["address", "name"]> | LeafFormFieldConfig<readonly ["address", "age"]>`
 */
type _InferEntryConfigs<E, _D extends unknown[], TBasePath extends Path> = {
  [K in keyof E]: InferFormFieldConfig<E[K], _D, readonly [...TBasePath, K & PathKey]>;
}[keyof E];

/**
 * Recursively map a tuple schema's `.items` to a typed config tuple.
 *
 * `[StringSchema, NumberSchema]` → `[LeafFormFieldConfig<[…, 0]>, LeafFormFieldConfig<[…, 1]>]`
 * `[StringSchema, ObjectSchema<…>]` → `[LeafFormFieldConfig<[…, 0]>, ObjectFormFieldConfig<…, […, 1]>]`
 *
 * Each position is independently narrowed — ideal for wizard step inference.
 * `_Counter` is a type-level counter (tuple of `0`s whose `.length` is the current index).
 */
type _InferTupleItems<
  T extends readonly unknown[],
  _D extends unknown[],
  TBasePath extends Path,
  _Counter extends readonly 0[] = [],
> = T extends readonly [infer Head, ...infer Tail]
  ? [
      InferFormFieldConfig<Head, _D, readonly [...TBasePath, _Counter["length"]]>,
      ..._InferTupleItems<Tail, _D, TBasePath, readonly [..._Counter, 0]>,
    ]
  : [];

// ─── Per-structural-kind config builders ──────────────────────────────────────

type _InferObjectConfig<T, _D extends unknown[], TPath extends Path> =
  _ResolvePipeRoot<T> extends { entries: infer E extends Record<string, unknown> }
    ? ObjectFormFieldConfig<_InferEntryConfigs<E, _D, TPath>, TPath>
    : ObjectFormFieldConfig<FormFieldConfig, TPath>;

type _InferArrayConfig<T, _D extends unknown[], TPath extends Path> =
  _ResolvePipeRoot<T> extends { item: infer I }
    ? ArrayFormFieldConfig<InferFormFieldConfig<I, _D, readonly [...TPath, number]>, TPath>
    : ArrayFormFieldConfig<FormFieldConfig, TPath>;

type _InferTupleConfig<T, _D extends unknown[], TPath extends Path> =
  _ResolvePipeRoot<T> extends { items: infer Items extends readonly unknown[] }
    ? // Plain arrays (length is `number`) → use default; typed tuples → map each position
      number extends Items["length"]
      ? TupleFormFieldConfig<FormFieldConfig[], TPath>
      : TupleFormFieldConfig<
          _InferTupleItems<Items, _D, TPath> extends infer R extends FormFieldConfig[]
            ? R
            : FormFieldConfig[],
          TPath
        >
    : TupleFormFieldConfig<FormFieldConfig[], TPath>;

type _InferRecordConfig<T, _D extends unknown[], TPath extends Path> =
  _ResolvePipeRoot<T> extends { key: infer K; value: infer V }
    ? RecordFormFieldConfig<
        InferFormFieldConfig<K, _D, readonly [...TPath, "key"]>,
        InferFormFieldConfig<V, _D, readonly [...TPath, "value"]>,
        TPath
      >
    : RecordFormFieldConfig<FormFieldConfig, FormFieldConfig, TPath>;

// ─── Main inference type ──────────────────────────────────────────────────────

/**
 * Infers the narrowed {@link FormFieldConfig} variant for a given Valibot
 * schema or AST node type.
 *
 * Works on both Valibot schema types (e.g. `ObjectSchema`, `StringSchema`) and
 * valibot-ast nodes (e.g. `ObjectASTNode`, `PrimitiveASTNode`) because they
 * share the same `.type` string discriminator:
 *
 * - Wrapper layers (optional, nullable, nullish, …) are unwrapped via `.wrapped`.
 * - `SchemaWithPipe` is handled transparently — its `.type` is inherited from
 *   the root schema, and when the root is a wrapper, the pipe array is followed.
 * - **Object** schemas: `fields` is narrowed to the union of entry config types,
 *   each carrying its own `path` tuple (e.g. `readonly ["key"]`).
 * - **Array** schemas: `item` is narrowed to the item schema's config type with
 *   path extended by `number` (e.g. `readonly ["list", number]`).
 * - **Tuple** schemas: `items` is a mapped tuple with per-position types and
 *   literal numeric path segments (e.g. `readonly [0]`, `readonly [1]`).
 * - **Record** schemas: `keyField` gets path `[…, "key"]`, `valueField` gets `[…, "value"]`.
 * - Primitives, literals, enums, and picklists map to {@link LeafFormFieldConfig}
 *   with the current path.
 * - Unions may resolve to either a leaf (all-literal options) or a full
 *   {@link UnionFormFieldConfig} — the type returns the union of both.
 *
 * When the input is a wide type (the generic `ASTNode` union or `GenericSchema`),
 * the type gracefully falls back to the full `FormFieldConfig` union.
 *
 * @example
 * ```ts
 * import * as v from "valibot";
 * import type { InferFormFieldConfig } from "formisch-utils";
 *
 * // Root leaf — path is the empty tuple
 * type StrCfg = InferFormFieldConfig<typeof v.string()>;
 * //   ^? LeafFormFieldConfig<readonly []>
 * //   StrCfg["path"] → readonly []
 *
 * // Object — children carry literal-key paths
 * type Cfg = InferFormFieldConfig<typeof v.object({ name: v.string() })>;
 * //   ^? ObjectFormFieldConfig<LeafFormFieldConfig<readonly ["name"]>, readonly []>
 * //   Cfg["fields"][number]["path"] → readonly ["name"]
 *
 * // Array — item carries a numeric path segment
 * type ArrCfg = InferFormFieldConfig<typeof v.array(v.string())>;
 * //   ^? ArrayFormFieldConfig<LeafFormFieldConfig<readonly [number]>, readonly []>
 * //   ArrCfg["item"]["path"] → readonly [number]
 *
 * // Tuple — each position independently typed with its index
 * type WizCfg = InferFormFieldConfig<typeof v.tuple([v.object({…}), v.object({…})])>;
 * //   ^? TupleFormFieldConfig<[ObjectFormFieldConfig<…, readonly [0]>, ObjectFormFieldConfig<…, readonly [1]>], readonly []>
 * //   WizCfg["items"][0]["path"] → readonly [0]
 * ```
 */
export type InferFormFieldConfig<
  T,
  _D extends unknown[] = [0, 0, 0, 0, 0],
  TPath extends Path = readonly [],
> = _D extends [unknown, ...infer _DRest]
  ? T extends { type: infer TType extends string }
    ? TType extends _WrappedType
      ? // Wrapper type: pass TPath through unchanged — the path belongs to the field itself, not its wrapper layer.
        T extends { wrapped: infer W }
        ? // Guard: if W is as wide as ASTNode stop recursion to avoid exponential blowup.
          [ASTNode] extends [W]
          ? FormFieldConfig
          : InferFormFieldConfig<W, _DRest, TPath>
        : // SchemaWithPipe: follow `.pipe[0]` to reach the actual wrapper.
          T extends { pipe: readonly [infer PipeRoot, ...unknown[]] }
          ? InferFormFieldConfig<PipeRoot, _DRest, TPath>
          : FormFieldConfig
      : // Structural types: recurse into children (children get extended paths)
        TType extends _ObjectType
        ? _InferObjectConfig<T, _DRest, TPath>
        : TType extends "array"
          ? _InferArrayConfig<T, _DRest, TPath>
          : TType extends _TupleType
            ? _InferTupleConfig<T, _DRest, TPath>
            : TType extends "record"
              ? _InferRecordConfig<T, _DRest, TPath>
              : // Non-structural: flat lookup with path
                TType extends keyof _FormFieldConfigMap
                ? _FormFieldConfigMap<TPath>[TType]
                : FormFieldConfig
    : FormFieldConfig
  : // Depth exceeded → graceful fallback
    FormFieldConfig;
