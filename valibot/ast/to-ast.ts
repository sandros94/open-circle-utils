/**
 * Convert Valibot schemas to AST representation.
 */

import type { GenericSchema, GenericSchemaAsync } from "valibot";
import type {
  ASTNode,
  ASTDocument,
  ValidationLibrary,
  ASTVersion,
  SchemaInfoAST,
} from "../../ast/types.ts";

// Import all utility functions
import * as i from "../introspection/index.ts";

/**
 * Current version of the AST specification.
 */
export const AST_VERSION: ASTVersion = "1.0.0";

/**
 * Options for schema to AST conversion.
 */
export interface SchemaToASTOptions {
  /**
   * Custom transformation dictionary.
   * Maps transformation instances or identifiers to unique keys.
   */
  transformationDictionary?: Map<any, string>;

  /**
   * Custom validation dictionary.
   * Maps validation instances or identifiers to unique keys.
   */
  validationDictionary?: Map<any, string>;

  /**
   * Override the library name (defaults to 'valibot').
   */
  library?: ValidationLibrary;

  /**
   * Additional metadata for the document.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Convert a Valibot schema to its AST document representation.
 *
 * @param schema The Valibot schema to convert.
 * @param options Optional conversion options.
 *
 * @returns The AST document representation of the schema.
 */
export function schemaToAST<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema,
  options?: SchemaToASTOptions,
): ASTDocument {
  const astNode = schemaToASTNode(schema, options);

  // Build the custom dictionaries metadata
  const customTransformations: Record<string, any> = {};
  const customValidations: Record<string, any> = {};

  if (options?.transformationDictionary) {
    for (const [transform, key] of options.transformationDictionary.entries()) {
      // Check if transform has metadata properties
      if (typeof transform === "object" && transform !== null) {
        customTransformations[key] = {
          name: transform.name || key,
          description: transform.description,
          transformationType: transform.type || "custom",
        };
      } else {
        // Plain function - create basic metadata
        customTransformations[key] = {
          name: transform.name || key,
          transformationType: "custom",
        };
      }
    }
  }

  if (options?.validationDictionary) {
    for (const [validation, key] of options.validationDictionary.entries()) {
      // Check if validation has metadata properties
      if (typeof validation === "object" && validation !== null) {
        customValidations[key] = {
          name: validation.name || key,
          description: validation.description,
          validationType: validation.type || "custom",
        };
      } else {
        // Plain function - create basic metadata
        customValidations[key] = {
          name: validation.name || key,
          validationType: "custom",
        };
      }
    }
  }

  return {
    version: AST_VERSION,
    library: options?.library ?? "valibot",
    schema: astNode,
    customTransformations:
      Object.keys(customTransformations).length > 0
        ? customTransformations
        : undefined,
    customValidations:
      Object.keys(customValidations).length > 0 ? customValidations : undefined,
    metadata: options?.metadata,
  };
}

/**
 * Convert a Valibot schema to its AST node representation (internal).
 *
 * @param schema The Valibot schema to convert.
 * @param options Optional conversion options.
 *
 * @returns The AST node representation of the schema.
 */
