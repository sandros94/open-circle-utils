import * as v from "valibot";

/**
 * Validation schema for the AST version.
 */
const ASTVersionSchema = v.string("Version must be a string");

/**
 * Validation schema for metadata.
 */
const MetadataSchema = v.record(v.string(), v.unknown());

/**
 * Validation schema for schema info (title, description, etc.).
 */
const SchemaInfoSchema = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  examples: v.optional(v.array(v.any())),
  metadata: v.optional(MetadataSchema),
});

/**
 * Base schema for all AST nodes.
 */
const BaseASTNodeSchema = v.object({
  kind: v.picklist(["schema", "validation", "transformation", "metadata"]),
  type: v.string("Type must be a string"),
  async: v.optional(v.boolean()),
  expects: v.nullish(v.string()),
});

/**
 * Recursive schema definition placeholder
 */
const ASTNodeSchema: v.GenericSchema = v.lazy(() =>
  v.union([
    // Schema nodes first (more specific types before generic ones)
    LazyASTNodeSchema,
    LiteralASTNodeSchema,
    WrappedASTNodeSchema,
    ObjectASTNodeSchema,
    ArrayASTNodeSchema,
    TupleASTNodeSchema,
    UnionASTNodeSchema,
    VariantASTNodeSchema,
    EnumASTNodeSchema,
    PicklistASTNodeSchema,
    RecordASTNodeSchema,
    MapASTNodeSchema,
    SetASTNodeSchema,
    IntersectASTNodeSchema,
    InstanceASTNodeSchema,
    FunctionASTNodeSchema,
    PrimitiveASTNodeSchema,
    // Non-schema nodes
    ValidationASTNodeSchema,
    TransformationASTNodeSchema,
    MetadataASTNodeSchema,
    // Generic schema node - MUST be last as it's the most permissive
    GenericSchemaASTNodeSchema,
  ]),
);

const PipeSchema = v.array(ASTNodeSchema);

/**
 * Generic schema node for schemas that don't have additional properties.
 * This is used for schemas appearing in pipes that only have basic fields.
 */
const GenericSchemaASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const PrimitiveASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.picklist(
    [
      "string",
      "number",
      "boolean",
      "bigint",
      "date",
      "blob",
      "symbol",
      "any",
      "unknown",
      "never",
      "nan",
      "null",
      "undefined",
      "void",
      "file",
      "promise",
    ],
    "Invalid primitive type",
  ),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const LiteralASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("literal"),
  literal: v.union([v.string(), v.number(), v.bigint(), v.boolean()]),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const ObjectASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.picklist([
    "object",
    "loose_object",
    "strict_object",
    "object_with_rest",
  ]),
  entries: v.record(v.string(), ASTNodeSchema),
  rest: v.optional(ASTNodeSchema),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const ArrayASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("array"),
  item: ASTNodeSchema,
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const TupleASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.picklist(["tuple", "loose_tuple", "strict_tuple", "tuple_with_rest"]),
  items: v.array(ASTNodeSchema),
  rest: v.optional(ASTNodeSchema),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const UnionASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("union"),
  options: v.array(ASTNodeSchema),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const VariantASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("variant"),
  key: v.string(),
  options: v.array(ASTNodeSchema),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const EnumASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("enum"),
  enum: v.record(v.string(), v.union([v.string(), v.number()])),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const PicklistASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("picklist"),
  options: v.array(v.union([v.string(), v.number(), v.bigint(), v.boolean()])),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const RecordASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("record"),
  key: ASTNodeSchema,
  value: ASTNodeSchema,
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const MapASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("map"),
  key: ASTNodeSchema,
  value: ASTNodeSchema,
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const SetASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("set"),
  item: ASTNodeSchema,
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const IntersectASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("intersect"),
  options: v.array(ASTNodeSchema),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const InstanceASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("instance"),
  class: v.string(),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const LazyASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("lazy"),
  note: v.literal("lazy-schema-requires-runtime-getter"),
  info: v.optional(SchemaInfoSchema),
});

const WrappedASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.picklist([
    "optional",
    "nullable",
    "nullish",
    "non_optional",
    "non_nullable",
    "non_nullish",
    "exact_optional",
    "undefinedable",
  ]),
  wrapped: ASTNodeSchema,
  default: v.optional(v.any()),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const FunctionASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("schema"),
  type: v.literal("function"),
  pipe: v.optional(PipeSchema),
  info: v.optional(SchemaInfoSchema),
});

const ValidationASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("validation"),
  locales: v.optional(v.any()), // Intentionally loose
  requirement: v.optional(v.any()),
  message: v.optional(v.string()),
  customKey: v.optional(v.string()),
});

const TransformationASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("transformation"),
  requirement: v.optional(v.any()),
  message: v.optional(v.string()),
  note: v.optional(v.string()),
  customKey: v.optional(v.string()),
});

const MetadataASTNodeSchema = v.object({
  ...BaseASTNodeSchema.entries,
  kind: v.literal("metadata"),
  value: v.any(),
});

/**
 * Validation schema for custom transformation metadata.
 */
const CustomTransformationMetaSchema = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  transformationType: v.optional(v.string()),
});

/**
 * Validation schema for custom validation metadata.
 */
const CustomValidationMetaSchema = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  validationType: v.optional(v.string()),
});

/**
 * Complete AST Document Schema.
 * Use this to validate a JSON object before passing it to astToSchema.
 */
export const ASTDocumentSchema: v.ObjectSchema<
  {
    readonly version: v.StringSchema<"Version must be a string">;
    readonly library: v.PicklistSchema<
      ["valibot", "zod", "arktype", "yup", "custom"],
      undefined
    >;
    readonly schema: v.GenericSchema;
    readonly customTransformations: v.OptionalSchema<
      v.RecordSchema<
        v.StringSchema<undefined>,
        v.ObjectSchema<
          {
            readonly name: v.StringSchema<undefined>;
            readonly description: v.OptionalSchema<
              v.StringSchema<undefined>,
              undefined
            >;
            readonly transformationType: v.OptionalSchema<
              v.StringSchema<undefined>,
              undefined
            >;
          },
          undefined
        >,
        undefined
      >,
      undefined
    >;
    readonly customValidations: v.OptionalSchema<
      v.RecordSchema<
        v.StringSchema<undefined>,
        v.ObjectSchema<
          {
            readonly name: v.StringSchema<undefined>;
            readonly description: v.OptionalSchema<
              v.StringSchema<undefined>,
              undefined
            >;
            readonly validationType: v.OptionalSchema<
              v.StringSchema<undefined>,
              undefined
            >;
          },
          undefined
        >,
        undefined
      >,
      undefined
    >;
    readonly metadata: v.OptionalSchema<
      v.RecordSchema<v.StringSchema<undefined>, v.UnknownSchema, undefined>,
      undefined
    >;
  },
  undefined
> = v.object({
  version: ASTVersionSchema,
  library: v.picklist(["valibot", "zod", "arktype", "yup", "custom"]),
  schema: ASTNodeSchema,
  customTransformations: v.optional(
    v.record(v.string(), CustomTransformationMetaSchema),
  ),
  customValidations: v.optional(
    v.record(v.string(), CustomValidationMetaSchema),
  ),
  metadata: v.optional(MetadataSchema),
});
