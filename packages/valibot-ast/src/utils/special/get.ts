import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type {
  GetIntersectOptions,
  GetInstanceClass,
  GetMapKey,
  GetMapValue,
  GetSetItem,
} from "./types.ts";
import { isIntersectSchema, isInstanceSchema, isMapSchema, isSetSchema } from "./is.ts";

// @__NO_SIDE_EFFECTS__
export function getIntersectOptions<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetIntersectOptions<TSchema> {
  if (!isIntersectSchema(schema)) {
    return null as GetIntersectOptions<TSchema>;
  }
  return schema.options as GetIntersectOptions<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getInstanceClass<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetInstanceClass<TSchema> {
  if (!isInstanceSchema(schema)) {
    return null as GetInstanceClass<TSchema>;
  }
  return schema.class as GetInstanceClass<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getMapKey<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetMapKey<TSchema> {
  if (!isMapSchema(schema)) {
    return null as GetMapKey<TSchema>;
  }
  return schema.key as GetMapKey<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getMapValue<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetMapValue<TSchema> {
  if (!isMapSchema(schema)) {
    return null as GetMapValue<TSchema>;
  }
  return schema.value as GetMapValue<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getSetItem<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetSetItem<TSchema> {
  if (!isSetSchema(schema)) {
    return null as GetSetItem<TSchema>;
  }
  return schema.value as GetSetItem<TSchema>;
}
