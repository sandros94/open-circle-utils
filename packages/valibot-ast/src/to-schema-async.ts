/**
 * Convert AST representation back to Valibot schemas (async support).
 */

import * as v from "valibot";
import type { GenericSchema, GenericSchemaAsync } from "valibot";
import type { ASTNode, ASTDocument } from "./types.ts";
import type { ASTDocumentSchema } from "./schema.ts";

/**
 * Options for AST to schema async conversion.
 */
export interface ASTToSchemaAsyncOptions {
  /**
   * Custom transformation implementations (can be async).
   * Maps custom transformation keys to their implementations.
   */
  transformationDictionary?: Map<string, (input: any) => any | Promise<any>>;

  /**
   * Custom validation implementations (can be async).
   * Maps custom validation keys to their implementations.
   */
  validationDictionary?: Map<string, (input: any) => boolean | Promise<boolean>>;

  /**
   * Instance class implementations.
   * Maps custom instance keys to their class constructors.
   */
  instanceDictionary?: Map<string, new (...args: any[]) => any>;

  /**
   * Lazy schema getter implementations (can be async).
   * Maps custom lazy schema keys to their getter functions.
   */
  lazyDictionary?: Map<string, () => v.GenericSchema | v.GenericSchemaAsync>;

  /**
   * Closure implementations (can be async).
   * Maps closure keys to their implementations with captured context.
   */
  closureDictionary?: Map<string, (input: any) => any | Promise<any>>;

  /**
   * Whether to throw an error if the AST library doesn't match 'valibot'.
   * Defaults to true.
   */
  strictLibraryCheck?: boolean;

  /**
   * Whether to validate the AST document structure before conversion.
   * When a schema is provided, it will be used for validating the AST.
   */
  validateAST?: typeof ASTDocumentSchema | v.GenericSchema;
}

/**
 * Convert an AST document back to a Valibot schema (with async support).
 *
 * @param astDocument The AST document to convert.
 * @param options Optional conversion options.
 *
 * @returns The reconstructed Valibot schema (may be async).
 */
export function astToSchemaAsync(
  astDocument: ASTDocument,
  options?: ASTToSchemaAsyncOptions
): GenericSchema | GenericSchemaAsync {
  // Validate AST structure if requested
  if (options?.validateAST) {
    const result = v.safeParse(options.validateAST, astDocument);
    if (!result.success) {
      throw new Error(
        `Invalid AST document structure: ${v.flatten(result.issues).nested ? JSON.stringify(v.flatten(result.issues).nested) : "validation failed"}`
      );
    }
  }

  // Validate library compatibility
  if (options?.strictLibraryCheck !== false && astDocument.library !== "valibot") {
    throw new Error(
      `AST document was created for library '${astDocument.library}', but attempting to convert to Valibot schema. Set strictLibraryCheck to false to bypass this check.`
    );
  }

  // Check for missing custom dictionaries
  if (astDocument.customTransformations && !options?.transformationDictionary) {
    const keys = Object.keys(astDocument.customTransformations).join(", ");
    throw new Error(
      `AST document contains custom transformations (${keys}) but no transformation dictionary was provided. Provide a transformationDictionary in options to reconstruct this schema.`
    );
  }

  if (astDocument.customValidations && !options?.validationDictionary) {
    const keys = Object.keys(astDocument.customValidations).join(", ");
    throw new Error(
      `AST document contains custom validations (${keys}) but no validation dictionary was provided. Provide a validationDictionary in options to reconstruct this schema.`
    );
  }

  if (astDocument.customInstances && !options?.instanceDictionary) {
    const keys = Object.keys(astDocument.customInstances).join(", ");
    throw new Error(
      `AST document contains custom instances (${keys}) but no instance dictionary was provided. Provide an instanceDictionary in options to reconstruct this schema.`
    );
  }

  if (astDocument.customLazy && !options?.lazyDictionary) {
    const keys = Object.keys(astDocument.customLazy).join(", ");
    throw new Error(
      `AST document contains custom lazy schemas (${keys}) but no lazy dictionary was provided. Provide a lazyDictionary in options to reconstruct this schema.`
    );
  }

  if (astDocument.customClosures && !options?.closureDictionary) {
    const keys = Object.keys(astDocument.customClosures).join(", ");
    throw new Error(
      `AST document contains custom closures (${keys}) but no closure dictionary was provided. Provide a closureDictionary in options to reconstruct this schema.`
    );
  }

  return astNodeToSchemaAsync(astDocument.schema, options);
}

