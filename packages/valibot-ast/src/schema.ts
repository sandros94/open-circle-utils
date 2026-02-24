/**
 * Valibot schema for validating AST document structure.
 * This can be used to validate AST JSON before deserialization.
 */
import * as v from "valibot";

const ASTKindSchema = v.picklist(["schema", "validation", "transformation", "metadata"]);

const SchemaInfoASTSchema = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  examples: v.optional(v.array(v.unknown())),
  metadata: v.optional(v.record(v.string(), v.unknown())),
});

const BaseASTNodeSchema = v.object({
  kind: ASTKindSchema,
  type: v.string(),
  async: v.optional(v.boolean()),
  expects: v.optional(v.string()),
});

const DictionaryEntryMetaSchema = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  className: v.optional(v.string()),
});

// Use lazy for recursive ASTNode
const ASTNodeSchema: v.GenericSchema = v.lazy(() =>
  v.intersect([
    BaseASTNodeSchema,
    v.looseObject({
      // Schema-specific fields
      literal: v.optional(v.union([v.string(), v.number(), v.bigint(), v.boolean()])),
      entries: v.optional(v.record(v.string(), ASTNodeSchema)),
      rest: v.optional(ASTNodeSchema),
      item: v.optional(ASTNodeSchema),
      items: v.optional(v.array(ASTNodeSchema)),
      options: v.optional(
        v.union([
          v.array(ASTNodeSchema),
          v.array(v.union([v.string(), v.number(), v.bigint(), v.boolean()])),
        ])
      ),
      key: v.optional(v.union([v.string(), ASTNodeSchema])),
      value: v.optional(v.union([ASTNodeSchema, v.unknown()])),
      wrapped: v.optional(ASTNodeSchema),
      default: v.optional(v.unknown()),
      class: v.optional(v.string()),
      enum: v.optional(v.record(v.string(), v.union([v.string(), v.number()]))),
      pipe: v.optional(v.array(ASTNodeSchema)),
      info: v.optional(SchemaInfoASTSchema),
      dictionaryKey: v.optional(v.string()),
      note: v.optional(v.string()),
      // Validation/Transformation fields
      locales: v.optional(v.unknown()),
      requirement: v.optional(v.unknown()),
      message: v.optional(v.string()),
    }),
  ])
);

/**
 * Valibot schema for validating complete AST documents.
 */
export const ASTDocumentSchema: v.GenericSchema = v.object({
  version: v.string(),
  library: v.string(),
  schema: ASTNodeSchema,
  dictionary: v.optional(v.record(v.string(), DictionaryEntryMetaSchema)),
  metadata: v.optional(v.record(v.string(), v.unknown())),
});
