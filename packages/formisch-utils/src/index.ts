/**
 * formisch-utils
 *
 * AST-first utilities for building Formisch forms from Valibot schemas.
 * Accepts either a raw Valibot schema or a valibot-ast `ASTNode` / `ASTDocument`.
 *
 * ## Layer overview
 *
 * **Layer 1 — single-node utilities** (pure AST-in, tree-shakeable):
 *   - `unwrapASTNode`          — peel optional/nullable/… wrappers
 *   - `inferMeta`              — extract label, description, placeholder
 *   - `inferInputType`         — map AST type → HTML input type attribute
 *   - `inferInputConstraints`  — derive HTML constraint attributes from pipe validations
 *   - `inferInitialValue`      — compute a sensible default for a single node
 *
 * **Layer 2 — FormFieldConfig tree** (framework-agnostic):
 *   - `generateInitialInput`   — full `initialInput` object for Formisch
 *   - `buildFormFields`        — full recursive `FormFieldConfig` tree
 *   - `buildObjectFields`      — convenience: flat `FormFieldConfig[]` for object entries
 *
 * @module formisch-utils
 */

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  InputConstraints,
  FormFieldOption,
  FormFieldMeta,
  UnwrappedASTNode,
  BaseFormFieldConfig,
  LeafFormFieldConfig,
  ObjectFormFieldConfig,
  ArrayFormFieldConfig,
  TupleFormFieldConfig,
  UnionFormFieldConfig,
  VariantFormFieldConfig,
  UnsupportedFormFieldConfig,
  FormFieldConfig,
} from "./types.ts";

// ── Layer 1: single-node utilities ────────────────────────────────────────────
export { unwrapASTNode } from "./unwrap-ast-node.ts";
export { inferMeta } from "./infer-meta.ts";
export { inferInputType } from "./infer-input-type.ts";
export { inferInputConstraints } from "./infer-input-constraints.ts";
export { inferInitialValue } from "./infer-initial-value.ts";

// ── Layer 2: FormFieldConfig tree ─────────────────────────────────────────────
export { generateInitialInput } from "./generate-initial-input.ts";
export {
  buildFormFields,
  buildObjectFields,
  type BuildFormFieldsOptions,
} from "./build-form-fields.ts";
