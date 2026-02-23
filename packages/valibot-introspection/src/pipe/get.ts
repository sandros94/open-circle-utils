// deno-lint-ignore-file ban-types
import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type {
  GenericSchemaWithPipe,
  GenericSchemaWithPipeAsync,
  GetPipeItems,
  GetPipeActions,
  FindPipeItems,
  GetLengthActions,
  GetValueActions,
  GetSizeActions,
  GetBytesActions,
} from "./types.ts";
import { hasPipe } from "./is.ts";

/**
 * Get the pipe from a schema.
 *
 * @param schema The schema to extract from.
 *
 * @returns The pipe array, or null if no pipe exists.
 */
// @__NO_SIDE_EFFECTS__
export function getPipeItems<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetPipeItems<TSchema> {
  if (!hasPipe(schema)) {
    return null as GetPipeItems<TSchema>;
  }

  return schema.pipe as GetPipeItems<TSchema>;
}

/**
 * Get all actions from a schema's pipe (validations, transformations and metadata).
 *
 * @param schema The schema to extract from.
 *
 * @returns Array of pipe actions, or null if no pipe.
 */
// @__NO_SIDE_EFFECTS__
export function getPipeActions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetPipeActions<TSchema> {
  if (!hasPipe(schema)) {
    return null as GetPipeActions<TSchema>;
  }

  return [...schema.pipe].filter((item) => item.kind !== "schema") as GetPipeActions<TSchema>;
}

/**
 * Find pipe items matching the given filters.
 *
 * @param schema The schema to extract from.
 * @param filters The filters to apply.
 *
 * @returns Array of matching pipe items, or null if no pipe.
 */
// @__NO_SIDE_EFFECTS__
export function findPipeItems<
  TSchema extends GenericSchema | GenericSchemaAsync,
  TFilters extends Partial<{
    kind: (TSchema extends GenericSchemaWithPipe | GenericSchemaWithPipeAsync
      ? GetPipeItems<TSchema>[number]["kind"] | (string & {})
      : string)[];
    type: (TSchema extends GenericSchemaWithPipe | GenericSchemaWithPipeAsync
      ? GetPipeItems<TSchema>[number]["type"] | (string & {})
      : string)[];
  }>,
>(schema: TSchema, filters: TFilters): FindPipeItems<TSchema, TFilters> {
  if (!hasPipe(schema)) {
    return null as FindPipeItems<TSchema, TFilters>;
  }

  return [...schema.pipe].filter((item) => {
    let kindMatch = true;
    let typeMatch = true;

    if (filters.kind) {
      kindMatch = filters.kind.includes(item.kind as any);
    }

    if (filters.type) {
      typeMatch = filters.type.includes(item.type as any);
    }

    return kindMatch && typeMatch;
  }) as FindPipeItems<TSchema, TFilters>;
}

/**
 * Get all transformation actions from a schema's pipe.
 *
 * @param schema The schema to extract from.
 *
 * @returns Array of transformation actions, or null if no pipe.
 */
// @__NO_SIDE_EFFECTS__
export function getTransformationActions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetPipeActions<TSchema> {
  if (!hasPipe(schema)) {
    return null as GetPipeActions<TSchema>;
  }

  return [...schema.pipe].filter(
    (item) => item.kind === "transformation"
  ) as GetPipeActions<TSchema>;
}

/**
 * Get all validation actions from a schema's pipe.
 *
 * @param schema The schema to extract from.
 *
 * @returns Array of validation actions, or null if no pipe.
 */
// @__NO_SIDE_EFFECTS__
export function getValidationActions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetPipeActions<TSchema> {
  if (!hasPipe(schema)) {
    return null as GetPipeActions<TSchema>;
  }

  return [...schema.pipe].filter((item) => item.kind === "validation") as GetPipeActions<TSchema>;
}

/**
 * Get all length constraint actions from a schema's pipe.
 *
 * @param schema The schema to extract from.
 *
 * @returns Array of length constraint actions, or null if no pipe.
 */
// @__NO_SIDE_EFFECTS__
export function getLengthActions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetLengthActions<TSchema> {
  if (!hasPipe(schema)) {
    return null as GetLengthActions<TSchema>;
  }

  return [...schema.pipe].filter(
    (item) => item.type === "min_length" || item.type === "max_length" || item.type === "length"
  ) as GetLengthActions<TSchema>;
}

/**
 * Get all value constraint actions from a schema's pipe.
 *
 * @param schema The schema to extract from.
 *
 * @returns Array of value constraint actions, or null if no pipe.
 */
// @__NO_SIDE_EFFECTS__
export function getValueActions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetValueActions<TSchema> {
  if (!hasPipe(schema)) {
    return null as GetValueActions<TSchema>;
  }

  return [...schema.pipe].filter(
    (item) => item.type === "min_value" || item.type === "max_value" || item.type === "value"
  ) as GetValueActions<TSchema>;
}

/**
 * Get all size constraint actions from a schema's pipe.
 *
 * @param schema The schema to extract from.
 *
 * @returns Array of size constraint actions, or null if no pipe.
 */
// @__NO_SIDE_EFFECTS__
export function getSizeActions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetSizeActions<TSchema> {
  if (!hasPipe(schema)) {
    return null as GetSizeActions<TSchema>;
  }

  return [...schema.pipe].filter(
    (item) => item.type === "min_size" || item.type === "max_size" || item.type === "size"
  ) as GetSizeActions<TSchema>;
}

/**
 * Get all bytes constraint actions from a schema's pipe.
 *
 * @param schema The schema to extract from.
 *
 * @returns Array of bytes constraint actions, or null if no pipe.
 */
// @__NO_SIDE_EFFECTS__
export function getBytesActions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetBytesActions<TSchema> {
  if (!hasPipe(schema)) {
    return null as GetBytesActions<TSchema>;
  }

  return [...schema.pipe].filter(
    (item) => item.type === "min_bytes" || item.type === "max_bytes" || item.type === "bytes"
  ) as GetBytesActions<TSchema>;
}
