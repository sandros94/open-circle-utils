import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GenericRecordSchema, GenericRecordSchemaAsync } from "./types.ts";

// @__NO_SIDE_EFFECTS__
export function isRecordSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericRecordSchema | GenericRecordSchemaAsync) {
  return "type" in schema && schema.type === "record";
}
