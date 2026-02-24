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

// @__NO_SIDE_EFFECTS__
export function isEnumSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericEnumSchema {
  return "type" in schema && schema.type === "enum";
}

// @__NO_SIDE_EFFECTS__
export function isPicklistSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericPicklistSchema {
  return "type" in schema && schema.type === "picklist";
}

// @__NO_SIDE_EFFECTS__
export function isUnionSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericUnionSchema | GenericUnionSchemaAsync) {
  return "type" in schema && schema.type === "union";
}

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
  return "type" in schema && schema.type === "variant" && "key" in schema;
}
