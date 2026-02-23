/**
 * Convert Valibot schemas to AST representation.
 */

import type { GenericSchema, GenericSchemaAsync, GenericPipeItem } from "valibot";
import { isOfKind, getDefault } from "valibot";
import type {
  ASTNode,
  ASTDocument,
  ValidationLibrary,
  ASTVersion,
  SchemaInfoAST,
} from "./types.ts";

// Import all utility functions
import * as i from "valibot-utils";

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
  options?: SchemaToASTOptions
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
          name: transform.name,
          description: transform.description,
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
          name: validation.name,
          description: validation.description,
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
    for (const [key, classConstructor] of options.instanceDictionary.entries()) {
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
          name: getter.name,
          description: getter.description,
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
      if (typeof closure === "function" && ("description" in closure || "context" in closure)) {
        customClosures[key] = {
          name: closure.name,
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
      Object.keys(customTransformations).length > 0 ? customTransformations : undefined,
    customValidations: Object.keys(customValidations).length > 0 ? customValidations : undefined,
    customInstances: Object.keys(customInstances).length > 0 ? customInstances : undefined,
    customLazy: Object.keys(customLazy).length > 0 ? customLazy : undefined,
    customClosures: Object.keys(customClosures).length > 0 ? customClosures : undefined,
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
  options?: SchemaToASTOptions
): ASTNode {
  const schemaType = i.getSchemaType(schema);
  const info = extractSchemaInfo(schema);
  const pipe = extractPipe(schema, options);

  // Handle wrapped schemas (optional, nullable, etc.)
  if (i.isWrappedSchema(schema)) {
    return {
      kind: "schema",
      type: schemaType,
      async: schema.async,
      wrapped: schemaToASTNode(schema.wrapped, options),
      default: getDefault(schema),
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
      async: schema.async,
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
      async: schema.async,
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

    const rest = i.isObjectWithRestSchema(schema) ? i.getObjectRest(schema) : undefined;

    return {
      kind: "schema",
      type: schemaType,
      async: schema.async,
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
      async: schema.async,
      item: item ? schemaToASTNode(item, options) : { kind: "schema", type: "unknown" },
      pipe,
      info,
    } as ASTNode;
  }

  // Handle tuple schemas
  if (i.isTupleSchema(schema)) {
    const items = i.getTupleItems(schema);
    const rest = i.isTupleWithRestSchema(schema) ? i.getTupleRest(schema) : undefined;

    return {
      kind: "schema",
      type: schemaType,
      async: schema.async,
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
      async: schema.async,
      options: optionsArray ? optionsArray.map((opt) => schemaToASTNode(opt, options)) : [],
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
      async: schema.async,
      key: key ?? "",
      options: optionsArray ? optionsArray.map((opt) => schemaToASTNode(opt, options)) : [],
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
      async: schema.async,
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
      async: schema.async,
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
      async: schema.async,
      key: key ? schemaToASTNode(key, options) : { kind: "schema", type: "string" },
      value: value ? schemaToASTNode(value, options) : { kind: "schema", type: "unknown" },
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
      async: schema.async,
      key: key ? schemaToASTNode(key, options) : { kind: "schema", type: "unknown" },
      value: value ? schemaToASTNode(value, options) : { kind: "schema", type: "unknown" },
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
      async: schema.async,
      item: item ? schemaToASTNode(item, options) : { kind: "schema", type: "unknown" },
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
      async: schema.async,
      options: intersectOptions ? intersectOptions.map((opt) => schemaToASTNode(opt, options)) : [],
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
      async: schema.async,
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
      async: schema.async,
      pipe,
      info,
    } as ASTNode;
  }

  // Default: primitive schema
  return {
    kind: "schema",
    type: schemaType,
    async: schema.async,
    pipe,
    info,
  } as ASTNode;
}

/**
 * Extract schema info from metadata.
 */
function extractSchemaInfo<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): SchemaInfoAST | undefined {
  const info = i.getSchemaInfo(schema);

  // Check if metadata object is empty
  const hasMetadata = info.metadata && Object.keys(info.metadata).length > 0;

  if (!info.title && !info.description && !info.examples?.length && !hasMetadata) {
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
  options?: SchemaToASTOptions
): ASTNode[] | undefined {
  if (!i.hasPipe(schema)) {
    return undefined;
  }

  const pipeItems = i.getPipeItems(schema);
  if (!pipeItems || pipeItems.length <= 1) {
    return undefined;
  }

  // Skip index 0 (root schema) and filter out metadata actions.
  // Metadata is already lifted into `info` by extractSchemaInfo.
  const actions = (pipeItems.slice(1) as GenericPipeItem[]).filter(
    (item) => item.kind !== "metadata"
  );
  if (actions.length === 0) {
    return undefined;
  }

  return actions.map((item) => {
    // Nested schema in pipe — recurse to build an AST node for it.
    // Valibot's custom() creates kind:"schema", type:"custom" — treat as a validation instead.
    if (isOfKind("schema", item)) {
      if (item.type !== "custom") {
        return schemaToASTNode(item, options);
      }

      // custom() schema — check function is stored in `.check` (internal Valibot property)
      const check = (item as any).check;
      let customKey: string | undefined;
      if (check && options?.validationDictionary) {
        customKey = findKeyByValue(options.validationDictionary, check);
      }
      return {
        kind: "validation",
        type: item.type,
        async: item.async,
        expects: item.expects,
        message: (item as any).message,
        customKey,
      } as ASTNode;
    }

    // Validation action
    if (isOfKind("validation", item)) {
      // For check() validations the user-supplied predicate is in `.requirement`
      const requirement = (item as any).requirement;
      let customKey: string | undefined;
      if (item.type === "check" && typeof requirement === "function") {
        customKey =
          findKeyByValue(options?.validationDictionary ?? new Map(), requirement) ??
          findKeyByValue(options?.closureDictionary ?? new Map(), requirement);
      }
      return {
        kind: "validation",
        type: item.type,
        async: item.async,
        expects: item.expects,
        requirement,
        message: (item as any).message,
        customKey,
      } as ASTNode;
    }

    // Transformation action
    if (isOfKind("transformation", item)) {
      // For transform() the user-supplied function is in `.operation` (internal Valibot property).
      // Other transformations (trim, toLowerCase, toNumber, …) store their constraint in `.requirement`.
      const operation = (item as any).operation;
      const requirement = (item as any).requirement;
      let customKey: string | undefined;
      if (item.type === "transform" && typeof operation === "function") {
        customKey =
          findKeyByValue(options?.transformationDictionary ?? new Map(), operation) ??
          findKeyByValue(options?.closureDictionary ?? new Map(), operation);
      }
      return {
        kind: "transformation",
        type: item.type,
        async: item.async,
        requirement,
        // Flag only custom `transform` functions that have no dictionary entry
        note:
          item.type === "transform" && !customKey
            ? "custom-transformation-may-not-be-serializable"
            : undefined,
        customKey,
      } as ASTNode;
    }

    throw new Error(
      `Unexpected pipe item kind: ${(item as any).kind} (type: ${(item as any).type})`
    );
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
function findKeyByValue<T>(dictionary: Map<string, T>, value: T): string | undefined {
  for (const [key, dictValue] of dictionary.entries()) {
    if (dictValue === value) {
      return key;
    }
  }
  return undefined;
}
