import type {
  GetObjectEntries,
  GetObjectEntry,
  GetObjectFields,
  GetObjectField,
  GetObjectRest,
  GenericObjectSchema,
  GenericObjectSchemaAsync,
} from "./types.ts";
import { isObjectSchema, isObjectWithRestSchema } from "./is.ts";

// @__NO_SIDE_EFFECTS__
export function getObjectEntries<TSchema extends GenericObjectSchema | GenericObjectSchemaAsync>(
  schema: TSchema
): GetObjectEntries<TSchema> {
  if (!isObjectSchema(schema)) {
    return null as GetObjectEntries<TSchema>;
  }
  return Object.entries(schema.entries) as GetObjectEntries<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getObjectEntry<
  TSchema extends GenericObjectSchema | GenericObjectSchemaAsync,
  K extends keyof TSchema["entries"],
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

// @__NO_SIDE_EFFECTS__
export function getObjectFields<TSchema extends GenericObjectSchema | GenericObjectSchemaAsync>(
  schema: TSchema
): GetObjectFields<TSchema> {
  if (!isObjectSchema(schema)) {
    return null as GetObjectFields<TSchema>;
  }
  const entries = getObjectEntries(schema);
  return entries!.map(([key, schema]) => ({
    key,
    schema,
  })) as GetObjectFields<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getObjectField<
  TSchema extends GenericObjectSchema | GenericObjectSchemaAsync,
  K extends keyof TSchema["entries"],
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

// @__NO_SIDE_EFFECTS__
export function getObjectRest<TSchema extends GenericObjectSchema | GenericObjectSchemaAsync>(
  schema: TSchema
): GetObjectRest<TSchema> {
  if (!isObjectWithRestSchema(schema)) {
    return null as GetObjectRest<TSchema>;
  }
  return schema.rest as GetObjectRest<TSchema>;
}
