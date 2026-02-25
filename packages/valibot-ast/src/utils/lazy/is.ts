import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GenericLazySchema, GenericLazySchemaAsync } from "./types.ts";

// @__NO_SIDE_EFFECTS__
export function isLazySchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericLazySchema | GenericLazySchemaAsync) {
  return "type" in schema && schema.type === "lazy";
}
