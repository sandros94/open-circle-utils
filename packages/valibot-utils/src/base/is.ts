import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type {
  GenericAnySchema,
  GenericBigintSchema,
  GenericBlobSchema,
  GenericBooleanSchema,
  GenericDateSchema,
  GenericNanSchema,
  GenericNeverSchema,
  GenericNullSchema,
  GenericNumberSchema,
  GenericStringSchema,
  GenericSymbolSchema,
  GenericUndefinedSchema,
  GenericUnknownSchema,
  GenericVoidSchema,
} from "./types.ts";

/**
 * Check if a schema is an any schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is an any schema.
 */
// @__NO_SIDE_EFFECTS__
export function isAnySchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericAnySchema {
  if (!("type" in schema)) return false;

  return schema.type === "any";
}

/**
 * Check if a schema is a bigint schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a bigint schema.
 */
// @__NO_SIDE_EFFECTS__
export function isBigintSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericBigintSchema {
  if (!("type" in schema)) return false;

  return schema.type === "bigint";
}

/**
 * Check if a schema is a blob schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a blob schema.
 */
// @__NO_SIDE_EFFECTS__
export function isBlobSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericBlobSchema {
  if (!("type" in schema)) return false;

  return schema.type === "blob";
}

/**
 * Check if a schema is a boolean schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a boolean schema.
 */
// @__NO_SIDE_EFFECTS__
export function isBooleanSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericBooleanSchema {
  if (!("type" in schema)) return false;

  return schema.type === "boolean";
}

/**
 * Check if a schema is a date schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a date schema.
 */
// @__NO_SIDE_EFFECTS__
export function isDateSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericDateSchema {
  if (!("type" in schema)) return false;

  return schema.type === "date";
}

/**
 * Check if a schema is a nan schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a nan schema.
 */
// @__NO_SIDE_EFFECTS__
export function isNanSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericNanSchema {
  if (!("type" in schema)) return false;

  return schema.type === "nan";
}

/**
 * Check if a schema is a never schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a never schema.
 */
// @__NO_SIDE_EFFECTS__
export function isNeverSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericNeverSchema {
  if (!("type" in schema)) return false;

  return schema.type === "never";
}

/**
 * Check if a schema is a null schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a null schema.
 */
// @__NO_SIDE_EFFECTS__
export function isNullSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericNullSchema {
  if (!("type" in schema)) return false;

  return schema.type === "null";
}

/**
 * Check if a schema is a number schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a number schema.
 */
// @__NO_SIDE_EFFECTS__
export function isNumberSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericNumberSchema {
  if (!("type" in schema)) return false;

  return schema.type === "number";
}

/**
 * Check if a schema is a string schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a string schema.
 */
// @__NO_SIDE_EFFECTS__
export function isStringSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericStringSchema {
  if (!("type" in schema)) return false;

  return schema.type === "string";
}

/**
 * Check if a schema is a symbol schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a symbol schema.
 */
// @__NO_SIDE_EFFECTS__
export function isSymbolSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericSymbolSchema {
  if (!("type" in schema)) return false;

  return schema.type === "symbol";
}

/**
 * Check if a schema is an undefined schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is an undefined schema.
 */
// @__NO_SIDE_EFFECTS__
export function isUndefinedSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericUndefinedSchema {
  if (!("type" in schema)) return false;

  return schema.type === "undefined";
}

/**
 * Check if a schema is an unknown schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is an unknown schema.
 */
// @__NO_SIDE_EFFECTS__
export function isUnknownSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericUnknownSchema {
  if (!("type" in schema)) return false;

  return schema.type === "unknown";
}

/**
 * Check if a schema is a void schema.
 *
 * @param schema The schema to check.
 *
 * @returns True if the schema is a void schema.
 */
// @__NO_SIDE_EFFECTS__
export function isVoidSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericVoidSchema {
  if (!("type" in schema)) return false;

  return schema.type === "void";
}
