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

// @__NO_SIDE_EFFECTS__
export function isObjectSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericObjectSchema | GenericObjectSchemaAsync) {
  return "type" in schema && "entries" in schema;
}

// @__NO_SIDE_EFFECTS__
export function isObjectWithRestSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
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
  return "type" in schema && schema.type === "object_with_rest";
}
