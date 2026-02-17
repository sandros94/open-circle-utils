import { getWrappedSchema, getSchemaInfo } from "valibot-introspection";
import {
  type GenericSchema,
  type GenericSchemaAsync,
  getTitle,
  getDescription,
} from "valibot";

// ---- public API ----

/**
 * Infers a label string from a Valibot schema's `title()` action.
 *
 * The schema is automatically unwrapped (optional, nullable, nullish wrappers
 * are stripped) before inspection, so the title from the inner schema is returned.
 *
 * @param schema - The Valibot schema to inspect
 * @returns The schema title if set via `v.title()`, otherwise `undefined`
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import { inferLabel } from 'formisch-utils';
 *
 * inferLabel(v.pipe(v.string(), v.title("Email Address")))
 * // "Email Address"
 *
 * inferLabel(v.optional(v.pipe(v.string(), v.title("Name"))))
 * // "Name"
 *
 * inferLabel(v.string())
 * // undefined
 * ```
 */
export function inferLabel<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(schema: TSchema): string | undefined {
  const { schema: unwrapped } = getWrappedSchema(schema);
  return getTitle(unwrapped);
}

/**
 * Infers a description string from a Valibot schema's `description()` action.
 *
 * The schema is automatically unwrapped (optional, nullable, nullish wrappers
 * are stripped) before inspection, so the description from the inner schema is returned.
 *
 * @param schema - The Valibot schema to inspect
 * @returns The schema description if set via `v.description()`, otherwise `undefined`
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import { inferDescription } from 'formisch-utils';
 *
 * inferDescription(v.pipe(v.string(), v.description("Your primary email address")))
 * // "Your primary email address"
 *
 * inferDescription(v.optional(v.pipe(v.number(), v.description("Age in years"))))
 * // "Age in years"
 *
 * inferDescription(v.string())
 * // undefined
 * ```
 */
export function inferDescription<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(schema: TSchema): string | undefined {
  const { schema: unwrapped } = getWrappedSchema(schema);
  return getDescription(unwrapped);
}

/**
 * Infers a placeholder string from a Valibot schema's `metadata({ placeholder: "..." })` action or from the first example value.
 *
 * The schema is automatically unwrapped (optional, nullable, nullish wrappers
 * are stripped) before inspection, so the metadata from the inner schema is returned.
 *
 * @param schema - The Valibot schema to inspect
 * @returns The placeholder string if set via `v.metadata({ placeholder: "..." })` or the first example value, otherwise `undefined`
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import { inferPlaceholder } from 'formisch-utils';
 *
 * inferPlaceholder(v.pipe(v.string(), v.metadata({ placeholder: "Enter your name" })))
 * // "Enter your name"
 *
 * inferPlaceholder(v.optional(v.pipe(v.number(), v.examples(42))))
 * // "42"
 *
 * inferPlaceholder(v.string())
 * // undefined
 * ```
 */
export function inferPlaceholder<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(schema: TSchema): string | undefined {
  const { schema: unwrapped } = getWrappedSchema(schema);
  const info = getSchemaInfo(unwrapped);

  const placeholder = info.metadata?.placeholder;
  if (typeof placeholder === "string") return placeholder;

  const examples = info.examples as readonly unknown[];
  if (examples.length === 0) return undefined;
  const first = examples[0];
  if (first === null || first === undefined) return undefined;
  return String(first);
}
