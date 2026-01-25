import type { GenericSchema, GenericSchemaAsync } from 'valibot';
import { getTitle, getDescription, getExamples, getMetadata } from 'valibot';

import type { SchemaInfo } from './types.ts';

/**
 * Extract schema information using Valibot's native utility functions.
 * This provides access to title, description, examples, and custom metadata
 * attached via Valibot's action helpers.
 *
 * @param schema The schema to extract information from.
 *
 * @returns An object containing title, description, examples, and metadata.
 */
// @__NO_SIDE_EFFECTS__
export function getSchemaInfo<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema,
): SchemaInfo<TSchema> {
  return {
    title: getTitle(schema),
    description: getDescription(schema),
    examples: getExamples(schema),
    metadata: getMetadata(schema),
  };
}
