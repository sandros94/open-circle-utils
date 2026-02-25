import type { GenericSchema, GenericSchemaAsync, InferExamples, InferMetadata } from "valibot";

import type {
  GenericWrappedSchema,
  GenericWrappedSchemaAsync,
  GetWrappedSchema,
} from "../wrapped/index.ts";

/**
 * Schema information extracted from Valibot's native action utilities.
 */
export interface SchemaInfo<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericWrappedSchema
    | GenericWrappedSchemaAsync,
> {
  title: string | undefined;
  description: string | undefined;
  examples: TSchema extends GenericWrappedSchema | GenericWrappedSchemaAsync
    ? InferExamples<GetWrappedSchema<TSchema>["schema"]>
    : InferExamples<TSchema>;
  metadata: TSchema extends GenericWrappedSchema | GenericWrappedSchemaAsync
    ? InferMetadata<GetWrappedSchema<TSchema>["schema"]>
    : InferMetadata<TSchema>;
}
