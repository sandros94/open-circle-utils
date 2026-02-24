import type {
  BaseSchema,
  BaseSchemaAsync,
  BaseIssue,
  GenericSchema,
  GenericSchemaAsync,
  RecordSchema,
  RecordSchemaAsync,
  ErrorMessage,
  RecordIssue,
} from "valibot";

export type GenericRecordSchema = RecordSchema<
  BaseSchema<string, string | number | symbol, BaseIssue<unknown>>,
  GenericSchema,
  ErrorMessage<RecordIssue> | undefined
>;
export type GenericRecordSchemaAsync = RecordSchemaAsync<
  | BaseSchema<string, string | number | symbol, BaseIssue<unknown>>
  | BaseSchemaAsync<string, string | number | symbol, BaseIssue<unknown>>,
  GenericSchema | GenericSchemaAsync,
  ErrorMessage<RecordIssue> | undefined
>;

export type GetRecordKey<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericRecordSchema
    | GenericRecordSchemaAsync,
> =
  TSchema extends RecordSchema<infer TKey, GenericSchema, ErrorMessage<RecordIssue> | undefined>
    ? TKey
    : TSchema extends RecordSchemaAsync<
          infer TKey,
          GenericSchema | GenericSchemaAsync,
          ErrorMessage<RecordIssue> | undefined
        >
      ? TKey
      : null;

export type GetRecordValue<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericRecordSchema
    | GenericRecordSchemaAsync,
> =
  TSchema extends RecordSchema<
    BaseSchema<string, string | number | symbol, BaseIssue<unknown>>,
    infer TValue,
    ErrorMessage<RecordIssue> | undefined
  >
    ? TValue
    : TSchema extends RecordSchemaAsync<
          | BaseSchema<string, string | number | symbol, BaseIssue<unknown>>
          | BaseSchemaAsync<string, string | number | symbol, BaseIssue<unknown>>,
          infer TValue,
          ErrorMessage<RecordIssue> | undefined
        >
      ? TValue
      : null;
