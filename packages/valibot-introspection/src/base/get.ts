import type { GenericSchema, GenericSchemaAsync } from "valibot";

export function getSchemaType<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(schema: TSchema): TSchema["type"] {
  return schema.type;
}
