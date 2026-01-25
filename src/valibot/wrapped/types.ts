import type {
  GenericSchema,
  GenericSchemaAsync,
  Default,
  DefaultAsync,
  ExactOptionalSchema,
  ExactOptionalSchemaAsync,
  NonNullableIssue,
  NonNullableSchema,
  NonNullableSchemaAsync,
  NonNullishIssue,
  NonNullishSchema,
  NonNullishSchemaAsync,
  NonOptionalIssue,
  NonOptionalSchema,
  NonOptionalSchemaAsync,
  NullableSchema,
  NullableSchemaAsync,
  NullishSchema,
  NullishSchemaAsync,
  OptionalSchema,
  OptionalSchemaAsync,
  UndefinedableSchema,
  UndefinedableSchemaAsync,
  ErrorMessage,
  InferDefault,
} from 'valibot';

export type GenericWrappedSchema =
  | ExactOptionalSchema<GenericSchema, Default<GenericSchema, null | undefined>>
  | NonNullableSchema<GenericSchema, ErrorMessage<NonNullableIssue> | undefined>
  | NonNullishSchema<GenericSchema, ErrorMessage<NonNullishIssue> | undefined>
  | NonOptionalSchema<GenericSchema, ErrorMessage<NonOptionalIssue> | undefined>
  | NullableSchema<GenericSchema, Default<GenericSchema, null | undefined>>
  | NullishSchema<GenericSchema, Default<GenericSchema, null | undefined>>
  | OptionalSchema<GenericSchema, Default<GenericSchema, null | undefined>>
  | UndefinedableSchema<GenericSchema, Default<GenericSchema, null | undefined>>

export type GenericWrappedSchemaAsync =
  | ExactOptionalSchemaAsync<GenericSchemaAsync, DefaultAsync<GenericSchemaAsync, null | undefined>>
  | NonNullableSchemaAsync<GenericSchemaAsync, ErrorMessage<NonNullableIssue> | undefined>
  | NonNullishSchemaAsync<GenericSchemaAsync, ErrorMessage<NonNullishIssue> | undefined>
  | NonOptionalSchemaAsync<GenericSchemaAsync, ErrorMessage<NonOptionalIssue> | undefined>
  | NullableSchemaAsync<GenericSchemaAsync, DefaultAsync<GenericSchemaAsync, null | undefined>>
  | NullishSchemaAsync<GenericSchemaAsync, DefaultAsync<GenericSchemaAsync, null | undefined>>
  | OptionalSchemaAsync<GenericSchemaAsync, DefaultAsync<GenericSchemaAsync, null | undefined>>
  | UndefinedableSchemaAsync<GenericSchemaAsync, DefaultAsync<GenericSchemaAsync, null | undefined>>

type DeepUnwrapSchema<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericWrappedSchema
    | GenericWrappedSchemaAsync,
> = TSchema extends GenericWrappedSchema
  ? DeepUnwrapSchema<TSchema['wrapped']>
  : TSchema extends GenericWrappedSchemaAsync
    ? DeepUnwrapSchema<TSchema['wrapped']>
    : TSchema;

type RequiredFlag<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericWrappedSchema
    | GenericWrappedSchemaAsync,
> = TSchema extends ExactOptionalSchema<any, any>
  ? false
  : TSchema extends OptionalSchema<any, any>
    ? false
    : TSchema extends UndefinedableSchema<any, any>
      ? false
      : TSchema extends NullishSchema<any, any>
        ? false
        : TSchema extends NonOptionalSchema<any, any>
          ? true
          : TSchema extends { wrapped: infer W }
            ? RequiredFlag<W & (
                | GenericSchema
                | GenericSchemaAsync
                | GenericWrappedSchema
                | GenericWrappedSchemaAsync
              )>
            : true;

type NullableFlag<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericWrappedSchema
    | GenericWrappedSchemaAsync,
> = TSchema extends NonNullableSchema<any, any>
  ? false
  : TSchema extends NonNullishSchema<any, any>
    ? false
    : TSchema extends NullableSchema<any, any>
      ? true
      : TSchema extends NullishSchema<any, any>
        ? true
        : TSchema extends { wrapped: infer W }
          ? NullableFlag<W & (
              | GenericSchema
              | GenericSchemaAsync
              | GenericWrappedSchema
              | GenericWrappedSchemaAsync
            )>
          : false;

export type GetUnwrappedSchema<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericWrappedSchema
    | GenericWrappedSchemaAsync,
> = TSchema extends GenericWrappedSchema | GenericWrappedSchemaAsync
  ? {
      wasWrapped: true;
      schema: DeepUnwrapSchema<TSchema>;
      required: RequiredFlag<TSchema>;
      nullable: NullableFlag<TSchema>;
      defaultValue: InferDefault<TSchema>;
    }
  : {
      wasWrapped: false;
      schema: TSchema;
      required: never;
      nullable: never;
      defaultValue: never;
    };
