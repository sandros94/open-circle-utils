import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type {
  GetObjectEntries,
  GetObjectEntry,
  GetObjectFields,
  GetObjectField,
  GetObjectRest,
} from "./types.ts";
import { isObjectSchema, isObjectWithRestSchema } from "./is.ts";

export function getObjectEntries<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(schema: TSchema): GetObjectEntries<TSchema> {
  if (!isObjectSchema(schema)) {
    return null as GetObjectEntries<TSchema>;
  }

  return Object.entries(schema.entries) as GetObjectEntries<TSchema>;
}

export function getObjectEntry<
  TSchema extends GenericSchema | GenericSchemaAsync,
  K extends PropertyKey,
>(schema: TSchema, fieldName: K): GetObjectEntry<TSchema, K> {
  if (!isObjectSchema(schema)) {
    return null as GetObjectEntry<TSchema, K>;
  }

  const entry = schema.entries[fieldName as keyof typeof schema.entries];
  if (!entry) {
    return null as GetObjectEntry<TSchema, K>;
  }

  return entry as GetObjectEntry<TSchema, K>;
}

export function getObjectFields<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(schema: TSchema): GetObjectFields<TSchema> {
  if (!isObjectSchema(schema)) {
    return null as GetObjectFields<TSchema>;
  }

  const entries = getObjectEntries(schema);
  if (!entries) return null as GetObjectFields<TSchema>;

  return entries.map(([key, schema]) => ({
    key,
    schema,
  })) as GetObjectFields<TSchema>;
}

export function getObjectField<
  TSchema extends GenericSchema | GenericSchemaAsync,
  K extends PropertyKey,
>(schema: TSchema, fieldName: K): GetObjectField<TSchema, K> {
  if (!isObjectSchema(schema)) {
    return null as GetObjectField<TSchema, K>;
  }

  const entry = schema.entries[fieldName as keyof typeof schema.entries];
  if (!entry) {
    return null as GetObjectField<TSchema, K>;
  }

  return {
    key: fieldName as K & string,
    schema: entry,
  } as GetObjectField<TSchema, K>;
}

/**
 * Get the rest schema from a object schema (if it has one).
 *
 * @param schema The schema to extract from.
 *
 * @returns The rest schema, or null if not a object schema or no rest schema.
 */
// @__NO_SIDE_EFFECTS__
export function getObjectRest<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(schema: TSchema): GetObjectRest<TSchema> {
  if (!isObjectWithRestSchema(schema)) {
    return null as GetObjectRest<TSchema>;
  }

  return schema.rest as GetObjectRest<TSchema>;
}
