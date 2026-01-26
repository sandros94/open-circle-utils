import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GenericLiteralSchema } from "./types.ts";

/**
 * Check if a schema is a literal schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a literal schema.
 */
// @__NO_SIDE_EFFECTS__
export function isLiteralSchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(schema: TSchema): schema is TSchema & GenericLiteralSchema<any> {
  if (!("type" in schema)) return false;

  return schema.type === "literal";
}
