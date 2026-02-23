import type {
  GenericSchema,
  GenericSchemaAsync,
  VariantSchema,
  VariantSchemaAsync,
  VariantOptions,
  ErrorMessage,
  VariantIssue,
} from "valibot";

import type {
  GenericEnumSchema,
  GenericUnionSchema,
  GenericUnionSchemaAsync,
  GenericPicklistSchema,
} from "./types.ts";

/**
 * Check if a schema is an enum schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is an enum schema.
 */
// @__NO_SIDE_EFFECTS__
export function isEnumSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericEnumSchema {
  if (!("type" in schema)) return false;

  return schema.type === "enum";
}

/**
 * Check if a schema is a picklist schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a picklist schema.
 */
// @__NO_SIDE_EFFECTS__
export function isPicklistSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericPicklistSchema {
  if (!("type" in schema)) return false;

  return schema.type === "picklist";
}

/**
 * Check if a schema is a union schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a union schema.
 */
// @__NO_SIDE_EFFECTS__
export function isUnionSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericUnionSchema | GenericUnionSchemaAsync) {
  if (!("type" in schema)) return false;

  return schema.type === "union";
}

/**
 * Check if a schema is a variant schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a variant schema.
 */
// @__NO_SIDE_EFFECTS__
export function isVariantSchema<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | VariantSchema<TKey, TOptions, TMessage>
    | VariantSchemaAsync<TKey, TOptions, TMessage>,
  TKey extends string = string,
  TOptions extends VariantOptions<TKey> = VariantOptions<TKey>,
  TMessage extends ErrorMessage<VariantIssue> | undefined = undefined,
>(
  schema: TSchema
): schema is TSchema &
  (TSchema extends VariantSchema<TKey, TOptions, TMessage>
    ? VariantSchema<TKey, TOptions, TMessage>
    : TSchema extends VariantSchemaAsync<TKey, TOptions, TMessage>
      ? VariantSchemaAsync<TKey, TOptions, TMessage>
      : VariantSchema<TKey, TOptions, TMessage> | VariantSchemaAsync<TKey, TOptions, TMessage>) {
  if (!("type" in schema)) return false;

  return schema.type === "variant" && "key" in schema;
}
