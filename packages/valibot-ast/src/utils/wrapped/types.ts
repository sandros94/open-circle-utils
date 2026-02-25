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
} from "valibot";

export type GenericWrappedSchema =
  | ExactOptionalSchema<GenericSchema, Default<GenericSchema, null | undefined>>
  | NonNullableSchema<GenericSchema, ErrorMessage<NonNullableIssue> | undefined>
  | NonNullishSchema<GenericSchema, ErrorMessage<NonNullishIssue> | undefined>
  | NonOptionalSchema<GenericSchema, ErrorMessage<NonOptionalIssue> | undefined>
  | NullableSchema<GenericSchema, Default<GenericSchema, null | undefined>>
  | NullishSchema<GenericSchema, Default<GenericSchema, null | undefined>>
  | OptionalSchema<GenericSchema, Default<GenericSchema, null | undefined>>
  | UndefinedableSchema<GenericSchema, Default<GenericSchema, null | undefined>>;

export type GenericWrappedSchemaAsync =
  | ExactOptionalSchemaAsync<
      GenericSchema | GenericSchemaAsync,
      DefaultAsync<GenericSchemaAsync, null | undefined>
    >
  | NonNullableSchemaAsync<
      GenericSchema | GenericSchemaAsync,
      ErrorMessage<NonNullableIssue> | undefined
    >
  | NonNullishSchemaAsync<
      GenericSchema | GenericSchemaAsync,
      ErrorMessage<NonNullishIssue> | undefined
    >
  | NonOptionalSchemaAsync<
      GenericSchema | GenericSchemaAsync,
      ErrorMessage<NonOptionalIssue> | undefined
    >
  | NullableSchemaAsync<
      GenericSchema | GenericSchemaAsync,
      DefaultAsync<GenericSchemaAsync, null | undefined>
    >
  | NullishSchemaAsync<
      GenericSchema | GenericSchemaAsync,
      DefaultAsync<GenericSchemaAsync, null | undefined>
    >
  | OptionalSchemaAsync<
      GenericSchema | GenericSchemaAsync,
      DefaultAsync<GenericSchemaAsync, null | undefined>
    >
  | UndefinedableSchemaAsync<
      GenericSchema | GenericSchemaAsync,
      DefaultAsync<GenericSchemaAsync, null | undefined>
    >;

type DeepUnwrapSchema<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends GenericWrappedSchema
    ? DeepUnwrapSchema<TSchema["wrapped"]>
    : TSchema extends GenericWrappedSchemaAsync
      ? DeepUnwrapSchema<TSchema["wrapped"]>
      : TSchema;

type RequiredFlag<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends Extract<
    GenericWrappedSchema | GenericWrappedSchemaAsync,
    { type: "exact_optional" }
  >
    ? false
    : TSchema extends Extract<
          GenericWrappedSchema | GenericWrappedSchemaAsync,
          { type: "optional" }
        >
      ? false
      : TSchema extends Extract<
            GenericWrappedSchema | GenericWrappedSchemaAsync,
            { type: "undefinedable" }
          >
        ? false
        : TSchema extends Extract<
              GenericWrappedSchema | GenericWrappedSchemaAsync,
              { type: "nullish" }
            >
          ? false
          : TSchema extends Extract<
                GenericWrappedSchema | GenericWrappedSchemaAsync,
                { type: "non_optional" }
              >
            ? true
            : TSchema extends { wrapped: infer W }
              ? RequiredFlag<W & (GenericSchema | GenericSchemaAsync)>
              : true;

type NullableFlag<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends Extract<
    GenericWrappedSchema | GenericWrappedSchemaAsync,
    { type: "non_nullable" }
  >
    ? false
    : TSchema extends Extract<
          GenericWrappedSchema | GenericWrappedSchemaAsync,
          { type: "non_nullish" }
        >
      ? false
      : TSchema extends Extract<
            GenericWrappedSchema | GenericWrappedSchemaAsync,
            { type: "nullable" }
          >
        ? true
        : TSchema extends Extract<
              GenericWrappedSchema | GenericWrappedSchemaAsync,
              { type: "nullish" }
            >
          ? true
          : TSchema extends { wrapped: infer W }
            ? NullableFlag<W & (GenericSchema | GenericSchemaAsync)>
            : false;

export type GetWrappedSchema<TSchema extends GenericSchema | GenericSchemaAsync> = TSchema extends
  | GenericWrappedSchema
  | GenericWrappedSchemaAsync
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
