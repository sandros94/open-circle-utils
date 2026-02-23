import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GetArrayItem, GetTupleItems, GetTupleRest } from "./types.ts";
import { isArraySchema, isTupleSchema, isTupleWithRestSchema } from "./is.ts";

/**
 * Get the item schema from an array schema.
 *
 * @param schema The schema to extract from.
 *
 * @returns The item schema, or null if not an array schema.
 */
// @__NO_SIDE_EFFECTS__
export function getArrayItem<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetArrayItem<TSchema> {
  if (!isArraySchema(schema)) {
    return null as GetArrayItem<TSchema>;
  }

  return schema.item as GetArrayItem<TSchema>;
}

/**
 * Get the items from a tuple schema.
 *
 * @param schema The schema to extract from.
 *
 * @returns The tuple items, or null if not a tuple schema.
 */
// @__NO_SIDE_EFFECTS__
export function getTupleItems<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetTupleItems<TSchema> {
  if (!isTupleSchema(schema)) {
    return null as GetTupleItems<TSchema>;
  }

  return schema.items as GetTupleItems<TSchema>;
}

/**
 * Get the rest schema from a tuple schema (if it has one).
 *
 * @param schema The schema to extract from.
 *
 * @returns The rest schema, or null if not a tuple schema or no rest schema.
 */
// @__NO_SIDE_EFFECTS__
export function getTupleRest<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetTupleRest<TSchema> {
  if (!isTupleWithRestSchema(schema)) {
    return null as GetTupleRest<TSchema>;
  }

  return schema.rest as GetTupleRest<TSchema>;
}
