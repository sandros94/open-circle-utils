import type {
  GenericSchema,
  GenericSchemaAsync,
  InferIssue,
  UnknownDataset,
  Config,
} from "valibot";
import { getDefault } from "valibot";

import type { GetUnwrappedSchema } from "./types.ts";
import { isWrappedSchema } from "./is.ts";

/**
 * Try to unwrap the wrapped schema. If the schema is not wrapped, it returns the original schema.
 * Recursively unwraps all nested wrappers.
 *
 * @param schema The schema to be unwrapped.
 *
 * @returns An object containing:
 * - wasWrapped: boolean indicating if the schema was wrapped.
 * - schema: the unwrapped core schema.
 * - required: boolean indicating if the schema is required (undefined if not wrapped).
 * - nullable: boolean indicating if the schema is nullable (undefined if not wrapped).
 * - defaultValue: the default value if provided (undefined if not wrapped).
 */
// @__NO_SIDE_EFFECTS__
export function getUnwrappedSchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema,
  dataset?: UnknownDataset,
  config?: Config<InferIssue<TSchema>>,
): GetUnwrappedSchema<TSchema> {
  if (!isWrappedSchema(schema)) {
    return {
      wasWrapped: false,
      schema,
    } as GetUnwrappedSchema<TSchema>;
  }

  let required: boolean | undefined;
  let nullable: boolean | undefined;

  // The default value should be from the outermost wrapper
  const defaultValue = getDefault(schema, dataset, config);

  let currentSchema: any = schema;

  // Recursively unwrap all layers, processing from outside to inside
  while ("wrapped" in currentSchema) {
    switch (currentSchema.type) {
      case "non_optional": {
        // Explicitly requires a value
        if (required === undefined) required = true;
        break;
      }
      case "non_nullable":
      case "non_nullish": {
        // Explicitly disallows null
        if (nullable === undefined) nullable = false;
        break;
      }
      case "nullable": {
        // Allows null
        if (nullable === undefined) nullable = true;
        break;
      }
      case "nullish": {
        // Allows both undefined and null
        if (required === undefined) required = false;
        if (nullable === undefined) nullable = true;
        break;
      }
      case "exact_optional":
      case "optional":
      case "undefinedable": {
        // Allows undefined
        if (required === undefined) required = false;
        break;
      }
    }

    currentSchema = currentSchema.wrapped;
  }

  return {
    wasWrapped: true,
    schema: currentSchema,
    required: required ?? true,
    nullable: nullable ?? false,
    defaultValue,
  } as GetUnwrappedSchema<TSchema>;
}
