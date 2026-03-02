/**
 * SolidJS adapter for formisch-utils.
 *
 * Combines `buildFormFields` + `generateInitialInput` with `@formisch/solid`'s
 * `createForm` primitive into a single `createFormFields` primitive.
 *
 * @requires @formisch/solid
 */

import { createForm } from "@formisch/solid";
import type { FormStore, DeepPartial } from "@formisch/solid";
import type { GenericSchema, InferInput } from "valibot";
import { buildFormFields } from "../build-form-fields.ts";
import { generateInitialInput } from "../generate-initial-input.ts";
import { deepMerge } from "../_internal/deep-merge.ts";
import type { InferFormFieldConfig } from "../_types/index.ts";

// Re-export everything from the core so consumers only need one import path
export * from "../index.ts";
export type { FormStore, SubmitHandler, DeepPartial } from "@formisch/solid";

// ─── Options & Result ─────────────────────────────────────────────────────────

export interface CreateFormFieldsOptions<S extends GenericSchema> {
  /**
   * Override specific initial input values.
   * Deep-merged on top of the auto-generated defaults from `generateInitialInput`.
   */
  initialInput?: DeepPartial<InferInput<S>>;
  /** When first validation occurs. Defaults to `'submit'`. */
  validate?: "initial" | "blur" | "input" | "submit";
  /** When revalidation occurs after first validation. Defaults to `'input'`. */
  revalidate?: "blur" | "input" | "submit";
}

export interface CreateFormFieldsResult<S extends GenericSchema> {
  /** The Formisch form store. Pass to `<Form of={form}>` and `<Field of={form}>`. */
  form: FormStore<S>;
  /** Root `FormFieldConfig` tree derived from the schema, narrowed to the exact config variant. */
  config: InferFormFieldConfig<S>;
}

// ─── Primitive ────────────────────────────────────────────────────────────────

/**
 * SolidJS primitive that creates a Formisch form store together with the `FormFieldConfig`
 * tree derived from the schema. Equivalent to calling `buildFormFields` +
 * `generateInitialInput` + `createForm` manually.
 *
 * @param schema  - A Valibot schema describing the form structure.
 * @param options - Optional overrides for `initialInput` and validation timing.
 *
 * @example
 * ```tsx
 * const { form, config } = createFormFields(MySchema);
 *
 * return (
 *   <Form of={form} onSubmit={handleSubmit}>
 *     <Show when={config.kind === "object"}>
 *       <For each={(config as ObjectFormFieldConfig).fields}>
 *         {(field) => <DynamicField of={form} config={field} />}
 *       </For>
 *     </Show>
 *   </Form>
 * );
 * ```
 */
export function createFormFields<S extends GenericSchema>(
  schema: S,
  options?: CreateFormFieldsOptions<S>
): CreateFormFieldsResult<S> {
  const config = buildFormFields(schema);
  const generated = generateInitialInput(schema) as Record<string, unknown>;
  const initialInput = (
    options?.initialInput
      ? deepMerge(generated, options.initialInput as Record<string, unknown>)
      : generated
  ) as DeepPartial<InferInput<S>>;

  const form = createForm({
    schema,
    initialInput,
    validate: options?.validate,
    revalidate: options?.revalidate,
  });
  return { form, config } as CreateFormFieldsResult<S>;
}
