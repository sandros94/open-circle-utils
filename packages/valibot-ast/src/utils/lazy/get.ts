import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GetLazyGetter } from "./types.ts";
import { isLazySchema } from "./is.ts";

// @__NO_SIDE_EFFECTS__
export function getLazyGetter<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetLazyGetter<TSchema> {
  if (!isLazySchema(schema)) {
    return null as GetLazyGetter<TSchema>;
  }
  return schema.getter as GetLazyGetter<TSchema>;
}
