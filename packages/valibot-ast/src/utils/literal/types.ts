import type {
  GenericSchema,
  GenericSchemaAsync,
  LiteralSchema,
  ErrorMessage,
  LiteralIssue,
} from "valibot";

export type GenericLiteralSchema = LiteralSchema<
  string | number | bigint | boolean,
  ErrorMessage<LiteralIssue> | undefined
>;

export type GetLiteralValue<TSchema extends GenericSchema | GenericSchemaAsync> =
  TSchema extends LiteralSchema<infer TLiteral, ErrorMessage<LiteralIssue> | undefined>
    ? TLiteral
    : null;
