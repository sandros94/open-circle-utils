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

/**
 * Check if a schema is an intersect schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is an intersect schema.
 */
// @__NO_SIDE_EFFECTS__
export function isIntersectSchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema,
): schema is TSchema & (GenericIntersectSchema | GenericIntersectSchemaAsync) {
  if (!("type" in schema)) return false;

  return schema.type === "intersect";
}

/**
 * Check if a schema is an instance schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is an instance schema.
 */
// @__NO_SIDE_EFFECTS__
export function isInstanceSchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(schema: TSchema): schema is TSchema & GenericInstanceSchema<any> {
  if (!("type" in schema)) return false;

  return schema.type === "instance";
}

/**
 * Check if a schema is a map schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a map schema.
 */
// @__NO_SIDE_EFFECTS__
export function isMapSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema,
): schema is TSchema & (GenericMapSchema | GenericMapSchemaAsync) {
  if (!("type" in schema)) return false;

  return schema.type === "map";
}

/**
 * Check if a schema is a set schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a set schema.
 */
// @__NO_SIDE_EFFECTS__
export function isSetSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema,
): schema is TSchema & (GenericSetSchema | GenericSetSchemaAsync) {
  if (!("type" in schema)) return false;

  return schema.type === "set";
}

/**
 * Check if a schema is a function schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a function schema.
 */
// @__NO_SIDE_EFFECTS__
export function isFunctionSchema<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(schema: TSchema): schema is TSchema & GenericFunctionSchema {
  if (!("type" in schema)) return false;

  return schema.type === "function";
}
