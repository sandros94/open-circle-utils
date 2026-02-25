import type { GenericSchema, GenericSchemaAsync, InferExamples, InferMetadata } from "valibot";
import { getTitle, getDescription, getExamples, getMetadata } from "valibot";

import {
  type GenericWrappedSchema,
  type GenericWrappedSchemaAsync,
  type GetWrappedSchema,
  getWrappedSchema,
} from "../wrapped/index.ts";
import type { SchemaInfo } from "./types.ts";

// @__NO_SIDE_EFFECTS__
export function getSchemaInfo<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericWrappedSchema
    | GenericWrappedSchemaAsync,
>(schema: TSchema): SchemaInfo<TSchema> {
  const { schema: unwrapped } = getWrappedSchema(schema);

  return {
    title: getTitle(unwrapped),
    description: getDescription(unwrapped),
    examples: getExamples(unwrapped) as TSchema extends
      | GenericWrappedSchema
      | GenericWrappedSchemaAsync
      ? InferExamples<GetWrappedSchema<TSchema>["schema"]>
      : InferExamples<TSchema>,
    metadata: getMetadata(unwrapped) as TSchema extends
      | GenericWrappedSchema
      | GenericWrappedSchemaAsync
      ? InferMetadata<GetWrappedSchema<TSchema>["schema"]>
      : InferMetadata<TSchema>,
  };
}
