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
  Enum,
  EnumIssue,
  PicklistIssue,
  UnionIssue,
  VariantIssue,
} from "valibot";

export type GenericEnumSchema = EnumSchema<Enum, ErrorMessage<EnumIssue> | undefined>;
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
  TSchema extends EnumSchema<infer TEnum, ErrorMessage<EnumIssue> | undefined> ? TEnum : null;

export type GetPicklistOptions<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends PicklistSchema<infer TOptions, ErrorMessage<PicklistIssue> | undefined>
    ? TOptions
    : null;

export type GetUnionOptions<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends UnionSchema<
    infer TOptions,
    ErrorMessage<UnionIssue<InferIssue<UnionOptions[number]>>> | undefined
  >
    ? TOptions
    : TSchema extends UnionSchemaAsync<
          infer TOptions,
          ErrorMessage<UnionIssue<InferIssue<UnionOptionsAsync[number]>>> | undefined
        >
      ? TOptions
      : null;

export type GetVariantOptions<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends VariantSchema<string, infer TOptions, ErrorMessage<VariantIssue> | undefined>
    ? TOptions
    : TSchema extends VariantSchemaAsync<
          string,
          infer TOptions,
          ErrorMessage<VariantIssue> | undefined
        >
      ? TOptions
      : null;

export type GetVariantKey<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends VariantSchema<
    infer TKey,
    VariantOptions<string>,
    ErrorMessage<VariantIssue> | undefined
  >
    ? TKey
    : TSchema extends VariantSchemaAsync<
          infer TKey,
          VariantOptionsAsync<string>,
          ErrorMessage<VariantIssue> | undefined
        >
      ? TKey
      : null;