/**
 * Convert an AST node back to a Valibot schema (internal, with async support).
 *
 * @param ast The AST node to convert.
 * @param options Optional conversion options.
 *
 * @returns The reconstructed Valibot schema (may be async).
 */
function astNodeToSchemaAsync(
  ast: ASTNode,
  options?: ASTToSchemaAsyncOptions
): GenericSchema | GenericSchemaAsync {
  if (ast.kind === "validation" || ast.kind === "transformation" || ast.kind === "metadata") {
    throw new Error(
      "Cannot convert standalone validation/transformation/metadata to schema. These must be part of a pipe."
    );
  }

  let schema = buildBaseSchemaAsync(ast, options);

  // Apply pipe if present
  if ("pipe" in ast && ast.pipe && ast.pipe.length > 0) {
    const pipeItems = ast.pipe.map((item) => {
      if (item.kind === "schema") {
        return astNodeToSchemaAsync(item, options);
      }
      return buildPipeItemAsync(item, options);
    });

    schema = v.pipeAsync(schema, ...pipeItems);
  }

  // Apply metadata if present
  if ("info" in ast && ast.info) {
    if (ast.info.title) {
      schema = v.pipeAsync(schema, v.title(ast.info.title));
    }
    if (ast.info.description) {
      schema = v.pipeAsync(schema, v.description(ast.info.description));
    }
    if (ast.info.examples && ast.info.examples.length > 0) {
      schema = v.pipeAsync(schema, v.examples(ast.info.examples));
    }
    if (ast.info.metadata) {
      schema = v.pipeAsync(schema, v.metadata(ast.info.metadata));
    }
  }

  return schema;
}

/**
 * Build the base schema without pipe or metadata (with async support).
 */
