/**
 * Valibot schema for validating AST document structure.
 * This can be used to validate AST JSON before deserialization.
 */
import * as v from "valibot";

import type { ASTNode } from "./types/index.ts";

const SchemaInfoASTSchema = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  examples: v.optional(v.array(v.unknown())),
  metadata: v.optional(v.record(v.string(), v.unknown())),
});

const DictionaryEntryMetaSchema = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  className: v.optional(v.string()),
});

const NonEmtryStringSchema = v.pipe(v.string(), v.trim(), v.nonEmpty());

const BaseASTNodeSchema = v.object({
  async: v.optional(v.boolean()),
  expects: v.optional(v.string()),
});

// Use lazy for recursive ASTNode
const ASTNodeSchema: v.GenericSchema<ASTNode> = v.lazy(() =>
  v.union([
    // Kind Schema
    v.intersect([
      v.object({
        ...BaseASTNodeSchema.entries,
        kind: v.literal("schema"),
        pipe: v.optional(v.array(ASTNodeSchema)),
        info: v.optional(SchemaInfoASTSchema),
      }),
      v.union([
        // Primitive Node
        v.object({
          type: v.picklist([
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
          ]),
        }),
        // Literal Node
        v.object({
          type: v.literal("literal"),
          literal: v.union([v.string(), v.number(), v.bigint(), v.boolean()]),
        }),
        // Object Node
        v.object({
          type: v.picklist(["object", "loose_object", "strict_object", "object_with_rest"]),
          entries: v.record(v.string(), ASTNodeSchema),
          rest: v.optional(ASTNodeSchema),
        }),
        // Array Node
        v.object({
          type: v.literal("array"),
          item: ASTNodeSchema,
        }),
        // Tuple Node
        v.object({
          type: v.picklist(["tuple", "loose_tuple", "strict_tuple", "tuple_with_rest"]),
          items: v.array(ASTNodeSchema),
          rest: v.optional(ASTNodeSchema),
        }),
        // Union Node
        v.object({
          type: v.literal("union"),
          options: v.array(ASTNodeSchema),
        }),
        // Variant Node
        v.object({
          type: v.literal("variant"),
          key: NonEmtryStringSchema,
          options: v.array(ASTNodeSchema),
        }),
        // Enum Node
        v.object({
          type: v.literal("enum"),
          enum: v.record(v.string(), v.union([v.string(), v.number()])),
        }),
        // Picklist Node
        v.object({
          type: v.literal("picklist"),
          options: v.array(v.union([v.string(), v.number(), v.bigint(), v.boolean()])),
        }),
        // Record Node
        v.object({
          type: v.literal("record"),
          key: ASTNodeSchema,
          value: ASTNodeSchema,
        }),
        // Map Node
        v.object({
          type: v.literal("map"),
          key: ASTNodeSchema,
          value: ASTNodeSchema,
        }),
        // Set Node
        v.object({
          type: v.literal("set"),
          item: ASTNodeSchema,
        }),
        // Intersect Node
        v.object({
          type: v.literal("intersect"),
          options: v.array(ASTNodeSchema),
        }),
        // Instance Node
        v.object({
          type: v.literal("instance"),
          class: NonEmtryStringSchema,
          dictionaryKey: v.optional(NonEmtryStringSchema),
        }),
        // Wrapped Node
        v.object({
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
          default: v.optional(v.unknown()),
        }),
        // Function Node
        v.object({
          type: v.literal("function"),
          dictionaryKey: v.optional(NonEmtryStringSchema),
        }),
      ]),
    ]),
    // Lazy Node
    v.object({
      ...BaseASTNodeSchema.entries,
      kind: v.literal("schema"),
      type: v.literal("lazy"),
      dictionaryKey: v.optional(NonEmtryStringSchema),
      note: v.optional(v.string()),
      info: v.optional(SchemaInfoASTSchema),
    }),
    // Validation Node
    v.object({
      ...BaseASTNodeSchema.entries,
      kind: v.literal("validation"),
      type: NonEmtryStringSchema,
      locales: v.optional(v.union([v.string(), v.pipe(v.array(v.string()), v.readonly())])),
      requirement: v.optional(v.unknown()),
      message: v.optional(v.string()),
      dictionaryKey: v.optional(NonEmtryStringSchema),
    }),
    // Transformation Node
    v.object({
      ...BaseASTNodeSchema.entries,
      kind: v.literal("transformation"),
      type: NonEmtryStringSchema,
      requirement: v.optional(v.unknown()),
      message: v.optional(v.string()),
      note: v.optional(v.string()),
      dictionaryKey: v.optional(NonEmtryStringSchema),
    }),
    // Metadata Node
    v.object({
      ...BaseASTNodeSchema.entries,
      kind: v.literal("metadata"),
      type: NonEmtryStringSchema,
      value: v.unknown(),
    }),
  ])
);

/**
 * Valibot schema for validating complete AST documents.
 */
export const ASTDocumentSchema: v.ObjectSchema<
  {
    readonly version: v.StringSchema<undefined>;
    readonly library: v.PicklistSchema<["valibot"], undefined>;
    readonly schema: v.GenericSchema<ASTNode>;
    readonly dictionary: v.OptionalSchema<
      v.RecordSchema<
        v.StringSchema<undefined>,
        v.ObjectSchema<
          {
            readonly name: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly description: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly category: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly className: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
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
  version: v.string(),
  library: v.picklist(["valibot"]),
  schema: ASTNodeSchema,
  dictionary: v.optional(v.record(v.string(), DictionaryEntryMetaSchema)),
  metadata: v.optional(v.record(v.string(), v.unknown())),
});
