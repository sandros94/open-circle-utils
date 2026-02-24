import type {
  GenericSchema,
  GenericSchemaAsync,
  TupleItems,
  TupleItemsAsync,
  ErrorMessage,
  TupleWithRestSchema,
  TupleWithRestSchemaAsync,
  TupleWithRestIssue,
} from "valibot";

import type {
  GenericArraySchema,
  GenericArraySchemaAsync,
  GenericTupleSchema,
  GenericTupleSchemaAsync,
} from "./types.ts";

// @__NO_SIDE_EFFECTS__
export function isArraySchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericArraySchema | GenericArraySchemaAsync) {
  return "type" in schema && schema.type === "array";
}

// @__NO_SIDE_EFFECTS__
export function isTupleSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericTupleSchema | GenericTupleSchemaAsync) {
  if (!("type" in schema)) return false;
  return (
    schema.type === "tuple" ||
    schema.type === "loose_tuple" ||
    schema.type === "strict_tuple" ||
    schema.type === "tuple_with_rest"
  );
}

// @__NO_SIDE_EFFECTS__
export function isTupleWithRestSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema &
  (
    | TupleWithRestSchema<TupleItems, GenericSchema, ErrorMessage<TupleWithRestIssue> | undefined>
    | TupleWithRestSchemaAsync<
        TupleItemsAsync,
        GenericSchemaAsync,
        ErrorMessage<TupleWithRestIssue> | undefined
      >
  ) {
  return "type" in schema && schema.type === "tuple_with_rest";
}