function buildBaseSchemaAsync(
  ast: ASTNode,
  options?: ASTToSchemaAsyncOptions
): GenericSchema | GenericSchemaAsync {
  // Handle wrapped schemas
  if ("wrapped" in ast && ast.wrapped) {
    const innerSchema = astNodeToSchemaAsync(ast.wrapped, options);

    switch (ast.type) {
      case "optional": {
        return ast.default === undefined
          ? v.optionalAsync(innerSchema)
          : v.optionalAsync(innerSchema, ast.default);
      }
      case "nullable": {
        return ast.default === undefined
          ? v.nullableAsync(innerSchema)
          : v.nullableAsync(innerSchema, ast.default);
      }
      case "nullish": {
        return ast.default === undefined
          ? v.nullishAsync(innerSchema)
          : v.nullishAsync(innerSchema, ast.default);
      }
      case "non_optional": {
        return v.nonOptionalAsync(innerSchema);
      }
      case "non_nullable": {
        return v.nonNullableAsync(innerSchema);
      }
      case "non_nullish": {
        return v.nonNullishAsync(innerSchema);
      }
      case "exact_optional": {
        return ast.default === undefined
          ? v.exactOptionalAsync(innerSchema)
          : v.exactOptionalAsync(innerSchema, ast.default);
      }
      case "undefinedable": {
        return ast.default === undefined
          ? v.undefinedableAsync(innerSchema)
          : v.undefinedableAsync(innerSchema, ast.default);
      }
      default: {
        return innerSchema;
      }
    }
  }

  // Handle literal
  if (ast.type === "literal" && "literal" in ast) {
    return v.literal(ast.literal);
  }

  // Handle object
  if (ast.type === "object" && "entries" in ast) {
    const entries: Record<string, any> = {};
    for (const [key, value] of Object.entries(ast.entries)) {
      entries[key] = astNodeToSchemaAsync(value, options);
    }
    return v.objectAsync(entries);
  }

  if (ast.type === "loose_object" && "entries" in ast) {
    const entries: Record<string, any> = {};
    for (const [key, value] of Object.entries(ast.entries)) {
      entries[key] = astNodeToSchemaAsync(value, options);
    }
    return v.looseObjectAsync(entries);
  }

  if (ast.type === "strict_object" && "entries" in ast) {
    const entries: Record<string, any> = {};
    for (const [key, value] of Object.entries(ast.entries)) {
      entries[key] = astNodeToSchemaAsync(value, options);
    }
    return v.strictObjectAsync(entries);
  }

  if (ast.type === "object_with_rest" && "entries" in ast && "rest" in ast && ast.rest) {
    const entries: Record<string, any> = {};
    for (const [key, value] of Object.entries(ast.entries)) {
      entries[key] = astNodeToSchemaAsync(value, options);
    }
    return v.objectWithRestAsync(entries, astNodeToSchemaAsync(ast.rest, options));
  }

  // Handle array
  if (ast.type === "array" && "item" in ast) {
    return v.arrayAsync(astNodeToSchemaAsync(ast.item, options));
  }

  // Handle tuple
  if (
    (ast.type === "tuple" || ast.type === "loose_tuple" || ast.type === "strict_tuple") &&
    "items" in ast
  ) {
    const items = ast.items.map((item) => astNodeToSchemaAsync(item, options));

    if (ast.type === "loose_tuple") {
      return v.looseTupleAsync(items);
    }
    if (ast.type === "strict_tuple") {
      return v.strictTupleAsync(items);
    }
    return v.tupleAsync(items);
  }

  if (ast.type === "tuple_with_rest" && "items" in ast && "rest" in ast && ast.rest) {
    const items = ast.items.map((item) => astNodeToSchemaAsync(item, options));
    return v.tupleWithRestAsync(items, astNodeToSchemaAsync(ast.rest, options));
  }

  // Handle union
  if (ast.type === "union" && "options" in ast) {
    const unionOptions = ast.options.map((opt) => astNodeToSchemaAsync(opt, options));
    return v.unionAsync(unionOptions);
  }

  // Handle variant
  if (ast.type === "variant" && "options" in ast && "key" in ast) {
    const variantOptions = ast.options.map((opt) => astNodeToSchemaAsync(opt, options));
    return v.variantAsync(ast.key, variantOptions as any);
  }

  // Handle enum
  if (ast.type === "enum" && "enum" in ast) {
    return v.enum(ast.enum);
  }

  // Handle picklist
  if (ast.type === "picklist" && "options" in ast) {
    const picklistValues = ast.options.filter(
      (opt): opt is string | number | bigint =>
        typeof opt === "string" || typeof opt === "number" || typeof opt === "bigint"
    );
    return v.picklist(picklistValues);
  }

  // Handle record
  if (ast.type === "record" && "key" in ast && "value" in ast) {
    return v.recordAsync(
      astNodeToSchemaAsync(ast.key, options) as any,
      astNodeToSchemaAsync(ast.value, options)
    );
  }

  // Handle map
  if (ast.type === "map" && "key" in ast && "value" in ast) {
    return v.mapAsync(
      astNodeToSchemaAsync(ast.key, options),
      astNodeToSchemaAsync(ast.value, options)
    );
  }

  // Handle set
  if (ast.type === "set" && "item" in ast) {
    return v.setAsync(astNodeToSchemaAsync(ast.item, options));
  }

  // Handle intersect
  if (ast.type === "intersect" && "options" in ast) {
    const intersectOptions = ast.options.map((opt) => astNodeToSchemaAsync(opt, options));
    return v.intersectAsync(intersectOptions);
  }

  // Handle instance
  if (ast.type === "instance" && "class" in ast) {
    // Check if there's a custom key and instance dictionary
    if ("customKey" in ast && ast.customKey && options?.instanceDictionary) {
      const classConstructor = options.instanceDictionary.get(ast.customKey);
      if (classConstructor) {
        return v.instance(classConstructor);
      }
      throw new Error(
        `Instance schema references key "${ast.customKey}" but it was not found in the instance dictionary.`
      );
    }

    throw new Error(
      `Cannot reconstruct instance schema for class "${ast.class}". Instance schemas require runtime class references. Provide an instanceDictionary in options to reconstruct this schema.`
    );
  }

  // Handle lazy
  if (ast.type === "lazy") {
    // Check if this lazy schema has a custom key
    if ("customKey" in ast && ast.customKey) {
      const lazyGetter = options?.lazyDictionary?.get(ast.customKey);
      if (!lazyGetter) {
        throw new Error(
          `Custom lazy schema '${ast.customKey}' referenced but not found in lazy dictionary. Provide the getter implementation in options.lazyDictionary.`
        );
      }
      return v.lazyAsync(lazyGetter);
    }

    throw new Error(
      "Cannot reconstruct lazyAsync schema from AST without customKey. Lazy schemas require runtime getter functions. Provide a lazyDictionary in options to reconstruct this schema."
    );
  }

  // Handle function
  if (ast.type === "function") {
    return v.function();
  }

  // Handle primitives
  switch (ast.type) {
    case "string": {
      return v.string();
    }
    case "number": {
      return v.number();
    }
    case "boolean": {
      return v.boolean();
    }
    case "bigint": {
      return v.bigint();
    }
    case "date": {
      return v.date();
    }
    case "blob": {
      return v.blob();
    }
    case "symbol": {
      return v.symbol();
    }
    case "any": {
      return v.any();
    }
    case "unknown": {
      return v.unknown();
    }
    case "never": {
      return v.never();
    }
    case "nan": {
      return v.nan();
    }
    case "null": {
      return v.null_();
    }
    case "undefined": {
      return v.undefined_();
    }
    case "void": {
      return v.void_();
    }
    case "file": {
      return v.file();
    }
    case "promise": {
      return v.promise();
    }
    default: {
      throw new Error(`Unknown schema type: ${ast.type}`);
    }
  }
}

