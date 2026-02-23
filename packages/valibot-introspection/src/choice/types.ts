import type {
  GenericSchema,
  GenericSchemaAsync,
  ErrorMessage,
  InferIssue,
  EnumSchema,
  PicklistSchema,
  PicklistOptions,
  UnionSchema,
  UnionSchemaAsync,
  UnionOptions,
  UnionOptionsAsync,
  VariantSchema,
  VariantSchemaAsync,
  VariantOptions,
  VariantOptionsAsync,
  EnumIssue,
  PicklistIssue,
  UnionIssue,
  VariantIssue,
} from "valibot";

export type GenericEnumSchema = EnumSchema<any, ErrorMessage<EnumIssue> | undefined>;
export type GenericPicklistSchema = PicklistSchema<
  PicklistOptions,
  ErrorMessage<PicklistIssue> | undefined
>;
export type GenericUnionSchema = UnionSchema<
  UnionOptions,
  ErrorMessage<UnionIssue<InferIssue<UnionOptions[number]>>> | undefined
>;
export type GenericUnionSchemaAsync = UnionSchemaAsync<
  UnionOptionsAsync,
  ErrorMessage<UnionIssue<InferIssue<UnionOptionsAsync[number]>>> | undefined
>;
export type GenericVariantSchema<TKey extends string> = VariantSchema<
  TKey,
  VariantOptions<TKey>,
  ErrorMessage<VariantIssue> | undefined
>;
export type GenericVariantSchemaAsync<TKey extends string> = VariantSchemaAsync<
  TKey,
  VariantOptionsAsync<TKey>,
  ErrorMessage<VariantIssue> | undefined
>;

export type GetEnumOptions<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends EnumSchema<infer TEnum, any> ? TEnum : null;

export type GetPicklistOptions<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends PicklistSchema<infer TOptions, any> ? TOptions : null;

export type GetUnionOptions<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends UnionSchema<infer TOptions, any>
    ? TOptions
    : TSchema extends UnionSchemaAsync<infer TOptions, any>
      ? TOptions
      : null;

export type GetVariantOptions<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends VariantSchema<any, infer TOptions, any>
    ? TOptions
    : TSchema extends VariantSchemaAsync<any, infer TOptions, any>
      ? TOptions
      : null;

export type GetVariantKey<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends VariantSchema<infer TKey, any, any>
    ? TKey
    : TSchema extends VariantSchemaAsync<infer TKey, any, any>
      ? TKey
      : null;
