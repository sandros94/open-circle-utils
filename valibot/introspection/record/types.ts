import type {
  GenericSchema,
  GenericSchemaAsync,
  RecordSchema,
  RecordSchemaAsync,
  ErrorMessage,
  RecordIssue,
} from "valibot";

export type GenericRecordSchema = RecordSchema<
  any,
  GenericSchema,
  ErrorMessage<RecordIssue> | undefined
>;
export type GenericRecordSchemaAsync = RecordSchemaAsync<
  any,
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
  TSchema extends RecordSchema<infer TKey, any, any>
    ? TKey
    : TSchema extends RecordSchemaAsync<infer TKey, any, any>
      ? TKey
      : null;

export type GetRecordValue<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericRecordSchema
    | GenericRecordSchemaAsync,
> =
  TSchema extends RecordSchema<any, infer TValue, any>
    ? TValue
    : TSchema extends RecordSchemaAsync<any, infer TValue, any>
      ? TValue
      : null;
