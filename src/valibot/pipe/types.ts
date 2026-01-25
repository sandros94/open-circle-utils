// deno-lint-ignore-file ban-types
import type {
  GenericSchema,
  GenericSchemaAsync,
  SchemaWithPipe,
  SchemaWithPipeAsync,
  GenericPipeItem,
  GenericPipeItemAsync,
  GenericPipeAction,
  GenericPipeActionAsync,
} from 'valibot';

export type GenericSchemaWithPipe = SchemaWithPipe<readonly [GenericSchema, ...GenericPipeItem[]]>
export type GenericSchemaWithPipeAsync = SchemaWithPipeAsync<readonly [GenericSchema | GenericSchemaAsync, ...(GenericPipeItem | GenericPipeItemAsync)[]]>

export type GetPipeItems<
  TSchema extends GenericSchema | GenericSchemaAsync
> = TSchema extends GenericSchemaWithPipe | GenericSchemaWithPipeAsync
  ? TSchema['pipe']
  : null;

export type GetPipeActions<
  TSchema extends GenericSchema | GenericSchemaAsync
> = TSchema extends GenericSchemaWithPipe | GenericSchemaWithPipeAsync
  ? Extract<
    TSchema['pipe'][number],
    GenericPipeAction | GenericPipeActionAsync
  >[]
  : null;

export type FindPipeItems<
  TSchema extends GenericSchema | GenericSchemaAsync,
  TFilters extends Partial<{
    kind: (
      TSchema extends
        | GenericSchemaWithPipe | GenericSchemaWithPipeAsync
        ? GetPipeItems<TSchema>[number]['kind'] | (string & {})
        : string
    )[]
    type: (
      TSchema extends
        | GenericSchemaWithPipe | GenericSchemaWithPipeAsync
        ? GetPipeItems<TSchema>[number]['type'] | (string & {})
        : string
    )[]
  }>
> = TSchema extends GenericSchemaWithPipe | GenericSchemaWithPipeAsync
  ? Extract<
    TSchema['pipe'][number],
    ('kind' extends keyof TFilters
      ? TFilters['kind'] extends (GenericPipeItem['kind'] | GenericPipeItemAsync['kind'])[]
        ? { kind: TFilters['kind'][number] }
        : GenericPipeItem | GenericPipeItemAsync
      : GenericPipeItem | GenericPipeItemAsync
    ) & ('type' extends keyof TFilters
      ? TFilters['type'] extends (GenericPipeItem['type'] | GenericPipeItemAsync['type'])[]
        ? { type: TFilters['type'][number] }
        : GenericPipeItem | GenericPipeItemAsync
      : GenericPipeItem | GenericPipeItemAsync
    )
  >[]
  : null;

export type GetLengthActions<
  TSchema extends GenericSchema | GenericSchemaAsync,
> = TSchema extends GenericSchemaWithPipe | GenericSchemaWithPipeAsync
  ? Extract<
    TSchema['pipe'][number],
    { type: 'min_length' | 'max_length' | 'length' }
  >[]
  : null;

export type GetValueActions<
  TSchema extends GenericSchema | GenericSchemaAsync,
> = TSchema extends GenericSchemaWithPipe | GenericSchemaWithPipeAsync
  ? Extract<
    TSchema['pipe'][number],
    { type: 'min_value' | 'max_value' | 'value' }
  >[]
  : null;

export type GetSizeActions<
  TSchema extends GenericSchema | GenericSchemaAsync,
> = TSchema extends GenericSchemaWithPipe | GenericSchemaWithPipeAsync
  ? Extract<
    TSchema['pipe'][number],
    { type: 'min_size' | 'max_size' | 'size' }
  >[]
  : null;

export type GetBytesActions<
  TSchema extends GenericSchema | GenericSchemaAsync,
> = TSchema extends GenericSchemaWithPipe | GenericSchemaWithPipeAsync
  ? Extract<
    TSchema['pipe'][number],
    { type: 'min_bytes' | 'max_bytes' | 'bytes' }
  >[]
  : null;
