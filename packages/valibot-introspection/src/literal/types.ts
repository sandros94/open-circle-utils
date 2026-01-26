import type {
  GenericSchema,
  GenericSchemaAsync,
  LiteralSchema,
  ErrorMessage,
  LiteralIssue,
} from "valibot";

export type GenericLiteralSchema<
  TLiteral extends string | number | bigint | boolean,
> = LiteralSchema<TLiteral, ErrorMessage<LiteralIssue> | undefined>;

export type GetLiteralValue<
  TSchema extends GenericSchema | GenericSchemaAsync,
> = TSchema extends LiteralSchema<infer TLiteral, any> ? TLiteral : null;
