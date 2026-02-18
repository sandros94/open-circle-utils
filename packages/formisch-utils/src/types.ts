/**
 * Core types for formisch-utils.
 */

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
 */
export interface UnwrappedASTNode {
  /** The innermost non-wrapper schema node. */
  node: import("valibot-ast").ASTNode;
  /** False when any wrapper allows `undefined` (optional/nullish/undefinedable/exact_optional). */
  required: boolean;
  /** True when any wrapper allows `null` (nullable/nullish). */
  nullable: boolean;
  /** The default value from the outermost wrapper that carries one, if any. */
  default?: unknown;
}

// ─── FormFieldConfig ──────────────────────────────────────────────────────────

/**
 * Base fields shared by every variant of FormFieldConfig.
 */
export interface BaseFormFieldConfig {
  /** The field's own key (last segment of `path`). Empty string for the root node. */
  key: string;
  /** Full path from the form root, ready for Formisch `path` props. */
  path: string[];
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
export interface LeafFormFieldConfig extends BaseFormFieldConfig {
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
 */
export interface ObjectFormFieldConfig extends BaseFormFieldConfig {
  kind: "object";
  /**
   * Ordered field configs for each entry, preserving schema definition order.
   * Consumers render these in sequence.
   */
  fields: FormFieldConfig[];
}

/**
 * A dynamic array field, maps to Formisch `FieldArray`.
 */
export interface ArrayFormFieldConfig extends BaseFormFieldConfig {
  kind: "array";
  /** Template config used for every dynamically-added item. */
  item: FormFieldConfig;
}

/**
 * A fixed-length positional array field.
 *
 * Also the natural representation for **multi-step (wizard) forms** when
 * the root schema is `v.tuple([step1Schema, step2Schema, …])`:
 * each `items[i]` is an `ObjectFormFieldConfig` representing one step,
 * and its `label` / `description` come from `v.title()` / `v.description()`
 * on that step's schema.
 */
export interface TupleFormFieldConfig extends BaseFormFieldConfig {
  kind: "tuple";
  /** Positional configs. Index corresponds to tuple position (= step number for wizards). */
  items: FormFieldConfig[];
}

/**
 * A non-discriminated union field.
 *
 * UI metaphor: tabs or a radio group at the top that reveals one sub-form at a time.
 * Only the selected branch participates in validation and submission.
 * Each option is an ordered list of fields that must all be valid together.
 */
export interface UnionFormFieldConfig extends BaseFormFieldConfig {
  kind: "union";
  options: FormFieldConfig[][];
}

/**
 * A discriminated union field (Valibot `v.variant()`).
 *
 * UI metaphor: a selector (dropdown/tabs) driven by the discriminator key.
 * Changing the discriminator value switches the visible branch.
 */
export interface VariantFormFieldConfig extends BaseFormFieldConfig {
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
 * A field whose AST node type could not be mapped to a known form construct.
 * Emitted for: `lazy` (without a resolved schema), `instance`, `function`, `map`, `set`, `record`.
 * Consumers can inspect `nodeType` and handle these cases manually.
 */
export interface UnsupportedFormFieldConfig extends BaseFormFieldConfig {
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
  | UnsupportedFormFieldConfig;
