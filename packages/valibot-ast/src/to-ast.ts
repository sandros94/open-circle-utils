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
} from "./types.ts";

// Import all utility functions
import * as i from "valibot-introspection";

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
   * Maps unique keys to transformation implementations.
   * This allows the same dictionary to be used for both serialization and deserialization.
   */
  transformationDictionary?: Map<string, (input: any) => any>;

  /**
   * Custom validation dictionary.
   * Maps unique keys to validation implementations.
   * This allows the same dictionary to be used for both serialization and deserialization.
   */
  validationDictionary?: Map<string, (input: any) => boolean>;

  /**
   * Instance class dictionary.
   * Maps unique keys to class constructors.
   * This allows the same dictionary to be used for both serialization and deserialization.
   */
  instanceDictionary?: Map<string, new (...args: any[]) => any>;

  /**
   * Lazy schema getter dictionary.
   * Maps unique keys to lazy getter functions.
   * This allows the same dictionary to be used for both serialization and deserialization.
   */
  lazyDictionary?: Map<string, () => GenericSchema | GenericSchemaAsync>;

  /**
   * Closure dictionary.
   * Maps unique keys to closure implementations with captured context.
   * This allows the same dictionary to be used for both serialization and deserialization.
   */
  closureDictionary?: Map<string, (input: any) => any>;

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
  const customInstances: Record<string, any> = {};
  const customLazy: Record<string, any> = {};
  const customClosures: Record<string, any> = {};

  if (options?.transformationDictionary) {
    for (const [key, transform] of options.transformationDictionary.entries()) {
      // Check if transform has metadata properties (functions with attached metadata)
      if (typeof transform === "function" && "description" in transform) {
        customTransformations[key] = {
          name: (transform as any).name,
          description: (transform as any).description,
          type: (transform as any).type || "unknown",
        };
      } else {
        customTransformations[key] = {
          name: transform.name,
          type: "unknown",
        };
      }
    }
  }

  if (options?.validationDictionary) {
    for (const [key, validation] of options.validationDictionary.entries()) {
      // Check if validation has metadata properties (functions with attached metadata)
      if (typeof validation === "function" && "description" in validation) {
        customValidations[key] = {
          name: (validation as any).name,
          description: (validation as any).description,
          type: (validation as any).type || "unknown",
        };
      } else {
        customValidations[key] = {
          name: validation.name,
          type: "unknown",
        };
      }
    }
  }

  if (options?.instanceDictionary) {
    for (const [
      key,
      classConstructor,
    ] of options.instanceDictionary.entries()) {
      customInstances[key] = {
        className: classConstructor.name,
      };
    }
  }

  if (options?.lazyDictionary) {
    for (const [key, getter] of options.lazyDictionary.entries()) {
      // Check if getter has custom metadata properties (functions with attached metadata)
      if (typeof getter === "function" && "description" in getter) {
        customLazy[key] = {
          name: (getter as any).name,
          description: (getter as any).description,
          type: (getter as any).type || "unknown",
        };
      } else {
        customLazy[key] = {
          name: getter.name,
          type: "unknown",
        };
      }
    }
  }

  if (options?.closureDictionary) {
    for (const [key, closure] of options.closureDictionary.entries()) {
      // Check if closure has custom metadata properties (functions with attached metadata)
      if (
        typeof closure === "function" &&
        ("description" in closure || "context" in closure)
      ) {
        customClosures[key] = {
          name: (closure as any).name,
          description: (closure as any).description,
          type: (closure as any).type || "unknown",
          context: (closure as any).context,
        };
      } else {
        customClosures[key] = {
          name: closure.name,
          type: "unknown",
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
    customInstances:
      Object.keys(customInstances).length > 0 ? customInstances : undefined,
    customLazy: Object.keys(customLazy).length > 0 ? customLazy : undefined,
    customClosures:
      Object.keys(customClosures).length > 0 ? customClosures : undefined,
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
    const unwrapped = i.getWrappedSchema(schema);
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
    const getter = i.getLazyGetter(schema);

    // Check if this lazy getter is in the dictionary
    let customKey: string | undefined;
    if (getter && options?.lazyDictionary) {
      customKey = findKeyByValue(options.lazyDictionary, getter);
    }

    return {
      kind: "schema",
      type: "lazy",
      async: schema.async ?? false,
      customKey,
      note: customKey ? undefined : "lazy-schema-requires-runtime-getter",
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
    let customKey: string | undefined;

    // Check if this class is in the instance dictionary
    if (classRef && options?.instanceDictionary) {
      customKey = findKeyByValue(options.instanceDictionary, classRef);
    }

    return {
      kind: "schema",
      type: "instance",
      async: schema.async ?? false,
      class: classRef?.name ?? "Unknown",
      customKey,
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
        customKey = findKeyByValue(options.validationDictionary, item.check);
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
        customKey = findKeyByValue(
          options.validationDictionary,
          item.requirement,
        );
      }

      // Fallback: check closure dictionary for validation functions
      if (
        !customKey &&
        item.type === "check" &&
        item.requirement &&
        options?.closureDictionary
      ) {
        customKey = findKeyByValue(options.closureDictionary, item.requirement);
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
        customKey = findKeyByValue(
          options.transformationDictionary,
          item.operation,
        );
      }

      // Fallback: check closure dictionary for transformation functions
      if (
        !customKey &&
        item.type === "transform" &&
        item.operation &&
        options?.closureDictionary
      ) {
        customKey = findKeyByValue(options.closureDictionary, item.operation);
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

/**
 * Find a key in a dictionary by searching for a matching value.
 * This allows using Map<string, Function> format for both serialization and deserialization.
 *
 * @param dictionary The dictionary to search
 * @param value The value to find
 * @returns The key if found, undefined otherwise
 */
function findKeyByValue<T>(
  dictionary: Map<string, T>,
  value: T,
): string | undefined {
  for (const [key, dictValue] of dictionary.entries()) {
    if (dictValue === value) {
      return key;
    }
  }
  return undefined;
}
