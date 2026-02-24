import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type {
  GenericUnionSchema,
  GenericUnionSchemaAsync,
  GetEnumOptions,
  GetPicklistOptions,
  GetUnionOptions,
  GetVariantOptions,
  GetVariantKey,
} from "./types.ts";
import { isEnumSchema, isPicklistSchema, isUnionSchema, isVariantSchema } from "./is.ts";

// @__NO_SIDE_EFFECTS__
export function getEnumOptions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetEnumOptions<TSchema> {
  if (!isEnumSchema(schema)) {
    return null as GetEnumOptions<TSchema>;
  }
  return schema.enum as GetEnumOptions<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getPicklistOptions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetPicklistOptions<TSchema> {
  if (!isPicklistSchema(schema)) {
    return null as GetPicklistOptions<TSchema>;
  }
  return schema.options as GetPicklistOptions<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getUnionOptions<
  TSchema extends GenericSchema | GenericSchemaAsync | GenericUnionSchema | GenericUnionSchemaAsync,
>(schema: TSchema): GetUnionOptions<TSchema> {
  if (!isUnionSchema(schema)) {
    return null as GetUnionOptions<TSchema>;
  }
  return schema.options as GetUnionOptions<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getVariantOptions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetVariantOptions<TSchema> {
  if (!isVariantSchema(schema)) {
    return null as GetVariantOptions<TSchema>;
  }
  return schema.options as GetVariantOptions<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getVariantKey<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetVariantKey<TSchema> {
  if (!isVariantSchema(schema)) {
    return null as GetVariantKey<TSchema>;
  }
  return schema.key as GetVariantKey<TSchema>;
}
