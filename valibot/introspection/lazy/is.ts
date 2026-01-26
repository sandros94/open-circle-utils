import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GenericLazySchema, GenericLazySchemaAsync } from "./types.ts";

/**
 * Check if a schema is a lazy schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a lazy schema.
 */
// @__NO_SIDE_EFFECTS__
export function isLazySchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema,
): schema is TSchema & (GenericLazySchema | GenericLazySchemaAsync) {
  if (!("type" in schema)) return false;

  return schema.type === "lazy";
}
