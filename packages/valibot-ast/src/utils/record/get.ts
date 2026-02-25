import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type {
  GenericRecordSchema,
  GenericRecordSchemaAsync,
  GetRecordKey,
  GetRecordValue,
} from "./types.ts";
import { isRecordSchema } from "./is.ts";

// @__NO_SIDE_EFFECTS__
export function getRecordKey<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetRecordKey<TSchema> {
  if (!isRecordSchema(schema)) {
    return null as GetRecordKey<TSchema>;
  }
  return schema.key as GetRecordKey<TSchema>;
}

// @__NO_SIDE_EFFECTS__
export function getRecordValue<
  TSchema extends
    | GenericSchema
    | GenericSchemaAsync
    | GenericRecordSchema
    | GenericRecordSchemaAsync,
>(schema: TSchema): GetRecordValue<TSchema> {
  if (!isRecordSchema(schema)) {
    return null as GetRecordValue<TSchema>;
  }
  return schema.value as GetRecordValue<TSchema>;
}
