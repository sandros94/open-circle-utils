import type {
  GenericSchema,
  GenericSchemaAsync,
} from 'valibot';

import type {
  GenericRecordSchema,
  GenericRecordSchemaAsync,
} from './types.ts';

/**
 * Check if a schema is a record schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a record schema.
 */
// @__NO_SIDE_EFFECTS__
export function isRecordSchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema
): schema is TSchema & (
  | GenericRecordSchema
  | GenericRecordSchemaAsync
) {
  if (!('type' in schema)) return false;

  return schema.type === 'record';
}
