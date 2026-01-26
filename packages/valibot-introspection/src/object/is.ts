import type {
  GenericSchema,
  GenericSchemaAsync,
  ObjectEntries,
  ObjectEntriesAsync,
  ObjectWithRestSchema,
  ObjectWithRestSchemaAsync,
  ErrorMessage,
  ObjectWithRestIssue,
} from "valibot";

import type { GenericObjectSchema, GenericObjectSchemaAsync } from "./types.ts";

/**
 * Check if a schema is an object-like schema (object, looseObject, strictObject, objectWithRest).
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is an object-like schema.
 */
// @__NO_SIDE_EFFECTS__
export function isObjectSchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema,
): schema is TSchema & (GenericObjectSchema | GenericObjectSchemaAsync) {
  if (!("type" in schema)) return false;

  return "entries" in schema;
}

/**
 * Check if a schema is a object with rest schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a object with rest schema.
 */
// @__NO_SIDE_EFFECTS__
export function isObjectWithRestSchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema,
): schema is TSchema &
  (
    | ObjectWithRestSchema<
        ObjectEntries,
        GenericSchema,
        ErrorMessage<ObjectWithRestIssue> | undefined
      >
    | ObjectWithRestSchemaAsync<
        ObjectEntriesAsync,
        GenericSchemaAsync,
        ErrorMessage<ObjectWithRestIssue> | undefined
      >
  ) {
  if (!("type" in schema)) return false;

  return schema.type === "object_with_rest";
}
