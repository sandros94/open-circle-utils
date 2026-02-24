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

// @__NO_SIDE_EFFECTS__
export function isAnySchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericAnySchema {
  return "type" in schema && schema.type === "any";
}

// @__NO_SIDE_EFFECTS__
export function isBigintSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericBigintSchema {
  return "type" in schema && schema.type === "bigint";
}

// @__NO_SIDE_EFFECTS__
export function isBlobSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericBlobSchema {
  return "type" in schema && schema.type === "blob";
}

// @__NO_SIDE_EFFECTS__
export function isBooleanSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericBooleanSchema {
  return "type" in schema && schema.type === "boolean";
}

// @__NO_SIDE_EFFECTS__
export function isDateSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericDateSchema {
  return "type" in schema && schema.type === "date";
}

// @__NO_SIDE_EFFECTS__
export function isNanSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericNanSchema {
  return "type" in schema && schema.type === "nan";
}

// @__NO_SIDE_EFFECTS__
export function isNeverSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericNeverSchema {
  return "type" in schema && schema.type === "never";
}

// @__NO_SIDE_EFFECTS__
export function isNullSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericNullSchema {
  return "type" in schema && schema.type === "null";
}

// @__NO_SIDE_EFFECTS__
export function isNumberSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericNumberSchema {
  return "type" in schema && schema.type === "number";
}

// @__NO_SIDE_EFFECTS__
export function isStringSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericStringSchema {
  return "type" in schema && schema.type === "string";
}

// @__NO_SIDE_EFFECTS__
export function isSymbolSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericSymbolSchema {
  return "type" in schema && schema.type === "symbol";
}

// @__NO_SIDE_EFFECTS__
export function isUndefinedSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericUndefinedSchema {
  return "type" in schema && schema.type === "undefined";
}

// @__NO_SIDE_EFFECTS__
export function isUnknownSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericUnknownSchema {
  return "type" in schema && schema.type === "unknown";
}

// @__NO_SIDE_EFFECTS__
export function isVoidSchema<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): schema is TSchema & GenericVoidSchema {
  return "type" in schema && schema.type === "void";
}