/**
 * Build a pipe item (validation, transformation, or metadata) with async support.
 */
function buildPipeItemAsync(ast: ASTNode, options?: ASTToSchemaAsyncOptions): any {
  if (ast.kind === "validation") {
    return buildValidationAsync(ast, options);
  }

  if (ast.kind === "transformation") {
    return buildTransformationAsync(ast, options);
  }

  if (ast.kind === "metadata") {
    // Metadata items are already handled at schema level
    return undefined;
  }

  throw new Error(`Unknown pipe item kind: ${ast.kind}`);
}

/**
 * Build a validation action from AST (with async support).
 */
function buildValidationAsync(
  ast: ASTNode & { kind: "validation" },
  options?: ASTToSchemaAsyncOptions
): any {
  const { type, locales, requirement, message } = ast;

  // Check for custom validation
  if ("customKey" in ast && ast.customKey) {
    // Try validation dictionary first
    let customImpl = options?.validationDictionary?.get(ast.customKey);

    // Fallback to closure dictionary
    if (!customImpl && options?.closureDictionary) {
      customImpl = options.closureDictionary.get(ast.customKey);
    }

    if (!customImpl) {
      throw new Error(
        `Custom validation '${ast.customKey}' referenced but not found in validation or closure dictionary. Provide the implementation in options.validationDictionary or options.closureDictionary.`
      );
    }
    // Use checkAsync to support both sync and async validations
    return v.checkAsync(customImpl, message);
  }

  // Handle 'custom' and 'check' types
  if (type === "custom" || type === "check") {
    throw new Error(
      `Custom validation found but no customKey provided. This validation requires a custom implementation via the validation dictionary.`
    );
  }

  // Length validations
  if (type === "min_length") return v.minLength(requirement, message);
  if (type === "max_length") return v.maxLength(requirement, message);
  if (type === "length") return v.length(requirement, message);

  // Value validations
  if (type === "min_value") return v.minValue(requirement, message);
  if (type === "max_value") return v.maxValue(requirement, message);
  if (type === "value") return v.value(requirement, message);

  // Size validations
  if (type === "min_size") return v.minSize(requirement, message);
  if (type === "max_size") return v.maxSize(requirement, message);
  if (type === "size") return v.size(requirement, message);

  // Bytes validations
  if (type === "min_bytes") return v.minBytes(requirement, message);
  if (type === "max_bytes") return v.maxBytes(requirement, message);
  if (type === "bytes") return v.bytes(requirement, message);

  // Graphemes validations
  if (type === "min_graphemes") return v.minGraphemes(requirement, message);
  if (type === "max_graphemes") return v.maxGraphemes(requirement, message);
  if (type === "graphemes") return v.graphemes(requirement, message);

  // Words validations
  if (type === "min_words") return v.minWords(locales, requirement, message);
  if (type === "max_words") return v.maxWords(locales, requirement, message);
  if (type === "words") return v.words(locales, requirement, message);

  // Entries validations
  if (type === "min_entries") return v.minEntries(requirement, message);
  if (type === "max_entries") return v.maxEntries(requirement, message);
  if (type === "entries") return v.entries(requirement, message);

  // String validations
  if (type === "email") return v.email(message);
  if (type === "emoji") return v.emoji(message);
  if (type === "url") return v.url(message);
  if (type === "uuid") return v.uuid(message);
  if (type === "ulid") return v.ulid(message);
  if (type === "cuid2") return v.cuid2(message);
  if (type === "nanoid") return v.nanoid(message);
  if (type === "ip") return v.ip(message);
  if (type === "ipv4") return v.ipv4(message);
  if (type === "ipv6") return v.ipv6(message);
  if (type === "mac") return v.mac(message);
  if (type === "mac48") return v.mac48(message);
  if (type === "mac64") return v.mac64(message);
  if (type === "imei") return v.imei(message);
  if (type === "iso_date") return v.isoDate(message);
  if (type === "iso_date_time") return v.isoDateTime(message);
  if (type === "iso_time") return v.isoTime(message);
  if (type === "iso_time_second") return v.isoTimeSecond(message);
  if (type === "iso_timestamp") return v.isoTimestamp(message);
  if (type === "iso_week") return v.isoWeek(message);

  // Pattern validations
  if (type === "regex") return v.regex(requirement, message);
  if (type === "includes") return v.includes(requirement, message);
  if (type === "excludes") return v.excludes(requirement, message);
  if (type === "starts_with") return v.startsWith(requirement, message);
  if (type === "ends_with") return v.endsWith(requirement, message);

  // Number validations
  if (type === "integer") return v.integer(message);
  if (type === "safe_integer") return v.safeInteger(message);
  if (type === "finite") return v.finite(message);
  if (type === "multiple_of") return v.multipleOf(requirement, message);

  // Other validations
  if (type === "non_empty") return v.nonEmpty(message);
  if (type === "hash") return v.hash(requirement, message);
  if (type === "mime_type") return v.mimeType(requirement, message);

  // Format validations
  if (type === "bic") return v.bic(message);
  if (type === "credit_card") return v.creditCard(message);
  if (type === "decimal") return v.decimal(message);
  if (type === "digits") return v.digits(message);
  if (type === "hex_color") return v.hexColor(message);
  if (type === "hexadecimal") return v.hexadecimal(message);
  if (type === "octal") return v.octal(message);
  if (type === "rfc_email") return v.rfcEmail(message);
  if (type === "slug") return v.slug(message);

  // Content validations
  if (type === "empty") return v.empty(message);
  if (type === "not_bytes") return v.notBytes(requirement, message);
  if (type === "not_entries") return v.notEntries(requirement, message);
  if (type === "not_graphemes") return v.notGraphemes(requirement, message);
  if (type === "not_length") return v.notLength(requirement, message);
  if (type === "not_size") return v.notSize(requirement, message);
  if (type === "not_value") return v.notValue(requirement, message);
  if (type === "not_words") return v.notWords(locales, requirement, message);

  // Comparison validations
  if (type === "gt_value") return v.gtValue(requirement, message);
  if (type === "lt_value") return v.ltValue(requirement, message);

  throw new Error(`Unknown validation type: ${type}. Cannot reconstruct this validation.`);
}

