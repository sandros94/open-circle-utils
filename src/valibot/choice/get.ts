import type {
  GenericSchema,
  GenericSchemaAsync,
} from 'valibot';

import type {
  GenericUnionSchema,
  GenericUnionSchemaAsync,
  GetEnumOptions,
  GetPicklistOptions,
  GetUnionOptions,
  GetVariantOptions,
  GetVariantKey,
} from './types.ts';
import {
  isEnumSchema,
  isPicklistSchema,
  isUnionSchema,
  isVariantSchema,
} from './is.ts';

/**
 * Get the enum options from an enum schema.
 *
 * @param schema The schema to extract from.
 *
 * @returns The enum object, or null if not an enum schema.
 */
// @__NO_SIDE_EFFECTS__
export function getEnumOptions<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema
): GetEnumOptions<TSchema> {
  if (!isEnumSchema(schema)) {
    return null as GetEnumOptions<TSchema>;
  }

  return schema.enum as GetEnumOptions<TSchema>;
}

/**
 * Get the picklist options from a picklist schema.
 *
 * @param schema The schema to extract from.
 *
 * @returns The picklist options array, or null if not a picklist schema.
 */
// @__NO_SIDE_EFFECTS__
export function getPicklistOptions<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema
): GetPicklistOptions<TSchema> {
  if (!isPicklistSchema(schema)) {
    return null as GetPicklistOptions<TSchema>;
  }

  return schema.options as GetPicklistOptions<TSchema>;
}

/**
 * Get the union options from a union schema.
 *
 * @param schema The schema to extract from.
 *
 * @returns The union options array, or null if not a union schema.
 */
// @__NO_SIDE_EFFECTS__
export function getUnionOptions<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericUnionSchema
    | GenericUnionSchemaAsync,
>(
  schema: TSchema
): GetUnionOptions<TSchema> {
  if (!isUnionSchema(schema)) {
    return null as GetUnionOptions<TSchema>;
  }

  return schema.options as GetUnionOptions<TSchema>;
}

/**
 * Get the variant options from a variant schema.
 *
 * @param schema The schema to extract from.
 *
 * @returns The variant options array, or null if not a variant schema.
 */
// @__NO_SIDE_EFFECTS__
export function getVariantOptions<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema
): GetVariantOptions<TSchema> {
  if (!isVariantSchema(schema)) {
    return null as GetVariantOptions<TSchema>;
  }

  return schema.options as GetVariantOptions<TSchema>;
}

/**
 * Get the discriminator key from a variant schema.
 *
 * @param schema The schema to extract from.
 *
 * @returns The discriminator key, or null if not a variant schema.
 */
// @__NO_SIDE_EFFECTS__
export function getVariantKey<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema
): GetVariantKey<TSchema> {
  if (!isVariantSchema(schema)) {
    return null as GetVariantKey<TSchema>;
  }

  return schema.key as GetVariantKey<TSchema>;
}
