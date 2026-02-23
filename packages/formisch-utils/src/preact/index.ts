/**
 * Preact adapter for formisch-utils.
 *
 * Combines `buildFormFields` + `generateInitialInput` with `@formisch/preact`'s
 * `useForm` hook into a single `useFormFields` hook.
 *
 * @requires @formisch/preact
 */

import { useForm } from "@formisch/preact";
import type { FormStore, DeepPartial } from "@formisch/preact";
import type { GenericSchema, InferInput } from "valibot";
import { buildFormFields } from "../build-form-fields.ts";
import { generateInitialInput } from "../generate-initial-input.ts";
import type { FormFieldConfig } from "../types.ts";

// Re-export everything from the core so consumers only need one import path
export * from "../index.ts";
export type { FormStore, SubmitHandler, DeepPartial } from "@formisch/preact";

// ─── Options & Result ─────────────────────────────────────────────────────────

export interface UseFormFieldsOptions<S extends GenericSchema> {
  /**
   * Override specific initial input values.
   * Merged on top of the auto-generated defaults from `generateInitialInput`.
   */
  initialInput?: DeepPartial<InferInput<S>>;
  /** When first validation occurs. Defaults to `'submit'`. */
  validate?: "initial" | "blur" | "input" | "submit";
  /** When revalidation occurs after first validation. Defaults to `'input'`. */
  revalidate?: "blur" | "input" | "submit";
}

export interface UseFormFieldsResult<S extends GenericSchema> {
  /** The Formisch form store. Pass to `<Form of={form}>` and `<Field of={form}>`. */
  form: FormStore<S>;
  /** Root `FormFieldConfig` tree derived from the schema. */
  config: FormFieldConfig;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Preact hook that creates a Formisch form store together with the `FormFieldConfig`
 * tree derived from the schema. Equivalent to calling `buildFormFields` +
 * `generateInitialInput` + `useForm` manually.
 *
 * @param schema  - A Valibot schema describing the form structure.
 * @param options - Optional overrides for `initialInput` and validation timing.
 *
 * @example
 * ```tsx
 * const { form, config } = useFormFields(MySchema);
 *
 * return (
 *   <Form of={form} onSubmit={handleSubmit}>
 *     {config.kind === "object" && config.fields.map(field => (
 *       <DynamicField key={field.key} of={form} config={field} />
 *     ))}
 *   </Form>
 * );
 * ```
 */
export function useFormFields<S extends GenericSchema>(
  schema: S,
  options?: UseFormFieldsOptions<S>,
): UseFormFieldsResult<S> {
  const config = buildFormFields(schema);
  const form = useForm({
    schema,
    initialInput: Object.assign(
      {},
      generateInitialInput(schema),
      options?.initialInput,
    ) as DeepPartial<InferInput<S>>,
    validate: options?.validate,
    revalidate: options?.revalidate,
  });
  return { form, config };
}
