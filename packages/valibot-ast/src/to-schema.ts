import * as v from "valibot";
import type { GenericSchema, GenericSchemaAsync } from "valibot";
import type { ASTNode, ASTDocument, SerializedBigInt } from "./types/index.ts";
import type { DictionaryMap } from "./dictionary.ts";
import { ASTDocumentSchema } from "./schema.ts";

export interface ASTToSchemaOptions {
  dictionary?: DictionaryMap;
  strictLibraryCheck?: boolean;
  validateAST?: boolean;
}

/**
 * Convert an AST document back to a Valibot schema (async-aware).
 * Returns `GenericSchema | GenericSchemaAsync` to support async schemas.
 */
// @__NO_SIDE_EFFECTS__
export function astToSchema<
  T extends GenericSchema | GenericSchemaAsync = GenericSchema | GenericSchemaAsync,
>(astDocument: ASTDocument, options?: ASTToSchemaOptions): T {
  // Validate AST structure if requested
  if (options?.validateAST) {
    const result = v.safeParse(ASTDocumentSchema, astDocument);
    if (!result.success) {
      throw new Error(
        `Invalid AST document structure: ${v.flatten(result.issues).nested ? JSON.stringify(v.flatten(result.issues).nested) : "validation failed"}`
      );
    }
  }

  if (options?.strictLibraryCheck !== false && astDocument.library !== "valibot") {
    throw new Error(
      `AST document was created for library '${astDocument.library}', but attempting to convert to Valibot schema. Set strictLibraryCheck to false to bypass this check.`
    );
  }

  // Check for missing dictionary entries
  if (astDocument.dictionary) {
    const requiredKeys = Object.keys(astDocument.dictionary);
    if (requiredKeys.length > 0 && !options?.dictionary) {
      throw new Error(
        `AST document references dictionary keys (${requiredKeys.join(", ")}) but no dictionary was provided.`
      );
    }
    if (options?.dictionary) {
      const missingKeys = requiredKeys.filter((k) => !options.dictionary!.has(k));
      if (missingKeys.length > 0) {
        throw new Error(
          `AST document references dictionary keys not found in provided dictionary: ${missingKeys.join(", ")}`
        );
      }
    }
  }

  return astNodeToSchema(astDocument.schema, options) as T;
}

function astNodeToSchema(
  ast: ASTNode,
  options?: ASTToSchemaOptions
): GenericSchema | GenericSchemaAsync {
  if (ast.kind === "validation" || ast.kind === "transformation" || ast.kind === "metadata") {
    throw new Error(
      "Cannot convert standalone validation/transformation/metadata to schema. These must be part of a pipe."
    );
  }

  const isAsync = ast.async === true;
  const schema: GenericSchema | GenericSchemaAsync = buildBaseSchema(ast, options);

  // Collect all pipe items (validations, transformations, nested schemas)
  // and info metadata actions into a single flat array so we produce one
  // pipe() call instead of nesting pipe(pipe(schema, ...items), ...metadata).
  const allPipeItems: any[] = [];

  if ("pipe" in ast && ast.pipe && ast.pipe.length > 0) {
    for (const item of ast.pipe) {
      if (item.kind === "schema") {
        allPipeItems.push(astNodeToSchema(item, options));
      } else {
        allPipeItems.push(buildPipeItem(item, options, isAsync));
      }
    }
  }

  if ("info" in ast && ast.info) {
    if (ast.info.title) allPipeItems.push(v.title(ast.info.title));
    if (ast.info.description) allPipeItems.push(v.description(ast.info.description));
    if (ast.info.examples && ast.info.examples.length > 0)
      allPipeItems.push(v.examples(ast.info.examples));
    if (ast.info.metadata) allPipeItems.push(v.metadata(ast.info.metadata));
  }

  if (allPipeItems.length > 0) {
    return isAsync
      ? v.pipeAsync(schema as GenericSchemaAsync, ...allPipeItems)
      : v.pipe(schema as GenericSchema, ...allPipeItems);
  }

  return schema;
}

