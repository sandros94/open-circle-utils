import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GetArrayItem, GetTupleItems, GetTupleRest } from "./types.ts";
import { isArraySchema, isTupleSchema, isTupleWithRestSchema } from "./is.ts";

// @__NO_SIDE_EFFECTS__
export function getArrayItem<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetArrayItem<TSchema> {
  if (!isArraySchema(schema)) {
    return null as GetArrayItem<TSchema>;
  }
  return schema.item as GetArrayItem<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getTupleItems<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetTupleItems<TSchema> {
  if (!isTupleSchema(schema)) {
    return null as GetTupleItems<TSchema>;
  }
  return schema.items as GetTupleItems<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getTupleRest<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetTupleRest<TSchema> {
  if (!isTupleWithRestSchema(schema)) {
    return null as GetTupleRest<TSchema>;
  }
  return schema.rest as GetTupleRest<TSchema>;
}
