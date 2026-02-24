import * as v from "valibot";
import type { GenericSchema, GenericSchemaAsync } from "valibot";
import type { ASTNode, ASTDocument } from "./types/index.ts";
import type { DictionaryMap } from "./dictionary.ts";

export interface ASTToSchemaAsyncOptions {
  dictionary?: DictionaryMap;
  strictLibraryCheck?: boolean;
  validateAST?: boolean;
}

/**
 * Convert an AST document back to a Valibot schema (async-aware).
 * Returns `GenericSchema | GenericSchemaAsync` to support async schemas.
 */
export function astToSchemaAsync(
  astDocument: ASTDocument,
  options?: ASTToSchemaAsyncOptions
): GenericSchema | GenericSchemaAsync {
  if (options?.strictLibraryCheck !== false && astDocument.library !== "valibot") {
    throw new Error(
      `AST document was created for library '${astDocument.library}', but attempting to convert to Valibot schema. Set strictLibraryCheck to false to bypass this check.`
    );
  }

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

  return astNodeToSchemaAsync(astDocument.schema, options);
}

function astNodeToSchemaAsync(
  ast: ASTNode,
  options?: ASTToSchemaAsyncOptions
): GenericSchema | GenericSchemaAsync {
  if (ast.kind === "validation" || ast.kind === "transformation" || ast.kind === "metadata") {
    throw new Error(
      "Cannot convert standalone validation/transformation/metadata to schema. These must be part of a pipe."
    );
  }

  const isAsync = ast.async === true;
  let schema: GenericSchema | GenericSchemaAsync = buildBaseSchemaAsync(ast, options);

  if ("pipe" in ast && ast.pipe && ast.pipe.length > 0) {
    const pipeItems = ast.pipe.map((item) => {
      if (item.kind === "schema") {
        return astNodeToSchemaAsync(item, options);
      }
      return buildPipeItemAsync(item, options, isAsync);
    });
    schema = isAsync
      ? v.pipeAsync(schema, ...pipeItems)
      : v.pipe(schema as GenericSchema, ...pipeItems);
  }

  if ("info" in ast && ast.info) {
    const pipeArgs: any[] = [schema];
    if (ast.info.title) pipeArgs.push(v.title(ast.info.title));
    if (ast.info.description) pipeArgs.push(v.description(ast.info.description));
    if (ast.info.examples && ast.info.examples.length > 0)
      pipeArgs.push(v.examples(ast.info.examples));
    if (ast.info.metadata) pipeArgs.push(v.metadata(ast.info.metadata));
    if (pipeArgs.length > 1) {
      schema = isAsync
        ? v.pipeAsync(...(pipeArgs as [GenericSchemaAsync, ...any[]]))
        : v.pipe(...(pipeArgs as [GenericSchema, ...any[]]));
    }
  }

  return schema;
}

