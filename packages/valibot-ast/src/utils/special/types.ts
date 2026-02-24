import type {
  GenericSchema,
  GenericSchemaAsync,
  Class,
  IntersectSchema,
  IntersectSchemaAsync,
  IntersectOptions,
  IntersectOptionsAsync,
  InstanceSchema,
  MapSchema,
  MapSchemaAsync,
  SetSchema,
  SetSchemaAsync,
  FunctionSchema,
  ErrorMessage,
  IntersectIssue,
  InstanceIssue,
  MapIssue,
  SetIssue,
  FunctionIssue,
} from "valibot";

export type GenericIntersectSchema = IntersectSchema<
  IntersectOptions,
  ErrorMessage<IntersectIssue> | undefined
>;
export type GenericIntersectSchemaAsync = IntersectSchemaAsync<
  IntersectOptionsAsync,
  ErrorMessage<IntersectIssue> | undefined
>;

export type GenericInstanceSchema = InstanceSchema<Class, ErrorMessage<InstanceIssue> | undefined>;

export type GenericMapSchema = MapSchema<
  GenericSchema,
  GenericSchema,
  ErrorMessage<MapIssue> | undefined
>;
export type GenericMapSchemaAsync = MapSchemaAsync<
  GenericSchema | GenericSchemaAsync,
  GenericSchema | GenericSchemaAsync,
  ErrorMessage<MapIssue> | undefined
>;

export type GenericSetSchema = SetSchema<GenericSchema, ErrorMessage<SetIssue> | undefined>;
export type GenericSetSchemaAsync = SetSchemaAsync<
  GenericSchema | GenericSchemaAsync,
  ErrorMessage<SetIssue> | undefined
>;

export type GenericFunctionSchema = FunctionSchema<ErrorMessage<FunctionIssue> | undefined>;

export type GetIntersectOptions<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends IntersectSchema<infer TOptions, ErrorMessage<IntersectIssue> | undefined>
    ? TOptions
    : TSchema extends IntersectSchemaAsync<infer TOptions, ErrorMessage<IntersectIssue> | undefined>
      ? TOptions
      : null;

export type GetInstanceClass<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends InstanceSchema<infer TClass, ErrorMessage<InstanceIssue> | undefined>
    ? TClass
    : null;

export type GetMapKey<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends MapSchema<infer TKey, GenericSchema, ErrorMessage<MapIssue> | undefined>
    ? TKey
    : TSchema extends MapSchemaAsync<
          infer TKey,
          GenericSchema | GenericSchemaAsync,
          ErrorMessage<MapIssue> | undefined
        >
      ? TKey
      : null;

export type GetMapValue<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends MapSchema<GenericSchema, infer TValue, ErrorMessage<MapIssue> | undefined>
    ? TValue
    : TSchema extends MapSchemaAsync<
          GenericSchema | GenericSchemaAsync,
          infer TValue,
          ErrorMessage<MapIssue> | undefined
        >
      ? TValue
      : null;

export type GetSetItem<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends SetSchema<infer TItem, ErrorMessage<SetIssue> | undefined>
    ? TItem
    : TSchema extends SetSchemaAsync<infer TItem, ErrorMessage<SetIssue> | undefined>
      ? TItem
      : null;
