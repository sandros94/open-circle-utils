import type { GenericSchema, GenericSchemaAsync } from "valibot";
import { getDefault, getTitle, getDescription, getExamples, getMetadata } from "valibot";

import type {
  ASTDocument,
  ASTNode,
  SchemaInfoAST,
  DictionaryEntryMeta,
  ValidationLibrary,
} from "./types/index.ts";
import type { DictionaryMap } from "./dictionary.ts";
import { findKeyByValue } from "./dictionary.ts";

export const AST_VERSION = "1.0.0" as const;

export interface SchemaToASTOptions {
  dictionary?: DictionaryMap;
  // TODO: extract `library` automatically from schema's `~standard` property
  metadata?: Record<string, unknown>;
}

export interface SchemaToASTResult {
  document: ASTDocument;
  /** The dictionary entries that were actually referenced during serialization. */
  referencedDictionary: DictionaryMap;
}

/**
 * Convert a Valibot schema to an AST document.
 */
// @__NO_SIDE_EFFECTS__
export function schemaToAST<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema,
  options?: SchemaToASTOptions
): SchemaToASTResult {
  const referencedDictionary: DictionaryMap = new Map();
  const context: SerializationContext = {
    dictionary: options?.dictionary,
    referencedDictionary,
  };

  const astNode = schemaToASTNode(schema, context);

  const dictionaryManifest: Record<string, DictionaryEntryMeta> | undefined =
    referencedDictionary.size > 0
      ? Object.fromEntries(
          [...referencedDictionary.entries()].map(([key, value]) => {
            const meta: DictionaryEntryMeta = {};
            if (typeof value === "function") {
              if (value.name) meta.name = value.name;
              if ("description" in value && typeof value.description === "string")
                meta.description = value.description;
              if ("category" in value && typeof value.category === "string")
                meta.category = value.category;
              // Check if it's a class constructor
              if (value.prototype && value.prototype.constructor === value) {
                meta.category = meta.category ?? "instance";
                meta.className = value.name;
              }
            }
            return [key, meta];
          })
        )
      : undefined;

  const document: ASTDocument = {
    version: AST_VERSION,
    library: "valibot" as ValidationLibrary,
    schema: astNode,
    ...(dictionaryManifest ? { dictionary: dictionaryManifest } : {}),
    ...(options?.metadata ? { metadata: options.metadata } : {}),
  };

  return { document, referencedDictionary };
}

interface SerializationContext {
  dictionary?: DictionaryMap;
  referencedDictionary: DictionaryMap;
}

function trackDictionaryRef(key: string, context: SerializationContext): void {
  if (context.dictionary) {
    const value = context.dictionary.get(key);
    if (value !== undefined) {
      context.referencedDictionary.set(key, value);
    }
  }
}

