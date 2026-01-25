import type {
  GenericSchema,
  GenericSchemaAsync,
  ObjectSchema,
  ObjectSchemaAsync,
  LooseObjectSchema,
  LooseObjectSchemaAsync,
  StrictObjectSchema,
  StrictObjectSchemaAsync,
  ObjectWithRestSchema,
  ObjectWithRestSchemaAsync,
  ObjectEntries,
  ObjectEntriesAsync,
  ErrorMessage,
  ObjectIssue,
  LooseObjectIssue,
  StrictObjectIssue,
  ObjectWithRestIssue,
} from 'valibot';

export type GenericObjectSchema =
  | ObjectSchema<ObjectEntries, ErrorMessage<ObjectIssue> | undefined>
  | LooseObjectSchema<ObjectEntries, ErrorMessage<LooseObjectIssue> | undefined>
  | StrictObjectSchema<ObjectEntries, ErrorMessage<StrictObjectIssue> | undefined>
  | ObjectWithRestSchema<ObjectEntries, GenericSchema, ErrorMessage<ObjectWithRestIssue> | undefined>
export type GenericObjectSchemaAsync =
  | ObjectSchemaAsync<ObjectEntriesAsync, ErrorMessage<ObjectIssue> | undefined>
  | LooseObjectSchemaAsync<ObjectEntriesAsync, ErrorMessage<LooseObjectIssue> | undefined>
  | StrictObjectSchemaAsync<ObjectEntriesAsync, ErrorMessage<StrictObjectIssue> | undefined>
  | ObjectWithRestSchemaAsync<ObjectEntriesAsync, GenericSchemaAsync, ErrorMessage<ObjectWithRestIssue> | undefined>

type ObjectEntriesArray<TEntries extends ObjectEntries> = {
  [K in keyof TEntries]: [K & string, TEntries[K]];
}[keyof TEntries][];
type ObjectEntriesAsyncArray<TEntries extends ObjectEntriesAsync> = {
  [K in keyof TEntries]: [K & string, TEntries[K]];
}[keyof TEntries][];
export type GetObjectEntries<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericObjectSchema
    | GenericObjectSchemaAsync
> =
  TSchema extends GenericObjectSchema
    ? TSchema['entries'] extends ObjectEntries
      ? ObjectEntriesArray<TSchema['entries']>
      : never
    : TSchema extends GenericObjectSchemaAsync
      ? TSchema['entries'] extends ObjectEntriesAsync
        ? ObjectEntriesAsyncArray<TSchema['entries']>
        : never
      : null;

export type GetObjectEntry<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericObjectSchema
    | GenericObjectSchemaAsync,
  K extends PropertyKey
> =
  TSchema extends GenericObjectSchema
    ? TSchema['entries'] extends ObjectEntries
      ? K extends keyof TSchema['entries']
        ? TSchema['entries'][K]
        : null
      : never
    : TSchema extends GenericObjectSchemaAsync
      ? TSchema['entries'] extends ObjectEntriesAsync
        ? K extends keyof TSchema['entries']
          ? TSchema['entries'][K]
          : null
        : never
      : null;

type ObjectFieldArray<TEntries extends ObjectEntries> = {
  [K in keyof TEntries]: {
    key: K & string;
    schema: TEntries[K];
  };
}[keyof TEntries][];
type ObjectFieldArrayAsync<TEntries extends ObjectEntriesAsync> = {
  [K in keyof TEntries]: {
    key: K & string;
    schema: TEntries[K];
  };
}[keyof TEntries][];
export type GetObjectFields<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericObjectSchema
    | GenericObjectSchemaAsync
> =
  TSchema extends GenericObjectSchema
    ? TSchema['entries'] extends ObjectEntries
      ? ObjectFieldArray<TSchema['entries']>
      : never
    : TSchema extends GenericObjectSchemaAsync
      ? TSchema['entries'] extends ObjectEntriesAsync
        ? ObjectFieldArrayAsync<TSchema['entries']>
        : never
      : null;

export type GetObjectField<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericObjectSchema
    | GenericObjectSchemaAsync,
  K extends PropertyKey
> =
  TSchema extends GenericObjectSchema
    ? TSchema['entries'] extends ObjectEntries
      ? K extends keyof TSchema['entries']
        ? {
          key: K & string;
          schema: TSchema['entries'][K];
        }
        : null
      : never
    : TSchema extends GenericObjectSchemaAsync
      ? TSchema['entries'] extends ObjectEntriesAsync
        ? K extends keyof TSchema['entries']
          ? {
            key: K & string;
            schema: TSchema['entries'][K];
          }
          : null
        : never
      : null;

export type GetObjectRest<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericObjectSchema
    | GenericObjectSchemaAsync
> =
  TSchema extends ObjectWithRestSchema<any, infer TRest, any>
    ? TRest
    : TSchema extends ObjectWithRestSchemaAsync<any, infer TRest, any>
      ? TRest
      : null;