function buildBaseSchema(
  ast: ASTNode,
  options?: ASTToSchemaOptions
): GenericSchema | GenericSchemaAsync {
  const isAsync = ast.async === true;

  // Wrapped schemas
  if ("wrapped" in ast && ast.wrapped) {
    const innerSchema = astNodeToSchema(ast.wrapped, options);

    switch (ast.type) {
      case "optional":
        return ast.default === undefined
          ? isAsync
            ? v.optionalAsync(innerSchema as v.GenericSchemaAsync)
            : v.optional(innerSchema as v.GenericSchema)
          : isAsync
            ? v.optionalAsync(innerSchema as v.GenericSchemaAsync, ast.default)
            : v.optional(innerSchema as v.GenericSchema, ast.default);
      case "nullable":
        return ast.default === undefined
          ? isAsync
            ? v.nullableAsync(innerSchema as v.GenericSchemaAsync)
            : v.nullable(innerSchema as v.GenericSchema)
          : isAsync
            ? v.nullableAsync(innerSchema as v.GenericSchemaAsync, ast.default)
            : v.nullable(innerSchema as v.GenericSchema, ast.default);
      case "nullish":
        return ast.default === undefined
          ? isAsync
            ? v.nullishAsync(innerSchema as v.GenericSchemaAsync)
            : v.nullish(innerSchema as v.GenericSchema)
          : isAsync
            ? v.nullishAsync(innerSchema as v.GenericSchemaAsync, ast.default)
            : v.nullish(innerSchema as v.GenericSchema, ast.default);
      case "non_optional":
        return isAsync
          ? v.nonOptionalAsync(innerSchema as v.GenericSchemaAsync)
          : v.nonOptional(innerSchema as v.GenericSchema);
      case "non_nullable":
        return isAsync
          ? v.nonNullableAsync(innerSchema as v.GenericSchemaAsync)
          : v.nonNullable(innerSchema as v.GenericSchema);
      case "non_nullish":
        return isAsync
          ? v.nonNullishAsync(innerSchema as v.GenericSchemaAsync)
          : v.nonNullish(innerSchema as v.GenericSchema);
      case "exact_optional":
        return ast.default === undefined
          ? isAsync
            ? v.exactOptionalAsync(innerSchema as v.GenericSchemaAsync)
            : v.exactOptional(innerSchema as v.GenericSchema)
          : isAsync
            ? v.exactOptionalAsync(innerSchema as v.GenericSchemaAsync, ast.default)
            : v.exactOptional(innerSchema as v.GenericSchema, ast.default);
      case "undefinedable":
        return ast.default === undefined
          ? isAsync
            ? v.undefinedableAsync(innerSchema as v.GenericSchemaAsync)
            : v.undefinedable(innerSchema as v.GenericSchema)
          : isAsync
            ? v.undefinedableAsync(innerSchema as v.GenericSchemaAsync, ast.default)
            : v.undefinedable(innerSchema as v.GenericSchema, ast.default);
    }
  }

  if (ast.type === "literal" && "literal" in ast) return v.literal(deserializeBigInt(ast.literal));

  if ("entries" in ast) {
    const entries: Record<string, any> = {};
    for (const [key, value] of Object.entries(ast.entries)) {
      entries[key] = astNodeToSchema(value, options);
    }
    switch (ast.type) {
      case "object":
        return isAsync ? v.objectAsync(entries) : v.object(entries);
      case "loose_object":
        return isAsync ? v.looseObjectAsync(entries) : v.looseObject(entries);
      case "strict_object":
        return isAsync ? v.strictObjectAsync(entries) : v.strictObject(entries);
      case "object_with_rest":
        if ("rest" in ast && ast.rest) {
          const rest = astNodeToSchema(ast.rest, options);
          return isAsync
            ? v.objectWithRestAsync(entries, rest as v.GenericSchemaAsync)
            : v.objectWithRest(entries, rest as v.GenericSchema);
        }
        throw new Error("object_with_rest requires a rest schema");
    }
  }

  if (ast.type === "array" && "item" in ast) {
    const item = astNodeToSchema(ast.item, options);
    return isAsync ? v.arrayAsync(item as v.GenericSchemaAsync) : v.array(item as v.GenericSchema);
  }

  if ("items" in ast) {
    const items = ast.items.map((item) => astNodeToSchema(item, options));
    switch (ast.type) {
      case "tuple":
        return isAsync
          ? v.tupleAsync(items as v.GenericSchemaAsync[])
          : v.tuple(items as v.GenericSchema[]);
      case "loose_tuple":
        return isAsync
          ? v.looseTupleAsync(items as v.GenericSchemaAsync[])
          : v.looseTuple(items as v.GenericSchema[]);
      case "strict_tuple":
        return isAsync
          ? v.strictTupleAsync(items as v.GenericSchemaAsync[])
          : v.strictTuple(items as v.GenericSchema[]);
      case "tuple_with_rest":
        if ("rest" in ast && ast.rest) {
          const rest = astNodeToSchema(ast.rest, options);
          return isAsync
            ? v.tupleWithRestAsync(items as v.GenericSchemaAsync[], rest as v.GenericSchemaAsync)
            : v.tupleWithRest(items as v.GenericSchema[], rest as v.GenericSchema);
        }
        throw new Error("tuple_with_rest requires a rest schema");
    }
  }

  if (ast.type === "union" && "options" in ast) {
    const unionOpts = ast.options.map((opt) => astNodeToSchema(opt, options));
    return isAsync
      ? v.unionAsync(unionOpts as v.GenericSchemaAsync[])
      : v.union(unionOpts as v.GenericSchema[]);
  }

  if (ast.type === "variant" && "options" in ast && "key" in ast) {
    const variantOpts = ast.options.map((opt) => astNodeToSchema(opt, options));
    return isAsync
      ? v.variantAsync(ast.key, variantOpts as v.VariantOptionsAsync<typeof ast.key>)
      : v.variant(ast.key, variantOpts as v.VariantOptions<typeof ast.key>);
  }

  if (ast.type === "enum" && "enum" in ast) return v.enum(ast.enum);

  if (ast.type === "picklist" && "options" in ast) {
    const picklistValues = ast.options.map(deserializeBigInt) as (string | number | bigint)[];
    return v.picklist(picklistValues);
  }

  if (ast.type === "record" && "key" in ast && "value" in ast) {
    const key = astNodeToSchema(ast.key, options);
    const value = astNodeToSchema(ast.value, options);
    return isAsync
      ? v.recordAsync(
          key as v.BaseSchemaAsync<string, string | number | symbol, v.BaseIssue<unknown>>,
          value as v.GenericSchemaAsync
        )
      : v.record(
          key as v.BaseSchema<string, string | number | symbol, v.BaseIssue<unknown>>,
          value as v.GenericSchema
        );
  }

  if (ast.type === "map" && "key" in ast && "value" in ast) {
    const key = astNodeToSchema(ast.key, options);
    const value = astNodeToSchema(ast.value, options);
    return isAsync
      ? v.mapAsync(key as v.GenericSchemaAsync, value as v.GenericSchemaAsync)
      : v.map(key as v.GenericSchema, value as v.GenericSchema);
  }

  if (ast.type === "set" && "item" in ast) {
    const item = astNodeToSchema(ast.item, options);
    return isAsync ? v.setAsync(item as v.GenericSchemaAsync) : v.set(item as v.GenericSchema);
  }

  if (ast.type === "intersect" && "options" in ast) {
    const intersectOpts = ast.options.map((opt) => astNodeToSchema(opt, options));
    return isAsync
      ? v.intersectAsync(intersectOpts as v.GenericSchemaAsync[])
      : v.intersect(intersectOpts as v.GenericSchema[]);
  }

  if (ast.type === "instance" && "class" in ast) {
    if ("dictionaryKey" in ast && ast.dictionaryKey && options?.dictionary) {
      const classConstructor = options.dictionary.get(ast.dictionaryKey) as v.Class | undefined;
      if (classConstructor) return v.instance(classConstructor);
      throw new Error(
        `Instance schema references key "${ast.dictionaryKey}" but it was not found in the dictionary.`
      );
    }
    throw new Error(
      `Cannot reconstruct instance schema for class "${ast.class}". Provide a dictionary with the class constructor.`
    );
  }

  if (ast.type === "lazy") {
    if ("dictionaryKey" in ast && ast.dictionaryKey) {
      const lazyGetter = options?.dictionary?.get(ast.dictionaryKey) as
        | (() => GenericSchema | GenericSchemaAsync)
        | undefined;
      if (!lazyGetter) {
        throw new Error(
          `Lazy schema references key '${ast.dictionaryKey}' but it was not found in the dictionary.`
        );
      }
      return isAsync
        ? v.lazyAsync(lazyGetter as () => GenericSchemaAsync)
        : v.lazy(lazyGetter as () => GenericSchema);
    }
    throw new Error(
      "Cannot reconstruct lazy schema without dictionaryKey. Provide a dictionary with the getter."
    );
  }

  if (ast.type === "custom") {
    if ("dictionaryKey" in ast && ast.dictionaryKey) {
      const checkFn = options?.dictionary?.get(ast.dictionaryKey) as
        | ((input: unknown) => boolean)
        | undefined;
      if (!checkFn) {
        throw new Error(
          `Custom schema references key '${ast.dictionaryKey}' but it was not found in the dictionary.`
        );
      }
      return v.custom(checkFn);
    }
    throw new Error(
      "Cannot reconstruct custom schema without dictionaryKey. Provide a dictionary with the check function."
    );
  }

  if (ast.type === "function") return v.function();

  // Primitives
  switch (ast.type) {
    case "string":
      return v.string();
    case "number":
      return v.number();
    case "boolean":
      return v.boolean();
    case "bigint":
      return v.bigint();
    case "date":
      return v.date();
    case "blob":
      return v.blob();
    case "symbol":
      return v.symbol();
    case "any":
      return v.any();
    case "unknown":
      return v.unknown();
    case "never":
      return v.never();
    case "nan":
      return v.nan();
    case "null":
      return v.null_();
    case "undefined":
      return v.undefined_();
    case "void":
      return v.void_();
    case "file":
      return v.file();
    case "promise":
      return v.promise();
    default:
      throw new Error(`Unknown schema type: ${ast.type}`);
  }
}

