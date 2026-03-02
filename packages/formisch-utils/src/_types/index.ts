/**
 * Core types for formisch-utils.
 */

import type { ASTNode } from "valibot-ast";
import type { Path } from "./utils.ts";

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
 */
interface _FormFieldConfigMap<_Path extends Path> {
  // Discriminated union
  variant: VariantFormFieldConfig<_Path>;
  // Non-discriminated union (may resolve to a leaf OR a full union config)
  union: LeafFormFieldConfig<_Path> | UnionFormFieldConfig<_Path>;
  // Intersect (may merge to object or be unsupported)
  intersect: ObjectFormFieldConfig<FormFieldConfig, _Path> | UnsupportedFormFieldConfig<_Path>;
  // Leaf: choice types
  enum: LeafFormFieldConfig<_Path>;
  picklist: LeafFormFieldConfig<_Path>;
  literal: LeafFormFieldConfig<_Path>;
  // Leaf: primitives
  string: LeafFormFieldConfig<_Path>;
  number: LeafFormFieldConfig<_Path>;
  boolean: LeafFormFieldConfig<_Path>;
  bigint: LeafFormFieldConfig<_Path>;
  date: LeafFormFieldConfig<_Path>;
  blob: LeafFormFieldConfig<_Path>;
  file: LeafFormFieldConfig<_Path>;
  symbol: LeafFormFieldConfig<_Path>;
  any: LeafFormFieldConfig<_Path>;
  unknown: LeafFormFieldConfig<_Path>;
  never: LeafFormFieldConfig<_Path>;
  nan: LeafFormFieldConfig<_Path>;
  null: LeafFormFieldConfig<_Path>;
  undefined: LeafFormFieldConfig<_Path>;
  void: LeafFormFieldConfig<_Path>;
  promise: LeafFormFieldConfig<_Path>;
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
 * Map an object's `entries` record to the union of each entry's inferred config.
 *
 * For `{ name: StringSchema; age: NumberSchema }` this produces
 * `LeafFormFieldConfig` (both entries map to the same config variant).
 *
 * For mixed entries the result is a union:
 * `LeafFormFieldConfig | ObjectFormFieldConfig<…>`.
 */
type _InferEntryConfigs<E, _D extends unknown[], _Path extends Path> = {
  [K in keyof E & string]: InferFormFieldConfig<E[K], _D, readonly [..._Path, K]>;
}[keyof E & string];

/**
 * Recursively map a tuple schema's `.items` to a typed config tuple.
 *
 * `[StringSchema, NumberSchema]` → `[LeafFormFieldConfig, LeafFormFieldConfig]`
 * `[StringSchema, ObjectSchema<…>]` → `[LeafFormFieldConfig, ObjectFormFieldConfig<…>]`
 *
 * Each position is independently narrowed — ideal for wizard step inference.
 */
type _InferTupleItems<
  T extends readonly unknown[],
  _D extends unknown[],
  _Path extends Path,
  _I extends unknown[] = [],
> = T extends readonly [infer Head, ...infer Tail]
  ? [
      InferFormFieldConfig<Head, _D, readonly [..._Path, `${_I["length"]}`]>,
      ..._InferTupleItems<Tail, _D, _Path, [..._I, unknown]>,
    ]
  : [];

// ─── Per-structural-kind config builders ──────────────────────────────────────

type _InferObjectConfig<T, _D extends unknown[], _Path extends Path> =
  _ResolvePipeRoot<T> extends { entries: infer E extends Record<string, unknown> }
    ? ObjectFormFieldConfig<_InferEntryConfigs<E, _D, _Path>, _Path>
    : ObjectFormFieldConfig;

type _InferArrayConfig<T, _D extends unknown[], _Path extends Path> =
  _ResolvePipeRoot<T> extends { item: infer I }
    ? ArrayFormFieldConfig<InferFormFieldConfig<I, _D, readonly [..._Path, string]>, _Path>
    : ArrayFormFieldConfig;

type _InferTupleConfig<T, _D extends unknown[], _Path extends Path> =
  _ResolvePipeRoot<T> extends { items: infer Items extends readonly unknown[] }
    ? // Plain arrays (length is `number`) → use default; typed tuples → map each position
      number extends Items["length"]
      ? TupleFormFieldConfig
      : TupleFormFieldConfig<
          _InferTupleItems<Items, _D, _Path> extends infer R extends FormFieldConfig[]
            ? R
            : FormFieldConfig[],
          _Path
        >
    : TupleFormFieldConfig;

type _InferRecordConfig<T, _D extends unknown[], _Path extends Path> =
  _ResolvePipeRoot<T> extends { key: infer K; value: infer V }
    ? RecordFormFieldConfig<
        InferFormFieldConfig<K, _D, readonly [..._Path, "key"]>,
        InferFormFieldConfig<V, _D, readonly [..._Path, "value"]>,
        _Path
      >
    : RecordFormFieldConfig;

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
 * - **Object** schemas: `fields` is narrowed to the union of entry config types.
 * - **Array** schemas: `item` is narrowed to the item schema's config type.
 * - **Tuple** schemas: `items` is a mapped tuple with per-position types.
 * - **Record** schemas: `keyField` and `valueField` are individually narrowed.
 * - Primitives, literals, enums, and picklists map to {@link LeafFormFieldConfig}.
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
 * // Deep child inference — no casts needed
 * type Cfg = InferFormFieldConfig<typeof v.object({ name: v.string() })>;
 * //   ^? ObjectFormFieldConfig<LeafFormFieldConfig>
 * //   Cfg["fields"][number] → LeafFormFieldConfig
 *
 * type ArrCfg = InferFormFieldConfig<typeof v.array(v.string())>;
 * //   ^? ArrayFormFieldConfig<LeafFormFieldConfig>
 * //   ArrCfg["item"] → LeafFormFieldConfig
 *
 * type WizCfg = InferFormFieldConfig<typeof v.tuple([v.object({…}), v.object({…})])>;
 * //   ^? TupleFormFieldConfig<[ObjectFormFieldConfig<…>, ObjectFormFieldConfig<…>]>
 * //   WizCfg["items"][0] → ObjectFormFieldConfig<…>  (per-step type)
 * ```
 */
export type InferFormFieldConfig<
  T,
  _D extends unknown[] = [0, 0, 0, 0, 0],
  _Path extends Path = readonly [],
> = _D extends [unknown, ...infer _DRest]
  ? T extends { type: infer TType extends string }
    ? TType extends _WrappedType
      ? // Wrapper type: unwrap through `.wrapped` (direct wrappers & ASTNodes)
        T extends { wrapped: infer W }
        ? // Guard: if W is as wide as ASTNode stop recursion to avoid exponential blowup.
          [ASTNode] extends [W]
          ? FormFieldConfig
          : InferFormFieldConfig<W, _DRest, _Path>
        : // SchemaWithPipe follow `.pipe[0]` to reach the actual wrapper.
          T extends { pipe: readonly [infer PipeRoot, ...unknown[]] }
          ? InferFormFieldConfig<PipeRoot, _DRest, _Path>
          : FormFieldConfig
      : // ── Structural types: recurse into children ──
        TType extends _ObjectType
        ? _InferObjectConfig<T, _DRest, _Path>
        : TType extends "array"
          ? _InferArrayConfig<T, _DRest, _Path>
          : TType extends _TupleType
            ? _InferTupleConfig<T, _DRest, _Path>
            : TType extends "record"
              ? _InferRecordConfig<T, _DRest, _Path>
              : // ── Non-structural: flat lookup ──
                TType extends keyof _FormFieldConfigMap<_Path>
                ? _FormFieldConfigMap<_Path>[TType]
                : FormFieldConfig
    : FormFieldConfig
  : // Depth exceeded → graceful fallback
    FormFieldConfig;
