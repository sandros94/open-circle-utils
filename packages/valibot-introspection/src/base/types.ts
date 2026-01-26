import type {
  AnySchema,
  BigintSchema,
  BlobSchema,
  BooleanSchema,
  DateSchema,
  NanSchema,
  NeverSchema,
  NullSchema,
  NumberSchema,
  StringSchema,
  SymbolSchema,
  UndefinedSchema,
  UnknownSchema,
  VoidSchema,
  ErrorMessage,
  BigintIssue,
  BlobIssue,
  BooleanIssue,
  DateIssue,
  NanIssue,
  NeverIssue,
  NullIssue,
  NumberIssue,
  StringIssue,
  SymbolIssue,
  UndefinedIssue,
  VoidIssue,
} from "valibot";

export type GenericAnySchema = AnySchema;
export type GenericBigintSchema = BigintSchema<
  ErrorMessage<BigintIssue> | undefined
>;
export type GenericBlobSchema = BlobSchema<ErrorMessage<BlobIssue> | undefined>;
export type GenericBooleanSchema = BooleanSchema<
  ErrorMessage<BooleanIssue> | undefined
>;
export type GenericDateSchema = DateSchema<ErrorMessage<DateIssue> | undefined>;
export type GenericNanSchema = NanSchema<ErrorMessage<NanIssue> | undefined>;
export type GenericNeverSchema = NeverSchema<
  ErrorMessage<NeverIssue> | undefined
>;
export type GenericNullSchema = NullSchema<ErrorMessage<NullIssue> | undefined>;
export type GenericNumberSchema = NumberSchema<
  ErrorMessage<NumberIssue> | undefined
>;
export type GenericStringSchema = StringSchema<
  ErrorMessage<StringIssue> | undefined
>;
export type GenericSymbolSchema = SymbolSchema<
  ErrorMessage<SymbolIssue> | undefined
>;
export type GenericUndefinedSchema = UndefinedSchema<
  ErrorMessage<UndefinedIssue> | undefined
>;
export type GenericUnknownSchema = UnknownSchema;
export type GenericVoidSchema = VoidSchema<ErrorMessage<VoidIssue> | undefined>;
