/**
 * Qwik adapter for formisch-utils.
 *
 * Combines `buildFormFields` + `generateInitialInput` with `@formisch/qwik`'s
 * `useForm$` hook into a single `useFormFields$` hook.
 *
 * Note: Qwik requires state to be serializable for SSR resumability. The
 * `FormFieldConfig[]` returned by `buildFormFields` contains only plain objects,
 * so it is safely serializable by Qwik's store mechanism.
 *
 * @requires @formisch/qwik
 * @requires @qwik.dev/core
 */

import { useForm$ } from "@formisch/qwik";
import type { FormStore, DeepPartial } from "@formisch/qwik";
import type { GenericSchema, InferInput } from "valibot";
import { buildFormFields } from "../build-form-fields.ts";
import { generateInitialInput } from "../generate-initial-input.ts";
import { deepMerge } from "../_internal/deep-merge.ts";
import type { InferFormFieldConfig } from "../_types/index.ts";

// Re-export everything from the core so consumers only need one import path
export * from "../index.ts";
export type { FormStore, SubmitHandler, DeepPartial } from "@formisch/qwik";

// ─── Options & Result ─────────────────────────────────────────────────────────

export interface UseFormFieldsOptions<S extends GenericSchema> {
  /**
   * Override specific initial input values.
   * Deep-merged on top of the auto-generated defaults from `generateInitialInput`.
   * Must be serializable for Qwik SSR resumability.
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
  /** Root `FormFieldConfig` tree derived from the schema, narrowed to the exact config variant. */
  config: InferFormFieldConfig<S>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Qwik hook that creates a Formisch form store together with the `FormFieldConfig`
 * tree derived from the schema. Equivalent to calling `buildFormFields` +
 * `generateInitialInput` + `useForm$` manually.
 *
 * @param schema  - A Valibot schema describing the form structure.
 * @param options - Optional overrides for `initialInput` and validation timing.
 *
 * @example
 * ```tsx
 * export default component$(() => {
 *   const { form, config } = useFormFields$(MySchema);
 *
 *   return (
 *     <Form of={form} onSubmit$={(output) => console.log(output)}>
 *       {config.kind === "object" && config.fields.map((field) => (
 *         <DynamicField of={form} config={field} />
 *       ))}
 *     </Form>
 *   );
 * });
 * ```
 */
export function useFormFields$<S extends GenericSchema>(
  schema: S,
  options?: UseFormFieldsOptions<S>
): UseFormFieldsResult<S> {
  const config = buildFormFields(schema);
  const generated = generateInitialInput(schema) as Record<string, unknown>;
  const initialInput = (
    options?.initialInput
      ? deepMerge(generated, options.initialInput as Record<string, unknown>)
      : generated
  ) as DeepPartial<InferInput<S>>;

  const form = useForm$({
    schema,
    initialInput,
    validate: options?.validate,
    revalidate: options?.revalidate,
  });
  return { form, config } as UseFormFieldsResult<S>;
}
