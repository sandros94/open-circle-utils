import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GenericSchemaWithPipe, GenericSchemaWithPipeAsync } from "./types.ts";

/**
 * Check if a schema has a pipe property.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema has a pipe.
 */
// @__NO_SIDE_EFFECTS__
export function hasPipe<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericSchemaWithPipe | GenericSchemaWithPipeAsync) {
  return "pipe" in schema && Array.isArray(schema.pipe);
}
