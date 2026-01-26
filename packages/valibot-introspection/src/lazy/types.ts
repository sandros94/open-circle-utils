import type {
  GenericSchema,
  GenericSchemaAsync,
  LazySchema,
  LazySchemaAsync,
} from "valibot";

export type GenericLazySchema = LazySchema<GenericSchema>;
export type GenericLazySchemaAsync = LazySchemaAsync<
  GenericSchema | GenericSchemaAsync
>;

export type GetLazyGetter<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends LazySchema<infer TWrapped>
    ? () => TWrapped
    : TSchema extends LazySchemaAsync<infer TWrapped>
      ? () => TWrapped
      : null;