function buildPipeItem(ast: ASTNode, options?: ASTToSchemaOptions, isAsync?: boolean): any {
  if (ast.kind === "validation") return buildValidation(ast, options, isAsync);
  if (ast.kind === "transformation") return buildTransformation(ast, options, isAsync);
  throw new Error(`Unknown pipe item kind: ${ast.kind}`);
}

function buildValidation(
  ast: ASTNode & { kind: "validation" },
  options?: ASTToSchemaOptions,
  isAsync?: boolean
) {
  const { type, locales, requirement, message } = ast;

  // Custom validation via dictionary
  if ("dictionaryKey" in ast && ast.dictionaryKey) {
    const customImpl = options?.dictionary?.get(ast.dictionaryKey) as
      | ((input: unknown) => boolean | Promise<boolean>)
      | undefined;
    if (!customImpl) {
      throw new Error(`Custom validation '${ast.dictionaryKey}' not found in dictionary.`);
    }
    return isAsync
      ? v.checkAsync(customImpl as (input: unknown) => Promise<boolean>, message)
      : v.custom(customImpl as (input: unknown) => boolean, message);
  }

  if (type === "custom" || type === "check") {
    throw new Error(
      `Custom validation found but no dictionaryKey provided. Provide a dictionary with the implementation.`
    );
  }

  // Deserialize RegExp requirement
  const req = deserializeRequirement(requirement);

  // Length validations
  if (type === "min_length") return v.minLength(req, message);
  if (type === "max_length") return v.maxLength(req, message);
  if (type === "length") return v.length(req, message);

  // Value validations
  if (type === "min_value") return v.minValue(req, message);
  if (type === "max_value") return v.maxValue(req, message);
  if (type === "value") return v.value(req, message);

  // Size validations
  if (type === "min_size") return v.minSize(req, message);
  if (type === "max_size") return v.maxSize(req, message);
  if (type === "size") return v.size(req, message);

  // Bytes validations
  if (type === "min_bytes") return v.minBytes(req, message);
  if (type === "max_bytes") return v.maxBytes(req, message);
  if (type === "bytes") return v.bytes(req, message);

  // Graphemes validations
  if (type === "min_graphemes") return v.minGraphemes(req, message);
  if (type === "max_graphemes") return v.maxGraphemes(req, message);
  if (type === "graphemes") return v.graphemes(req, message);

  // Words validations
  if (type === "min_words") return v.minWords(locales, req, message);
  if (type === "max_words") return v.maxWords(locales, req, message);
  if (type === "words") return v.words(locales, req, message);

  // Entries validations
  if (type === "min_entries") return v.minEntries(req, message);
  if (type === "max_entries") return v.maxEntries(req, message);
  if (type === "entries") return v.entries(req, message);

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
  if (type === "regex") return v.regex(req, message);
  if (type === "includes") return v.includes(req, message);
  if (type === "excludes") return v.excludes(req, message);
  if (type === "starts_with") return v.startsWith(req, message);
  if (type === "ends_with") return v.endsWith(req, message);

  // Number validations
  if (type === "integer") return v.integer(message);
  if (type === "safe_integer") return v.safeInteger(message);
  if (type === "finite") return v.finite(message);
  if (type === "multiple_of") return v.multipleOf(req, message);

  // Other validations
  if (type === "non_empty") return v.nonEmpty(message);
  // hash stores a compiled RegExp as requirement; apply it directly as a regex validation
  if (type === "hash") return v.regex(req, message);
  if (type === "mime_type") return v.mimeType(req, message);

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
  if (type === "not_bytes") return v.notBytes(req, message);
  if (type === "not_entries") return v.notEntries(req, message);
  if (type === "not_graphemes") return v.notGraphemes(req, message);
  if (type === "not_length") return v.notLength(req, message);
  if (type === "not_size") return v.notSize(req, message);
  if (type === "not_value") return v.notValue(req, message);
  if (type === "not_words") return v.notWords(locales, req, message);

  // Comparison validations
  if (type === "gt_value") return v.gtValue(req, message);
  if (type === "lt_value") return v.ltValue(req, message);

  throw new Error(`Unknown validation type: ${type}`);
}

