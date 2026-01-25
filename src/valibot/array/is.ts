import type {
  GenericSchema,
  GenericSchemaAsync,
  TupleItems,
  TupleItemsAsync,
  ErrorMessage,
  TupleWithRestSchema,
  TupleWithRestSchemaAsync,
  TupleWithRestIssue,
} from 'valibot';

import type {
  GenericArraySchema,
  GenericArraySchemaAsync,
  GenericTupleSchema,
  GenericTupleSchemaAsync,
} from './types.ts';

/**
 * Check if a schema is an array schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is an array schema.
 */
// @__NO_SIDE_EFFECTS__
export function isArraySchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema
): schema is TSchema & (
  | GenericArraySchema
  | GenericArraySchemaAsync
) {
  if (!('type' in schema)) return false;

  return schema.type === 'array';
}

/**
 * Check if a schema is a tuple schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a tuple schema.
 */
// @__NO_SIDE_EFFECTS__
export function isTupleSchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema
): schema is TSchema & (
  | GenericTupleSchema
  | GenericTupleSchemaAsync
) {
  if (!('type' in schema)) return false;

  return schema.type === 'tuple'
    || schema.type === 'loose_tuple'
    || schema.type === 'strict_tuple'
    || schema.type === 'tuple_with_rest';
}

/**
 * Check if a schema is a tuple with rest schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a tuple with rest schema.
 */
// @__NO_SIDE_EFFECTS__
export function isTupleWithRestSchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema
): schema is TSchema & (
  | TupleWithRestSchema<TupleItems, GenericSchema, ErrorMessage<TupleWithRestIssue> | undefined>
  | TupleWithRestSchemaAsync<TupleItemsAsync, GenericSchemaAsync, ErrorMessage<TupleWithRestIssue> | undefined>
) {
  if (!('type' in schema)) return false;

  return schema.type === 'tuple_with_rest';
}
