import type {
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
  GenericSchema,
  GenericSchemaAsync,
  ErrorMessage,
  InferDefault,
  InferIssue,
  UnknownDataset,
  Config,
} from 'valibot';
import { getDefault } from 'valibot';

export type WrappedSchema<
  TSchema extends GenericSchema,
  TSchemaAsync extends GenericSchemaAsync,
> =
  | ExactOptionalSchema<TSchema, unknown>
  | ExactOptionalSchemaAsync<TSchema | TSchemaAsync, unknown>
  | NonNullableSchema<TSchema, ErrorMessage<NonNullableIssue> | undefined>
  | NonNullableSchemaAsync<TSchema | TSchemaAsync, ErrorMessage<NonNullableIssue> | undefined>
  | NonNullishSchema<TSchema, ErrorMessage<NonNullishIssue> | undefined>
  | NonNullishSchemaAsync<TSchema | TSchemaAsync, ErrorMessage<NonNullishIssue> | undefined>
  | NonOptionalSchema<TSchema, ErrorMessage<NonOptionalIssue> | undefined>
  | NonOptionalSchemaAsync<TSchema | TSchemaAsync, ErrorMessage<NonOptionalIssue> | undefined>
  | NullableSchema<TSchema, unknown>
  | NullableSchemaAsync<TSchema | TSchemaAsync, unknown>
  | NullishSchema<TSchema, unknown>
  | NullishSchemaAsync<TSchema | TSchemaAsync, unknown>
  | OptionalSchema<TSchema, unknown>
  | OptionalSchemaAsync<TSchema | TSchemaAsync, unknown>
  | UndefinedableSchema<TSchema, unknown>
  | UndefinedableSchemaAsync<TSchema | TSchemaAsync, unknown>

export type TryUnwrapReturnType<
  WSchema extends WrappedSchema<TSchema, TSchemaAsync>,
  TSchema extends GenericSchema,
  TSchemaAsync extends GenericSchemaAsync,
> = {
  wasWrapped: true;
  schema: WSchema['wrapped'];
  required: boolean;
  nullable: boolean;
  defaultValue: InferDefault<WSchema>;
} | {
  wasWrapped: false;
  schema: TSchema | TSchemaAsync;
}

/**
 * Try to unwrap the wrapped schema. If the schema is not wrapped, it returns the original schema.
 * Recursively unwraps all nested wrappers.
 *
 * @param schema The schema to be unwrapped.
 *
 * @returns An object containing:
 * - wasWrapped: boolean indicating if the schema was wrapped.
 * - schema: the unwrapped core schema.
 * - required: boolean indicating if the schema is required (undefined if not wrapped).
 * - nullable: boolean indicating if the schema is nullable (undefined if not wrapped).
 * - defaultValue: the default value if provided (undefined if not wrapped).
 */
// @__NO_SIDE_EFFECTS__
export function tryUnwrap<
  TSchema extends
    | ExactOptionalSchema<WSchema, unknown>
    | ExactOptionalSchemaAsync<WSchema | WSchemaAsync, unknown>
    | NonNullableSchema<WSchema, ErrorMessage<NonNullableIssue> | undefined>
    | NonNullableSchemaAsync<WSchema | WSchemaAsync, ErrorMessage<NonNullableIssue> | undefined>
    | NonNullishSchema<WSchema, ErrorMessage<NonNullishIssue> | undefined>
    | NonNullishSchemaAsync<WSchema | WSchemaAsync, ErrorMessage<NonNullishIssue> | undefined>
    | NonOptionalSchema<WSchema, ErrorMessage<NonOptionalIssue> | undefined>
    | NonOptionalSchemaAsync<WSchema | WSchemaAsync, ErrorMessage<NonOptionalIssue> | undefined>
    | NullableSchema<WSchema, unknown>
    | NullableSchemaAsync<WSchema | WSchemaAsync, unknown>
    | NullishSchema<WSchema, unknown>
    | NullishSchemaAsync<WSchema | WSchemaAsync, unknown>
    | OptionalSchema<WSchema, unknown>
    | OptionalSchemaAsync<WSchema | WSchemaAsync, unknown>
    | UndefinedableSchema<WSchema, unknown>
    | UndefinedableSchemaAsync<WSchema | WSchemaAsync, unknown>,
  WSchema extends
    | GenericSchema = GenericSchema,
  WSchemaAsync extends
    | GenericSchemaAsync = GenericSchemaAsync,
>(
  schema: TSchema | WSchema | WSchemaAsync,
  dataset?: UnknownDataset,
  config?: Config<InferIssue<TSchema | WSchema | WSchemaAsync>>,
): TryUnwrapReturnType<TSchema, WSchema, WSchemaAsync> {
  if ('wrapped' in schema) {
    let required: boolean | undefined;
    let nullable: boolean | undefined;

    // The default value should be from the outermost wrapper
    const defaultValue = getDefault(schema, dataset, config);

    let currentSchema: any = schema;

    // Recursively unwrap all layers, processing from outside to inside
    while ('wrapped' in currentSchema) {
      switch (currentSchema.type) {
        case 'non_optional':
          // Explicitly requires a value
          if (required === undefined) required = true;
          break;
        case 'non_nullable':
        case 'non_nullish':
          // Explicitly disallows null
          if (nullable === undefined) nullable = false;
          break;
        case 'nullable':
          // Allows null
          if (nullable === undefined) nullable = true;
          break;
        case 'nullish':
          // Allows both undefined and null
          if (required === undefined) required = false;
          if (nullable === undefined) nullable = true;
          break;
        case 'exact_optional':
        case 'optional':
        case 'undefinedable':
          // Allows undefined
          if (required === undefined) required = false;
          break;
      }

      currentSchema = currentSchema.wrapped;
    }

    return {
      wasWrapped: true,
      schema: currentSchema,
      required: required ?? true,
      nullable: nullable ?? false,
      defaultValue,
    };
  }
  return {
    wasWrapped: false,
    schema,
  };
}
