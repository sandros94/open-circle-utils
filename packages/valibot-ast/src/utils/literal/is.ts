import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GenericLiteralSchema } from "./types.ts";

// @__NO_SIDE_EFFECTS__
export function isLiteralSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericLiteralSchema<any> {
  return "type" in schema && schema.type === "literal";
}
