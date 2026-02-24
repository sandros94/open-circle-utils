import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GenericWrappedSchema, GenericWrappedSchemaAsync } from "./types.ts";

// @__NO_SIDE_EFFECTS__
export function isWrappedSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericWrappedSchema | GenericWrappedSchemaAsync) {
  return "type" in schema && "wrapped" in schema;
}
