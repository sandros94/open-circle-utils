import type {
  GenericSchema,
  GenericSchemaAsync,
} from 'valibot';

import type {
  GetLiteralValue,
} from './types.ts';
import { isLiteralSchema } from './is.ts';

/**
 * Get the literal value from a literal schema.
 *
 * @param schema The schema to extract from.
 *
 * @returns The literal value, or null if not a literal schema.
 */
// @__NO_SIDE_EFFECTS__
export function getLiteralValue<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema
): GetLiteralValue<TSchema> {
  if (!isLiteralSchema(schema)) {
    return null as GetLiteralValue<TSchema>;
  }

  return schema.literal as GetLiteralValue<TSchema>;
}
