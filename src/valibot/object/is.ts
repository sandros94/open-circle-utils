import type {
  GenericSchema,
  GenericSchemaAsync,
} from 'valibot';

import type {
  GenericObjectSchema,
  GenericObjectSchemaAsync,
} from './types.ts';

/**
 * Check if a schema is an object-like schema (object, looseObject, strictObject, objectWithRest).
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is an object-like schema.
 */
// @__NO_SIDE_EFFECTS__
export function isObjectSchema<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericObjectSchema
    | GenericObjectSchemaAsync,
>(
  schema: TSchema
): schema is TSchema & (
  | GenericObjectSchema
  | GenericObjectSchemaAsync
) {
  if (!('type' in schema)) return false;

  return 'entries' in schema;
}