function schemaToASTNode<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema,
  options?: SchemaToASTOptions,
): ASTNode {
  const schemaType = i.getSchemaType(schema);
  const info = extractSchemaInfo(schema);
  const pipe = extractPipe(schema, options);

  // Handle wrapped schemas (optional, nullable, etc.)
  if (i.isWrappedSchema(schema)) {
    const unwrapped = i.getUnwrappedSchema(schema);
    return {
      kind: "schema",
      type: schemaType,
      async: schema.async ?? false,
      wrapped: schemaToASTNode(unwrapped.schema, options),
      default: unwrapped.defaultValue,
      pipe,
      info,
    } as ASTNode;
  }

  // Handle lazy schemas
  if (i.isLazySchema(schema)) {
    return {
      kind: "schema",
      type: "lazy",
      async: schema.async ?? false,
      note: "lazy-schema-requires-runtime-getter",
      info,
    } as ASTNode;
  }

  // Handle literal schemas
  if (i.isLiteralSchema(schema)) {
    return {
      kind: "schema",
      type: "literal",
      async: schema.async ?? false,
      literal: i.getLiteralValue(schema),
      pipe,
      info,
    } as ASTNode;
  }

  // Handle object schemas
  if (i.isObjectSchema(schema)) {
    const entries = i.getObjectEntries(schema);
    const astEntries: Record<string, ASTNode> = {};

    if (entries) {
      for (const [key, value] of entries) {
        astEntries[key] = schemaToASTNode(value, options);
      }
    }

    const rest = i.isObjectWithRestSchema(schema)
      ? i.getObjectRest(schema)
      : undefined;

    return {
      kind: "schema",
      type: schemaType,
      async: schema.async ?? false,
      entries: astEntries,
      rest: rest ? schemaToASTNode(rest, options) : undefined,
      pipe,
      info,
    } as ASTNode;
  }

  // Handle array schemas
  if (i.isArraySchema(schema)) {
    const item = i.getArrayItem(schema);
    return {
      kind: "schema",
      type: "array",
      async: schema.async ?? false,
      item: item
        ? schemaToASTNode(item, options)
        : { kind: "schema", type: "unknown" },
      pipe,
      info,
    } as ASTNode;
  }

  // Handle tuple schemas
  if (i.isTupleSchema(schema)) {
    const items = i.getTupleItems(schema);
    const rest = i.isTupleWithRestSchema(schema)
      ? i.getTupleRest(schema)
      : undefined;

    return {
      kind: "schema",
      type: schemaType,
      async: schema.async ?? false,
      items: items ? items.map((item) => schemaToASTNode(item, options)) : [],
      rest: rest ? schemaToASTNode(rest, options) : undefined,
      pipe,
      info,
    } as ASTNode;
  }

  // Handle union schemas
  if (i.isUnionSchema(schema)) {
    const optionsArray = i.getUnionOptions(schema);
    return {
      kind: "schema",
      type: "union",
      async: schema.async ?? false,
      options: optionsArray
        ? optionsArray.map((opt) => schemaToASTNode(opt, options))
        : [],
      pipe,
      info,
    } as ASTNode;
  }

  // Handle variant schemas
  if (i.isVariantSchema(schema)) {
    const key = i.getVariantKey(schema);
    const optionsArray = i.getVariantOptions(schema);
    return {
      kind: "schema",
      type: "variant",
      async: schema.async ?? false,
      key: key ?? "",
      options: optionsArray
        ? optionsArray.map((opt) => schemaToASTNode(opt, options))
        : [],
      pipe,
      info,
    } as ASTNode;
  }

  // Handle enum schemas
  if (i.isEnumSchema(schema)) {
    const enumOptions = i.getEnumOptions(schema);
    return {
      kind: "schema",
      type: "enum",
      async: schema.async ?? false,
      enum: enumOptions ?? {},
      pipe,
      info,
    } as ASTNode;
  }

  // Handle picklist schemas
  if (i.isPicklistSchema(schema)) {
    const picklistOptions = i.getPicklistOptions(schema);
    return {
      kind: "schema",
      type: "picklist",
      async: schema.async ?? false,
      options: picklistOptions ?? [],
      pipe,
      info,
    } as ASTNode;
  }

  // Handle record schemas
  if (i.isRecordSchema(schema)) {
    const key = i.getRecordKey(schema);
    const value = i.getRecordValue(schema);
    return {
      kind: "schema",
      type: "record",
      async: schema.async ?? false,
      key: key
        ? schemaToASTNode(key, options)
        : { kind: "schema", type: "string" },
      value: value
        ? schemaToASTNode(value, options)
        : { kind: "schema", type: "unknown" },
      pipe,
      info,
    } as ASTNode;
  }

  // Handle map schemas
  if (i.isMapSchema(schema)) {
    const key = i.getMapKey(schema);
    const value = i.getMapValue(schema);
    return {
      kind: "schema",
      type: "map",
      async: schema.async ?? false,
      key: key
        ? schemaToASTNode(key, options)
        : { kind: "schema", type: "unknown" },
      value: value
        ? schemaToASTNode(value, options)
        : { kind: "schema", type: "unknown" },
      pipe,
      info,
    } as ASTNode;
  }

  // Handle set schemas
  if (i.isSetSchema(schema)) {
    const item = i.getSetItem(schema);
    return {
      kind: "schema",
      type: "set",
      async: schema.async ?? false,
      item: item
        ? schemaToASTNode(item, options)
        : { kind: "schema", type: "unknown" },
      pipe,
      info,
    } as ASTNode;
  }

  // Handle intersect schemas
  if (i.isIntersectSchema(schema)) {
    const intersectOptions = i.getIntersectOptions(schema);
    return {
      kind: "schema",
      type: "intersect",
      async: schema.async ?? false,
      options: intersectOptions
        ? intersectOptions.map((opt) => schemaToASTNode(opt, options))
        : [],
      pipe,
      info,
    } as ASTNode;
  }

  // Handle instance schemas
  if (i.isInstanceSchema(schema)) {
    const classRef = i.getInstanceClass(schema);
    return {
      kind: "schema",
      type: "instance",
      async: schema.async ?? false,
      class: classRef?.name ?? "Unknown",
      pipe,
      info,
    } as ASTNode;
  }

  // Handle function schemas
  if (i.isFunctionSchema(schema)) {
    return {
      kind: "schema",
      type: "function",
      async: schema.async ?? false,
      pipe,
      info,
    } as ASTNode;
  }

  // Default: primitive schema
  return {
    kind: "schema",
    type: schemaType,
    async: schema.async ?? false,
    pipe,
    info,
  } as ASTNode;
}