function buildTransformation(
  ast: ASTNode & { kind: "transformation" },
  options?: ASTToSchemaOptions,
  isAsync?: boolean
) {
  const { type } = ast;

  // Custom transformation via dictionary
  if ("dictionaryKey" in ast && ast.dictionaryKey) {
    const customImpl = options?.dictionary?.get(ast.dictionaryKey) as
      | ((input: unknown) => unknown)
      | undefined;
    if (!customImpl) {
      throw new Error(`Custom transformation '${ast.dictionaryKey}' not found in dictionary.`);
    }
    return isAsync
      ? v.transformAsync(customImpl as (input: unknown) => Promise<unknown>)
      : v.transform(customImpl as (input: unknown) => unknown);
  }

  if (type === "transform") {
    throw new Error(
      `Custom transformation found but no dictionaryKey provided. Provide a dictionary with the implementation.`
    );
  }

  // String transformations
  if (type === "to_lower_case") return v.toLowerCase();
  if (type === "to_upper_case") return v.toUpperCase();
  if (type === "trim") return v.trim();
  if (type === "trim_start") return v.trimStart();
  if (type === "trim_end") return v.trimEnd();

  // Type conversions
  if (type === "to_string") return v.toString();
  if (type === "to_number") return v.toNumber();
  if (type === "to_bigint") return v.toBigint();
  if (type === "to_boolean") return v.toBoolean();
  if (type === "to_date") return v.toDate();

  // Value transformations
  if (type === "to_min_value" && "requirement" in ast)
    return v.toMinValue(ast.requirement as v.ValueInput);
  if (type === "to_max_value" && "requirement" in ast)
    return v.toMaxValue(ast.requirement as v.ValueInput);

  throw new Error(`Unknown transformation type: ${type}`);
}

function deserializeRequirement(requirement: unknown): any {
  // Reconstruct RegExp from serialized form
  if (
    requirement &&
    typeof requirement === "object" &&
    "source" in requirement &&
    "flags" in requirement
  ) {
    return new RegExp(
      (requirement as { source: string }).source,
      (requirement as { flags: string }).flags
    );
  }
  return requirement;
}

/**
 * Check if a value is a serialized bigint marker (`{ __type: "bigint", value: "..." }`).
 */
function isSerializedBigInt(value: unknown): value is SerializedBigInt {
  return (
    typeof value === "object" &&
    value !== null &&
    "__type" in value &&
    (value as SerializedBigInt).__type === "bigint" &&
    "value" in value &&
    typeof (value as SerializedBigInt).value === "string"
  );
}

/**
 * Deserialize a value that may be a serialized bigint marker back to a native `bigint`.
 * Non-marker values are returned as-is.
 */
function deserializeBigInt<T>(value: T): T extends SerializedBigInt ? bigint : T;
function deserializeBigInt(value: unknown): unknown {
  if (isSerializedBigInt(value)) {
    return BigInt(value.value);
  }
  return value;
}
