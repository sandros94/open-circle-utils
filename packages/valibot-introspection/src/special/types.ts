import type {
  GenericSchema,
  GenericSchemaAsync,
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

export type GenericInstanceSchema<TClass extends new (...args: any) => any> = InstanceSchema<
  TClass,
  ErrorMessage<InstanceIssue> | undefined
>;

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
  TSchema extends IntersectSchema<infer TOptions, any>
    ? TOptions
    : TSchema extends IntersectSchemaAsync<infer TOptions, any>
      ? TOptions
      : null;

export type GetInstanceClass<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends InstanceSchema<infer TClass, any> ? TClass : null;

export type GetMapKey<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends MapSchema<infer TKey, any, any>
    ? TKey
    : TSchema extends MapSchemaAsync<infer TKey, any, any>
      ? TKey
      : null;

export type GetMapValue<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends MapSchema<any, infer TValue, any>
    ? TValue
    : TSchema extends MapSchemaAsync<any, infer TValue, any>
      ? TValue
      : null;

export type GetSetItem<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends SetSchema<infer TItem, any>
    ? TItem
    : TSchema extends SetSchemaAsync<infer TItem, any>
      ? TItem
      : null;
