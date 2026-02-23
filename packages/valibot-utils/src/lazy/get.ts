import type { GenericSchema, GenericSchemaAsync } from "valibot";

import type { GetLazyGetter } from "./types.ts";
import { isLazySchema } from "./is.ts";

/**
 * Get the getter function from a lazy schema.
 *
 * @param schema The schema to extract from.
 *
 * @returns The getter function, or null if not a lazy schema.
 */
// @__NO_SIDE_EFFECTS__
export function getLazyGetter<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): GetLazyGetter<TSchema> {
  if (!isLazySchema(schema)) {
    return null as GetLazyGetter<TSchema>;
  }

  return schema.getter as GetLazyGetter<TSchema>;
}
