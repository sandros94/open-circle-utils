import type {
  GenericSchema,
  GenericSchemaAsync,
  InferExamples,
  InferMetadata,
} from "valibot";

import type {
  GenericWrappedSchema,
  GenericWrappedSchemaAsync,
  GetWrappedSchema,
} from "../wrapped/index.ts";

/**
 * Schema information extracted from Valibot's native action utilities.
 * This is kept generic and not HTML/UI-specific.
 */
export interface SchemaInfo<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericWrappedSchema
    | GenericWrappedSchemaAsync
> {
  /** Schema title from title() action */
  title: string | undefined;
  /** Schema description from description() action */
  description: string | undefined;
  /** Schema examples from examples() action */
  examples: TSchema extends GenericWrappedSchema | GenericWrappedSchemaAsync
    ? InferExamples<GetWrappedSchema<TSchema>['schema']>
    : InferExamples<TSchema>;
  /** Custom metadata from metadata() action */
  metadata: TSchema extends GenericWrappedSchema | GenericWrappedSchemaAsync
    ? InferMetadata<GetWrappedSchema<TSchema>['schema']>
    : InferMetadata<TSchema>;
}