/**
 * Build a transformation action from AST (with async support).
 */
function buildTransformationAsync(
  ast: ASTNode & { kind: "transformation" },
  options?: ASTToSchemaAsyncOptions
): any {
  const { type, message } = ast;

  // Check for custom transformation
  if ("customKey" in ast && ast.customKey) {
    // Try transformation dictionary first
    let customImpl = options?.transformationDictionary?.get(ast.customKey);

    // Fallback to closure dictionary
    if (!customImpl && options?.closureDictionary) {
      customImpl = options.closureDictionary.get(ast.customKey);
    }

    if (!customImpl) {
      throw new Error(
        `Custom transformation '${ast.customKey}' referenced but not found in transformation or closure dictionary. Provide the implementation in options.transformationDictionary or options.closureDictionary.`
      );
    }
    // Use transformAsync to support both sync and async transformations
    return v.transformAsync(customImpl);
  }

  // Handle 'transform' type
  if (type === "transform") {
    throw new Error(
      `Custom transformation found but no customKey provided. This transformation requires a custom implementation via the transformation dictionary.`
    );
  }

  // String transformations
  if (type === "to_lower_case") return v.toLowerCase();
  if (type === "to_upper_case") return v.toUpperCase();
  if (type === "trim") return v.trim();
  if (type === "trim_start") return v.trimStart();
  if (type === "trim_end") return v.trimEnd();

  // Type conversions
  if (type === "to_string") return v.toString(message);
  if (type === "to_number") return v.toNumber(message);
  if (type === "to_bigint") return v.toBigint(message);
  if (type === "to_boolean") return v.toBoolean();
  if (type === "to_date") return v.toDate(message);

  // Value transformations
  if (type === "to_min_value" && "requirement" in ast) return v.toMinValue(ast.requirement);
  if (type === "to_max_value" && "requirement" in ast) return v.toMaxValue(ast.requirement);

  throw new Error(
    `Unknown or non-reconstructable transformation type: ${type}. Cannot reconstruct this transformation.`
  );
}
