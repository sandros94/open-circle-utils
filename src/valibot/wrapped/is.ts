import type {
  GenericSchema,
  GenericSchemaAsync,
} from 'valibot';

import type {
  GenericWrappedSchema,
  GenericWrappedSchemaAsync,
} from './types.ts';

/**
 * Check if a schema is a wrapped schema
 * (optional, nullable, nullish, nonOptional, nonNullable, nonNullish).
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a wrapped schema.
 */
// @__NO_SIDE_EFFECTS__
export function isWrappedSchema<
  TSchema extends GenericSchema | GenericSchemaAsync
>(
  schema: TSchema
): schema is TSchema & (
  | GenericWrappedSchema
  | GenericWrappedSchemaAsync
) {
  if (!('type' in schema)) return false;

  return 'wrapped' in schema;
}
