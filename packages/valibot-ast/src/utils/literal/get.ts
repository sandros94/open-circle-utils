import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GetLiteralValue } from "./types.ts";
import { isLiteralSchema } from "./is.ts";

// @__NO_SIDE_EFFECTS__
export function getLiteralValue<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetLiteralValue<TSchema> {
  if (!isLiteralSchema(schema)) {
    return null as GetLiteralValue<TSchema>;
  }
  return schema.literal as GetLiteralValue<TSchema>;
}
