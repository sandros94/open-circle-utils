import type { GenericSchema, GenericSchemaAsync } from "valibot";

// @__NO_SIDE_EFFECTS__
export function getSchemaType<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): TSchema["type"] {
  return schema.type;
}
