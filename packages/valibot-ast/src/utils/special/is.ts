import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type {
  GenericIntersectSchema,
  GenericIntersectSchemaAsync,
  GenericInstanceSchema,
  GenericMapSchema,
  GenericMapSchemaAsync,
  GenericSetSchema,
  GenericSetSchemaAsync,
  GenericFunctionSchema,
} from "./types.ts";

// @__NO_SIDE_EFFECTS__
export function isIntersectSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericIntersectSchema | GenericIntersectSchemaAsync) {
  return "type" in schema && schema.type === "intersect";
}

// @__NO_SIDE_EFFECTS__
export function isInstanceSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericInstanceSchema {
  return "type" in schema && schema.type === "instance";
}

// @__NO_SIDE_EFFECTS__
export function isMapSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericMapSchema | GenericMapSchemaAsync) {
  return "type" in schema && schema.type === "map";
}

// @__NO_SIDE_EFFECTS__
export function isSetSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & (GenericSetSchema | GenericSetSchemaAsync) {
  return "type" in schema && schema.type === "set";
}

// @__NO_SIDE_EFFECTS__
export function isFunctionSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericFunctionSchema {
  return "type" in schema && schema.type === "function";
}
