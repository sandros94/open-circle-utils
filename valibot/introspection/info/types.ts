import type { GenericSchema, GenericSchemaAsync, InferExamples, InferMetadata } from 'valibot';

/**
 * Schema information extracted from Valibot's native action utilities.
 * This is kept generic and not HTML/UI-specific.
 */
export interface SchemaInfo<TSchema extends GenericSchema | GenericSchemaAsync> {
  /** Schema title from title() action */
  title: string | undefined;
  /** Schema description from description() action */
  description: string | undefined;
  /** Schema examples from examples() action */
  examples: InferExamples<TSchema>;
  /** Custom metadata from metadata() action */
  metadata: InferMetadata<TSchema>;
}
