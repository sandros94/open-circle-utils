import type {
  GenericSchema,
  GenericSchemaAsync,
} from 'valibot';
import type {
  GenericObjectSchema,
  GenericObjectSchemaAsync,
  GetObjectEntries,
  GetObjectEntry,
  GetObjectFields,
  GetObjectField,
} from './types.ts';
import { isObjectSchema } from './is.ts';

export function getObjectEntries<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericObjectSchema
    | GenericObjectSchemaAsync
>(
  schema: TSchema
): GetObjectEntries<TSchema> {
  if (!isObjectSchema(schema)) {
    return null as GetObjectEntries<TSchema>;
  }

  return Object.entries(schema.entries) as GetObjectEntries<TSchema>;
}

export function getObjectEntry<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericObjectSchema
    | GenericObjectSchemaAsync,
  K extends PropertyKey
>(
  schema: TSchema,
  fieldName: K
): GetObjectEntry<TSchema, K> {
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
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericObjectSchema
    | GenericObjectSchemaAsync
>(
  schema: TSchema
): GetObjectFields<TSchema> {
  const entries = getObjectEntries(schema);
  if (!entries) return null as GetObjectFields<TSchema>;

  return entries.map(([key, schema]) => ({ key, schema })) as GetObjectFields<TSchema>;
}

export function getObjectField<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericObjectSchema
    | GenericObjectSchemaAsync,
  K extends PropertyKey
>(
  schema: TSchema,
  fieldName: K
): GetObjectField<TSchema, K> {
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
