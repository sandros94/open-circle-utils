import type {
  GenericSchema,
  GenericSchemaAsync,
  ArraySchema,
  ArraySchemaAsync,
  TupleSchema,
  TupleSchemaAsync,
  LooseTupleSchema,
  LooseTupleSchemaAsync,
  StrictTupleSchema,
  StrictTupleSchemaAsync,
  TupleWithRestSchema,
  TupleWithRestSchemaAsync,
  TupleItems,
  TupleItemsAsync,
  ErrorMessage,
  ArrayIssue,
  TupleIssue,
  LooseTupleIssue,
  StrictTupleIssue,
  TupleWithRestIssue,
} from 'valibot';

export type GenericArraySchema =
  | ArraySchema<GenericSchema, ErrorMessage<ArrayIssue> | undefined>
export type GenericArraySchemaAsync =
  | ArraySchemaAsync<GenericSchemaAsync, ErrorMessage<ArrayIssue> | undefined>

export type GenericTupleSchema =
  | TupleSchema<TupleItems, ErrorMessage<TupleIssue> | undefined>
  | LooseTupleSchema<TupleItems, ErrorMessage<LooseTupleIssue> | undefined>
  | StrictTupleSchema<TupleItems, ErrorMessage<StrictTupleIssue> | undefined>
  | TupleWithRestSchema<TupleItems, GenericSchema, ErrorMessage<TupleWithRestIssue> | undefined>
export type GenericTupleSchemaAsync =
  | TupleSchemaAsync<TupleItemsAsync, ErrorMessage<TupleIssue> | undefined>
  | LooseTupleSchemaAsync<TupleItemsAsync, ErrorMessage<LooseTupleIssue> | undefined>
  | StrictTupleSchemaAsync<TupleItemsAsync, ErrorMessage<StrictTupleIssue> | undefined>
  | TupleWithRestSchemaAsync<TupleItemsAsync, GenericSchema | GenericSchemaAsync, ErrorMessage<TupleWithRestIssue> | undefined>

export type GetArrayItem<
  TSchema extends GenericSchema | GenericSchemaAsync,
> =
  TSchema extends GenericArraySchema | GenericArraySchemaAsync
    ? TSchema['item']
    : null;

export type GetTupleItems<
  TSchema extends GenericSchema | GenericSchemaAsync,
> =
  TSchema extends GenericTupleSchema | GenericTupleSchemaAsync
    ? TSchema['items']
    : null;

export type GetTupleRest<
  TSchema extends GenericSchema | GenericSchemaAsync
> =
  TSchema extends TupleWithRestSchema<any, infer TRest, any>
    ? TRest
    : TSchema extends TupleWithRestSchemaAsync<any, infer TRest, any>
      ? TRest
      : null;