function schemaToASTNode(
  schema: GenericSchema | GenericSchemaAsync,
  context: SerializationContext
): ASTNode {
  const type = schema.type;
  const async = schema.async || undefined;
  const expects = schema.expects || undefined;
  const info = extractSchemaInfo(schema);
  const pipe = extractPipe(schema, context);

  // Wrapped schemas (optional, nullable, nullish, etc.)
  if ("wrapped" in schema) {
    const wrappedSchema = schema as any;
    const defaultValue = getDefault(wrappedSchema);
    const serializedDefault = typeof defaultValue === "function" ? undefined : defaultValue;

    return {
      kind: "schema" as const,
      type: type as any,
      async,
      expects,
      wrapped: schemaToASTNode(wrappedSchema.wrapped, context),
      ...(serializedDefault !== undefined ? { default: serializedDefault } : {}),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Lazy schemas
  if (type === "lazy") {
    const lazySchema = schema as any;
    let dictionaryKey: string | undefined;
    let note: string | undefined;

    if (context.dictionary) {
      const key = findKeyByValue(context.dictionary, lazySchema.getter);
      if (key) {
        dictionaryKey = key;
        trackDictionaryRef(key, context);
      }
    }

    if (!dictionaryKey) {
      note = "lazy-schema-requires-runtime-getter";
    }

    return {
      kind: "schema" as const,
      type: "lazy" as const,
      async,
      ...(dictionaryKey ? { dictionaryKey } : {}),
      ...(note ? { note } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Literal schemas
  if (type === "literal") {
    const literalSchema = schema as any;
    return {
      kind: "schema" as const,
      type: "literal" as const,
      async,
      expects,
      literal: literalSchema.literal,
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Object schemas (object, loose_object, strict_object, object_with_rest)
  if ("entries" in schema) {
    const objSchema = schema as any;
    const entries: Record<string, ASTNode> = {};
    for (const [key, value] of Object.entries(objSchema.entries)) {
      entries[key] = schemaToASTNode(value as GenericSchema | GenericSchemaAsync, context);
    }

    const rest =
      type === "object_with_rest" && "rest" in objSchema
        ? schemaToASTNode(objSchema.rest, context)
        : undefined;

    return {
      kind: "schema" as const,
      type: type as "object" | "loose_object" | "strict_object" | "object_with_rest",
      async,
      expects,
      entries,
      ...(rest ? { rest } : {}),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Array schemas
  if (type === "array" && "item" in schema) {
    const arraySchema = schema as any;
    return {
      kind: "schema" as const,
      type: "array" as const,
      async,
      expects,
      item: schemaToASTNode(arraySchema.item, context),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Tuple schemas
  if (
    "items" in schema &&
    (type === "tuple" ||
      type === "loose_tuple" ||
      type === "strict_tuple" ||
      type === "tuple_with_rest")
  ) {
    const tupleSchema = schema as any;
    const items = tupleSchema.items.map((item: any) => schemaToASTNode(item, context));

    const rest =
      type === "tuple_with_rest" && "rest" in tupleSchema
        ? schemaToASTNode(tupleSchema.rest, context)
        : undefined;

    return {
      kind: "schema" as const,
      type: type as "tuple" | "loose_tuple" | "strict_tuple" | "tuple_with_rest",
      async,
      expects,
      items,
      ...(rest ? { rest } : {}),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Union schemas
  if (type === "union" && "options" in schema) {
    const unionSchema = schema as any;
    return {
      kind: "schema" as const,
      type: "union" as const,
      async,
      expects,
      options: unionSchema.options.map((opt: any) => schemaToASTNode(opt, context)),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Variant schemas
  if (type === "variant" && "key" in schema && "options" in schema) {
    const variantSchema = schema as any;
    return {
      kind: "schema" as const,
      type: "variant" as const,
      async,
      expects,
      key: variantSchema.key,
      options: variantSchema.options.map((opt: any) => schemaToASTNode(opt, context)),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Enum schemas
  if (type === "enum" && "enum" in schema) {
    const enumSchema = schema as any;
    return {
      kind: "schema" as const,
      type: "enum" as const,
      async,
      expects,
      enum: enumSchema.enum,
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Picklist schemas
  if (type === "picklist" && "options" in schema) {
    const picklistSchema = schema as any;
    return {
      kind: "schema" as const,
      type: "picklist" as const,
      async,
      expects,
      options: picklistSchema.options,
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Record schemas
  if (type === "record" && "key" in schema && "value" in schema) {
    const recordSchema = schema as any;
    return {
      kind: "schema" as const,
      type: "record" as const,
      async,
      expects,
      key: schemaToASTNode(recordSchema.key, context),
      value: schemaToASTNode(recordSchema.value, context),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Map schemas
  if (type === "map" && "key" in schema && "value" in schema) {
    const mapSchema = schema as any;
    return {
      kind: "schema" as const,
      type: "map" as const,
      async,
      expects,
      key: schemaToASTNode(mapSchema.key, context),
      value: schemaToASTNode(mapSchema.value, context),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Set schemas
  if (type === "set" && "value" in schema) {
    const setSchema = schema as any;
    return {
      kind: "schema" as const,
      type: "set" as const,
      async,
      expects,
      item: schemaToASTNode(setSchema.value, context),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Intersect schemas
  if (type === "intersect" && "options" in schema) {
    const intersectSchema = schema as any;
    return {
      kind: "schema" as const,
      type: "intersect" as const,
      async,
      expects,
      options: intersectSchema.options.map((opt: any) => schemaToASTNode(opt, context)),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Instance schemas
  if (type === "instance" && "class" in schema) {
    const instanceSchema = schema as any;
    const classRef = instanceSchema.class;
    let dictionaryKey: string | undefined;

    if (context.dictionary) {
      const key = findKeyByValue(context.dictionary, classRef);
      if (key) {
        dictionaryKey = key;
        trackDictionaryRef(key, context);
      }
    }

    return {
      kind: "schema" as const,
      type: "instance" as const,
      async,
      expects,
      class: classRef.name || "UnknownClass",
      ...(dictionaryKey ? { dictionaryKey } : {}),
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Function schemas
  if (type === "function") {
    return {
      kind: "schema" as const,
      type: "function" as const,
      async,
      expects,
      ...(pipe ? { pipe } : {}),
      ...(info ? { info } : {}),
    };
  }

  // Primitive schemas (string, number, boolean, bigint, date, etc.)
  return {
    kind: "schema" as const,
    type: type as any,
    async,
    expects,
    ...(pipe ? { pipe } : {}),
    ...(info ? { info } : {}),
  };
}

function extractSchemaInfo(schema: GenericSchema | GenericSchemaAsync): SchemaInfoAST | undefined {
  const title = getTitle(schema);
  const description = getDescription(schema);
  const examples = getExamples(schema);
  const metadata = getMetadata(schema);

  const hasExamples = examples && examples.length > 0;
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  if (!title && !description && !hasExamples && !hasMetadata) {
    return undefined;
  }

  const info: SchemaInfoAST = {};
  if (title) info.title = title;
  if (description) info.description = description;
  if (hasExamples) info.examples = examples;
  if (hasMetadata) info.metadata = metadata;

  return info;
}

function extractPipe(
  schema: GenericSchema | GenericSchemaAsync,
  context: SerializationContext
): ASTNode[] | undefined {
  if (!("pipe" in schema) || !Array.isArray(schema.pipe)) {
    return undefined;
  }

  const pipeItems: ASTNode[] = [];

  // Skip index 0 (root schema) and metadata actions (lifted to info)
  for (let i = 1; i < schema.pipe.length; i++) {
    const item = schema.pipe[i] as any;

    if (item.kind === "metadata") {
      // Metadata actions are lifted to the info property
      continue;
    }

    if (item.kind === "schema") {
      // Schema in pipe (e.g., custom() used as validation)
      if (item.type === "custom") {
        // custom() schemas in pipe act as validations
        let dictionaryKey: string | undefined;
        if (context.dictionary && item.reference) {
          const key = findKeyByValue(context.dictionary, item.reference);
          if (key) {
            dictionaryKey = key;
            trackDictionaryRef(key, context);
          }
        }
        pipeItems.push({
          kind: "validation" as const,
          type: "custom",
          ...(item.message ? { message: String(item.message) } : {}),
          ...(dictionaryKey ? { dictionaryKey } : {}),
        });
      } else {
        pipeItems.push(schemaToASTNode(item, context));
      }
      continue;
    }

    if (item.kind === "validation") {
      let dictionaryKey: string | undefined;
      const requirement = serializeRequirement(item.requirement);

      if (item.type === "custom" || item.type === "check") {
        if (context.dictionary && typeof item.requirement === "function") {
          const key = findKeyByValue(context.dictionary, item.requirement);
          if (key) {
            dictionaryKey = key;
            trackDictionaryRef(key, context);
          }
        }
      }

      pipeItems.push({
        kind: "validation" as const,
        type: item.type,
        ...(item.locales !== undefined ? { locales: item.locales } : {}),
        ...(requirement !== undefined ? { requirement } : {}),
        ...(item.message ? { message: String(item.message) } : {}),
        ...(dictionaryKey ? { dictionaryKey } : {}),
      });
      continue;
    }

    if (item.kind === "transformation") {
      let dictionaryKey: string | undefined;
      let note: string | undefined;

      if (item.type === "transform" || item.type === "custom") {
        if (context.dictionary && typeof item.operation === "function") {
          const key = findKeyByValue(context.dictionary, item.operation);
          if (key) {
            dictionaryKey = key;
            trackDictionaryRef(key, context);
          }
        }
        if (!dictionaryKey) {
          note = "custom-transformation-may-not-be-serializable";
        }
      }

      pipeItems.push({
        kind: "transformation" as const,
        type: item.type,
        ...(item.operation !== undefined && typeof item.operation !== "function"
          ? { requirement: item.operation }
          : {}),
        ...(item.message ? { message: String(item.message) } : {}),
        ...(note ? { note } : {}),
        ...(dictionaryKey ? { dictionaryKey } : {}),
      });
      continue;
    }
  }

  return pipeItems.length > 0 ? pipeItems : undefined;
}

function serializeRequirement(requirement: unknown): unknown {
  if (requirement === undefined || requirement === null) return undefined;
  if (typeof requirement === "function") return undefined;

  // Handle RegExp serialization
  if (requirement instanceof RegExp) {
    return { source: requirement.source, flags: requirement.flags };
  }

  return requirement;
}
