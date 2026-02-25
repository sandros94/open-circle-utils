import type {
  GenericSchema,
  GenericSchemaAsync,
  InferIssue,
  UnknownDataset,
  Config,
} from "valibot";
import { getDefault } from "valibot";

import type { GetWrappedSchema } from "./types.ts";
import { isWrappedSchema } from "./is.ts";

/**
 * Recursively unwraps all wrapper layers (optional, nullable, nullish, etc.)
 * and extracts required/nullable flags using outermost-wins semantics.
 *
 * @param schema The schema to unwrap.
 * @param dataset Optional dataset for resolving function defaults.
 * @param config Optional config for resolving function defaults.
 * @returns Unwrapped schema info with required, nullable, and default value.
 */
// @__NO_SIDE_EFFECTS__
export function getWrappedSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema,
  dataset?: UnknownDataset,
  config?: Config<InferIssue<TSchema>>
): GetWrappedSchema<TSchema> {
  if (!isWrappedSchema(schema)) {
    return {
      wasWrapped: false,
      schema,
    } as GetWrappedSchema<TSchema>;
  }

  let required: boolean | undefined;
  let nullable: boolean | undefined;

  const defaultValue = getDefault(schema, dataset, config);

  let currentSchema = schema as GenericSchema | GenericSchemaAsync;

  while ("wrapped" in currentSchema) {
    switch (currentSchema.type) {
      case "non_optional": {
        if (required === undefined) required = true;
        break;
      }
      case "non_nullable":
      case "non_nullish": {
        if (nullable === undefined) nullable = false;
        break;
      }
      case "nullable": {
        if (nullable === undefined) nullable = true;
        break;
      }
      case "nullish": {
        if (required === undefined) required = false;
        if (nullable === undefined) nullable = true;
        break;
      }
      case "exact_optional":
      case "optional":
      case "undefinedable": {
        if (required === undefined) required = false;
        break;
      }
    }

    currentSchema = currentSchema.wrapped as GenericSchema | GenericSchemaAsync;
  }

  return {
    wasWrapped: true,
    schema: currentSchema,
    required: required ?? true,
    nullable: nullable ?? false,
    defaultValue,
  } as GetWrappedSchema<TSchema>;
}