/**
 * Extract schema info from metadata.
 */
function extractSchemaInfo<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema,
): SchemaInfoAST | undefined {
  const info = i.getSchemaInfo(schema);

  // Check if metadata object is empty
  const hasMetadata = info.metadata && Object.keys(info.metadata).length > 0;

  if (
    !info.title &&
    !info.description &&
    !info.examples?.length &&
    !hasMetadata
  ) {
    return undefined;
  }

  return {
    title: info.title,
    description: info.description,
    examples: info.examples?.length ? info.examples : undefined,
    metadata: hasMetadata ? info.metadata : undefined,
  };
}

/**
 * Extract and convert pipe items to AST.
 */
function extractPipe<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema,
  options?: SchemaToASTOptions,
): ASTNode[] | undefined {
  if (!i.hasPipe(schema)) {
    return undefined;
  }

  const pipeItems = i.getPipeItems(schema);
  if (!pipeItems || pipeItems.length === 0) {
    return undefined;
  }

  return pipeItems.map((item: any) => {
    // Nested schema in pipe
    if (item.kind === "schema" && item.type !== "custom") {
      return schemaToASTNode(item, options);
    }

    // Custom validation (kind is 'schema' with type 'custom')
    if (item.kind === "schema" && item.type === "custom") {
      // Check if this is a custom validation in the dictionary
      let customKey: string | undefined;
      if (item.check && options?.validationDictionary) {
        customKey = options.validationDictionary.get(item.check);
      }

      return {
        kind: "validation",
        type: item.type,
        async: item.async ?? false,
        expects: item.expects,
        message: item.message,
        customKey,
      } as ASTNode;
    }

    // Validation
    if (item.kind === "validation") {
      // Check if this is a custom validation in the dictionary
      // For 'check' type validations, the function is in 'requirement'
      let customKey: string | undefined;
      if (
        item.type === "check" &&
        item.requirement &&
        options?.validationDictionary
      ) {
        customKey = options.validationDictionary.get(item.requirement);
      }

      return {
        kind: "validation",
        type: item.type,
        async: item.async ?? false,
        expects: item.expects,
        requirement: item.requirement,
        message: item.message,
        customKey,
      } as ASTNode;
    }

    // Transformation
    if (item.kind === "transformation") {
      // Check if this is a custom transformation in the dictionary
      let customKey: string | undefined;
      if (
        item.type === "transform" &&
        item.operation &&
        options?.transformationDictionary
      ) {
        customKey = options.transformationDictionary.get(item.operation);
      }

      return {
        kind: "transformation",
        type: item.type,
        async: item.async ?? false,
        expects: item.expects,
        note: customKey
          ? undefined
          : "custom-transformation-may-not-be-serializable",
        customKey,
      } as ASTNode;
    }

    // Metadata
    return {
      kind: "metadata",
      type: item.type ?? "unknown",
      async: item.async ?? false,
      value: item,
    } as ASTNode;
  });
}