function buildBaseSchemaAsync(
  ast: ASTNode,
  options?: ASTToSchemaAsyncOptions
): GenericSchema | GenericSchemaAsync {
  const isAsync = ast.async === true;

  // Wrapped schemas
  if ("wrapped" in ast && ast.wrapped) {
    const innerSchema = astNodeToSchemaAsync(ast.wrapped, options);

    switch (ast.type) {
      case "optional":
        return ast.default === undefined
          ? isAsync
            ? v.optionalAsync(innerSchema as any)
            : v.optional(innerSchema as any)
          : isAsync
            ? v.optionalAsync(innerSchema as any, ast.default as any)
            : v.optional(innerSchema as any, ast.default as any);
      case "nullable":
        return ast.default === undefined
          ? isAsync
            ? v.nullableAsync(innerSchema as any)
            : v.nullable(innerSchema as any)
          : isAsync
            ? v.nullableAsync(innerSchema as any, ast.default as any)
            : v.nullable(innerSchema as any, ast.default as any);
      case "nullish":
        return ast.default === undefined
          ? isAsync
            ? v.nullishAsync(innerSchema as any)
            : v.nullish(innerSchema as any)
          : isAsync
            ? v.nullishAsync(innerSchema as any, ast.default as any)
            : v.nullish(innerSchema as any, ast.default as any);
      case "non_optional":
        return isAsync ? v.nonOptionalAsync(innerSchema as any) : v.nonOptional(innerSchema as any);
      case "non_nullable":
        return isAsync ? v.nonNullableAsync(innerSchema as any) : v.nonNullable(innerSchema as any);
      case "non_nullish":
        return isAsync ? v.nonNullishAsync(innerSchema as any) : v.nonNullish(innerSchema as any);
      case "exact_optional":
        return ast.default === undefined
          ? isAsync
            ? v.exactOptionalAsync(innerSchema as any)
            : v.exactOptional(innerSchema as any)
          : isAsync
            ? v.exactOptionalAsync(innerSchema as any, ast.default as any)
            : v.exactOptional(innerSchema as any, ast.default as any);
      case "undefinedable":
        return ast.default === undefined
          ? isAsync
            ? v.undefinedableAsync(innerSchema as any)
            : v.undefinedable(innerSchema as any)
          : isAsync
            ? v.undefinedableAsync(innerSchema as any, ast.default as any)
            : v.undefinedable(innerSchema as any, ast.default as any);
    }
  }

  if (ast.type === "literal" && "literal" in ast) return v.literal(ast.literal);

  if ("entries" in ast) {
    const entries: Record<string, any> = {};
    for (const [key, value] of Object.entries(ast.entries)) {
      entries[key] = astNodeToSchemaAsync(value, options);
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
          const rest = astNodeToSchemaAsync(ast.rest, options);
          return isAsync
            ? v.objectWithRestAsync(entries, rest as any)
            : v.objectWithRest(entries, rest as any);
        }
        throw new Error("object_with_rest requires a rest schema");
    }
  }

  if (ast.type === "array" && "item" in ast) {
    const item = astNodeToSchemaAsync(ast.item, options);
    return isAsync ? v.arrayAsync(item as any) : v.array(item as any);
  }

  if ("items" in ast) {
    const items = ast.items.map((item) => astNodeToSchemaAsync(item, options));
    switch (ast.type) {
      case "tuple":
        return isAsync ? v.tupleAsync(items as any) : v.tuple(items as any);
      case "loose_tuple":
        return isAsync ? v.looseTupleAsync(items as any) : v.looseTuple(items as any);
      case "strict_tuple":
        return isAsync ? v.strictTupleAsync(items as any) : v.strictTuple(items as any);
      case "tuple_with_rest":
        if ("rest" in ast && ast.rest) {
          const rest = astNodeToSchemaAsync(ast.rest, options);
          return isAsync
            ? v.tupleWithRestAsync(items as any, rest as any)
            : v.tupleWithRest(items as any, rest as any);
        }
        throw new Error("tuple_with_rest requires a rest schema");
    }
  }

  if (ast.type === "union" && "options" in ast) {
    const unionOpts = ast.options.map((opt) => astNodeToSchemaAsync(opt, options));
    return isAsync ? v.unionAsync(unionOpts as any) : v.union(unionOpts as any);
  }

  if (ast.type === "variant" && "options" in ast && "key" in ast) {
    const variantOpts = ast.options.map((opt) => astNodeToSchemaAsync(opt, options));
    return isAsync
      ? v.variantAsync(ast.key, variantOpts as any)
      : v.variant(ast.key, variantOpts as any);
  }

  if (ast.type === "enum" && "enum" in ast) return v.enum(ast.enum);

  if (ast.type === "picklist" && "options" in ast) {
    const picklistValues = ast.options.filter(
      (opt): opt is string | number | bigint =>
        typeof opt === "string" || typeof opt === "number" || typeof opt === "bigint"
    );
    return v.picklist(picklistValues);
  }

  if (ast.type === "record" && "key" in ast && "value" in ast) {
    const key = astNodeToSchemaAsync(ast.key, options);
    const value = astNodeToSchemaAsync(ast.value, options);
    return isAsync ? v.recordAsync(key as any, value as any) : v.record(key as any, value as any);
  }

  if (ast.type === "map" && "key" in ast && "value" in ast) {
    const key = astNodeToSchemaAsync(ast.key, options);
    const value = astNodeToSchemaAsync(ast.value, options);
    return isAsync ? v.mapAsync(key as any, value as any) : v.map(key as any, value as any);
  }

  if (ast.type === "set" && "item" in ast) {
    const item = astNodeToSchemaAsync(ast.item, options);
    return isAsync ? v.setAsync(item as any) : v.set(item as any);
  }

  if (ast.type === "intersect" && "options" in ast) {
    const intersectOpts = ast.options.map((opt) => astNodeToSchemaAsync(opt, options));
    return isAsync ? v.intersectAsync(intersectOpts as any) : v.intersect(intersectOpts as any);
  }

  if (ast.type === "instance" && "class" in ast) {
    if ("dictionaryKey" in ast && ast.dictionaryKey && options?.dictionary) {
      const classConstructor = options.dictionary.get(ast.dictionaryKey) as
        | (new (...args: any[]) => any)
        | undefined;
      if (classConstructor) return v.instance(classConstructor);
      throw new Error(`Instance key "${ast.dictionaryKey}" not found in dictionary.`);
    }
    throw new Error(`Cannot reconstruct instance schema for "${ast.class}" without dictionary.`);
  }

  if (ast.type === "lazy") {
    if ("dictionaryKey" in ast && ast.dictionaryKey) {
      const lazyGetter = options?.dictionary?.get(ast.dictionaryKey) as
        | (() => GenericSchema | GenericSchemaAsync)
        | undefined;
      if (!lazyGetter) {
        throw new Error(`Lazy key '${ast.dictionaryKey}' not found in dictionary.`);
      }
      return isAsync ? v.lazyAsync(lazyGetter as any) : v.lazy(lazyGetter as any);
    }
    throw new Error("Cannot reconstruct lazy schema without dictionaryKey.");
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

function buildPipeItemAsync(
  ast: ASTNode,
  options?: ASTToSchemaAsyncOptions,
  isAsync?: boolean
): any {
  if (ast.kind === "validation") return buildValidationAsync(ast, options, isAsync);
  if (ast.kind === "transformation") return buildTransformationAsync(ast, options, isAsync);
  throw new Error(`Unknown pipe item kind: ${ast.kind}`);
}

function buildValidationAsync(
  ast: ASTNode & { kind: "validation" },
  options?: ASTToSchemaAsyncOptions,
  isAsync?: boolean
): any {
  const { type, locales, requirement, message } = ast;

  if ("dictionaryKey" in ast && ast.dictionaryKey) {
    const customImpl = options?.dictionary?.get(ast.dictionaryKey) as
      | ((input: any) => boolean | Promise<boolean>)
      | undefined;
    if (!customImpl) {
      throw new Error(`Custom validation '${ast.dictionaryKey}' not found in dictionary.`);
    }
    return isAsync
      ? v.checkAsync(customImpl as any, message)
      : v.custom(customImpl as any, message);
  }

  if (type === "custom" || type === "check") {
    throw new Error(`Custom validation found but no dictionaryKey provided.`);
  }

  const req = deserializeRequirement(requirement);

  // Same validation mapping as sync version
  if (type === "min_length") return v.minLength(req, message);
  if (type === "max_length") return v.maxLength(req, message);
  if (type === "length") return v.length(req, message);
  if (type === "min_value") return v.minValue(req, message);
  if (type === "max_value") return v.maxValue(req, message);
  if (type === "value") return v.value(req, message);
  if (type === "min_size") return v.minSize(req, message);
  if (type === "max_size") return v.maxSize(req, message);
  if (type === "size") return v.size(req, message);
  if (type === "min_bytes") return v.minBytes(req, message);
  if (type === "max_bytes") return v.maxBytes(req, message);
  if (type === "bytes") return v.bytes(req, message);
  if (type === "min_graphemes") return v.minGraphemes(req, message);
  if (type === "max_graphemes") return v.maxGraphemes(req, message);
  if (type === "graphemes") return v.graphemes(req, message);
  if (type === "min_words") return v.minWords(locales, req, message);
  if (type === "max_words") return v.maxWords(locales, req, message);
  if (type === "words") return v.words(locales, req, message);
  if (type === "min_entries") return v.minEntries(req, message);
  if (type === "max_entries") return v.maxEntries(req, message);
  if (type === "entries") return v.entries(req, message);
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
  if (type === "regex") return v.regex(req, message);
  if (type === "includes") return v.includes(req, message);
  if (type === "excludes") return v.excludes(req, message);
  if (type === "starts_with") return v.startsWith(req, message);
  if (type === "ends_with") return v.endsWith(req, message);
  if (type === "integer") return v.integer(message);
  if (type === "safe_integer") return v.safeInteger(message);
  if (type === "finite") return v.finite(message);
  if (type === "multiple_of") return v.multipleOf(req, message);
  if (type === "non_empty") return v.nonEmpty(message);
  if (type === "hash") return v.hash(req, message);
  if (type === "mime_type") return v.mimeType(req, message);
  if (type === "bic") return v.bic(message);
  if (type === "credit_card") return v.creditCard(message);
  if (type === "decimal") return v.decimal(message);
  if (type === "digits") return v.digits(message);
  if (type === "hex_color") return v.hexColor(message);
  if (type === "hexadecimal") return v.hexadecimal(message);
  if (type === "octal") return v.octal(message);
  if (type === "rfc_email") return v.rfcEmail(message);
  if (type === "slug") return v.slug(message);
  if (type === "empty") return v.empty(message);
  if (type === "not_bytes") return v.notBytes(req, message);
  if (type === "not_entries") return v.notEntries(req, message);
  if (type === "not_graphemes") return v.notGraphemes(req, message);
  if (type === "not_length") return v.notLength(req, message);
  if (type === "not_size") return v.notSize(req, message);
  if (type === "not_value") return v.notValue(req, message);
  if (type === "not_words") return v.notWords(locales, req, message);
  if (type === "gt_value") return v.gtValue(req, message);
  if (type === "lt_value") return v.ltValue(req, message);

  throw new Error(`Unknown validation type: ${type}`);
}

function buildTransformationAsync(
  ast: ASTNode & { kind: "transformation" },
  options?: ASTToSchemaAsyncOptions,
  isAsync?: boolean
): any {
  const { type } = ast;

  if ("dictionaryKey" in ast && ast.dictionaryKey) {
    const customImpl = options?.dictionary?.get(ast.dictionaryKey) as
      | ((...args: any[]) => any)
      | undefined;
    if (!customImpl) {
      throw new Error(`Custom transformation '${ast.dictionaryKey}' not found in dictionary.`);
    }
    return isAsync ? v.transformAsync(customImpl as any) : v.transform(customImpl);
  }

  if (type === "transform") {
    throw new Error(`Custom transformation found but no dictionaryKey provided.`);
  }

  if (type === "to_lower_case") return v.toLowerCase();
  if (type === "to_upper_case") return v.toUpperCase();
  if (type === "trim") return v.trim();
  if (type === "trim_start") return v.trimStart();
  if (type === "trim_end") return v.trimEnd();
  if (type === "to_string") return v.toString();
  if (type === "to_number") return v.toNumber();
  if (type === "to_bigint") return v.toBigint();
  if (type === "to_boolean") return v.toBoolean();
  if (type === "to_date") return v.toDate();
  if (type === "to_min_value" && "requirement" in ast)
    return v.toMinValue(ast.requirement as v.ValueInput);
  if (type === "to_max_value" && "requirement" in ast)
    return v.toMaxValue(ast.requirement as v.ValueInput);

  throw new Error(`Unknown transformation type: ${type}`);
}

function deserializeRequirement(requirement: unknown): any {
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
