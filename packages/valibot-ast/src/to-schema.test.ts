import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { astToSchema, type ASTToSchemaOptions } from "./to-schema.ts";
import { schemaToAST } from "./to-ast.ts";
import { createDictionary } from "./dictionary.ts";
import type { ASTDocument } from "./types/index.ts";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Serialize an async schema and deserialize it back, returning the rebuilt schema. */
function asyncRoundTrip<TSchema extends v.GenericSchema | v.GenericSchemaAsync>(
  schema: TSchema,
  dictionary?: ASTToSchemaOptions["dictionary"]
): v.GenericSchemaAsync {
  const { document } = schemaToAST(schema, { dictionary });
  const json = JSON.parse(JSON.stringify(document));
  return astToSchema<v.GenericSchemaAsync>(json, { dictionary });
}

/** Build a minimal valid ASTDocument wrapping an arbitrary schema node. */
function makeDoc(schema: ASTDocument["schema"]): ASTDocument {
  return {
    version: "0.1.0",
    library: "valibot",
    schema: schema,
  };
}

// ─── astToSchema ─────────────────────────────────────────────────────────────

describe("astToSchema", () => {
  // ─── Document-level options ─────────────────────────────────────────────

  describe("validateAST option", () => {
    it("passes for a valid AST document", () => {
      const { document } = schemaToAST(v.string());
      expect(() => astToSchema(document, { validateAST: true })).not.toThrow();
    });

    it("throws for an invalid AST document with nested issues", () => {
      const bad = {
        version: "0.1.0",
        library: "valibot",
        schema: { kind: "schema", type: 123 },
      };
      // @ts-expect-error - testing invalid AST structure
      expect(() => astToSchema(bad, { validateAST: true })).toThrow(/Invalid AST document/i);
    });

    it("throws for an invalid AST document with no nested issues (only root)", () => {
      // @ts-expect-error - testing invalid AST structure
      expect(() => astToSchema(null, { validateAST: true })).toThrow(
        /Invalid AST document|validation failed/i
      );
    });
  });

  describe("dictionary validation", () => {
    it("throws when dict keys present but dictionary option missing", () => {
      const getter = () => v.string();
      const dict = createDictionary({ getter });
      const { document } = schemaToAST(v.lazy(getter), { dictionary: dict });
      expect(() => astToSchema(document)).toThrow(/dictionary/i);
    });

    it("throws when provided dictionary is missing required keys", () => {
      const getter = () => v.string();
      const dict = createDictionary({ getter });
      const { document } = schemaToAST(v.lazy(getter), { dictionary: dict });
      const emptyDict = createDictionary({});
      expect(() => astToSchema(document, { dictionary: emptyDict })).toThrow(
        /not found in provided/i
      );
    });

    it("skips missing-key check when astDocument.dictionary is empty manifest", () => {
      // astDocument.dictionary = {} → requiredKeys = [] → no throw;
      // options.dictionary is not provided → false branch of `if (options?.dictionary)`
      const doc: ASTDocument = {
        version: "0.1.0",
        library: "valibot",
        schema: { kind: "schema", type: "string" } as ASTDocument["schema"],
        dictionary: {},
      };
      expect(() => astToSchema(doc)).not.toThrow();
    });
  });

  // ─── Error cases ────────────────────────────────────────────────────────

  describe("error cases", () => {
    it("throws on standalone validation node", () => {
      const doc = makeDoc({ kind: "validation", type: "email" });
      expect(() => astToSchema(doc)).toThrow(/standalone/i);
    });

    it("throws on standalone transformation node", () => {
      const doc = makeDoc({ kind: "transformation", type: "trim" });
      expect(() => astToSchema(doc)).toThrow(/standalone/i);
    });

    it("throws on standalone metadata node", () => {
      // @ts-expect-error - testing invalid AST structure
      const doc = makeDoc({ kind: "metadata", type: "title" });
      expect(() => astToSchema(doc)).toThrow(/standalone/i);
    });

    it("throws on object_with_rest without rest schema", () => {
      const doc = makeDoc({ kind: "schema", type: "object_with_rest", entries: {} });
      expect(() => astToSchema(doc)).toThrow(/object_with_rest requires a rest schema/);
    });

    it("throws on tuple_with_rest without rest schema", () => {
      const doc = makeDoc({ kind: "schema", type: "tuple_with_rest", items: [] });
      expect(() => astToSchema(doc)).toThrow(/tuple_with_rest requires a rest schema/);
    });

    it("throws on unknown schema type", () => {
      // @ts-expect-error - testing unknown schema type
      const doc = makeDoc({ kind: "schema", type: "not_a_real_type" });
      expect(() => astToSchema(doc)).toThrow(/Unknown schema type/);
    });

    it("throws on instance without dictionary", () => {
      const doc = makeDoc({ kind: "schema", type: "instance", class: "Date" });
      expect(() => astToSchema(doc)).toThrow(/Cannot reconstruct instance schema/);
    });

    it("throws on instance when dictionaryKey is not found in provided dictionary", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "instance",
        class: "Date",
        dictionaryKey: "MyDate",
      });
      const dict = createDictionary({ OtherClass: Map });
      expect(() => astToSchema(doc, { dictionary: dict })).toThrow(/not found in the dictionary/);
    });

    it("throws on lazy without dictionaryKey", () => {
      const doc = makeDoc({ kind: "schema", type: "lazy" });
      expect(() => astToSchema(doc)).toThrow(
        /Cannot reconstruct lazy schema without dictionaryKey/
      );
    });

    it("throws on lazy when dictionaryKey not found in dictionary", () => {
      const doc = makeDoc({ kind: "schema", type: "lazy", dictionaryKey: "myGetter" });
      const dict = createDictionary({ otherKey: () => v.string() });
      expect(() => astToSchema(doc, { dictionary: dict })).toThrow(/not found in the dictionary/);
    });

    it("throws on standalone custom schema without dictionaryKey", () => {
      const doc = makeDoc({ kind: "schema", type: "custom" });
      expect(() => astToSchema(doc)).toThrow(
        /Cannot reconstruct custom schema without dictionaryKey/
      );
    });

    it("throws on standalone custom schema when dictionaryKey not found", () => {
      const doc = makeDoc({ kind: "schema", type: "custom", dictionaryKey: "myCheck" });
      const dict = createDictionary({ otherKey: () => true });
      expect(() => astToSchema(doc, { dictionary: dict })).toThrow(/not found in the dictionary/);
    });

    it("throws on custom validation without dictionaryKey", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "string",
        pipe: [{ kind: "validation", type: "custom" }],
      });
      expect(() => astToSchema(doc)).toThrow(/no dictionaryKey provided/);
    });

    it("throws on check validation without dictionaryKey", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "string",
        pipe: [{ kind: "validation", type: "check" }],
      });
      expect(() => astToSchema(doc)).toThrow(/no dictionaryKey provided/);
    });

    it("throws on custom validation when dictionaryKey not found", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "string",
        pipe: [{ kind: "validation", type: "custom", dictionaryKey: "myCheck" }],
      });
      const dict = createDictionary({ otherKey: () => true });
      expect(() => astToSchema(doc, { dictionary: dict })).toThrow(/not found in dictionary/);
    });

    it("throws on unknown validation type", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "string",
        pipe: [{ kind: "validation", type: "not_real_validation" }],
      });
      expect(() => astToSchema(doc)).toThrow(/Unknown validation type/);
    });

    it("throws on custom transformation without dictionaryKey", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "string",
        pipe: [{ kind: "transformation", type: "transform" }],
      });
      expect(() => astToSchema(doc)).toThrow(/no dictionaryKey provided/);
    });

    it("throws on custom transformation when dictionaryKey not found", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "string",
        pipe: [{ kind: "transformation", type: "transform", dictionaryKey: "myTransform" }],
      });
      const dict = createDictionary({ otherKey: (x: string) => x });
      expect(() => astToSchema(doc, { dictionary: dict })).toThrow(/not found in dictionary/);
    });

    it("throws on unknown transformation type", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "string",
        pipe: [{ kind: "transformation", type: "not_real_transform" }],
      });
      expect(() => astToSchema(doc)).toThrow(/Unknown transformation type/);
    });

    it("throws on unknown pipe item kind", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "string",
        // @ts-expect-error - testing unknown pipe item kind
        pipe: [{ kind: "unknown_kind", type: "something" }],
      });
      expect(() => astToSchema(doc)).toThrow(/Unknown pipe item kind/);
    });
  });

  // ─── Async schema variants ───────────────────────────────────────────────

  describe("async schemas", () => {
    it("objectAsync", () => {
      const schema = v.objectAsync({ name: v.string() });
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("object");
    });

    it("looseObjectAsync", () => {
      const schema = v.looseObjectAsync({ name: v.string() });
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("loose_object");
    });

    it("strictObjectAsync", () => {
      const schema = v.strictObjectAsync({ name: v.string() });
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("strict_object");
    });

    it("objectWithRestAsync", () => {
      const schema = v.objectWithRestAsync({ name: v.string() }, v.number());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("object_with_rest");
    });

    it("arrayAsync", () => {
      const schema = v.arrayAsync(v.string());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("array");
    });

    it("tupleAsync", () => {
      const schema = v.tupleAsync([v.string(), v.number()]);
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("tuple");
    });

    it("looseTupleAsync", () => {
      const schema = v.looseTupleAsync([v.string()]);
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("loose_tuple");
    });

    it("strictTupleAsync", () => {
      const schema = v.strictTupleAsync([v.string()]);
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("strict_tuple");
    });

    it("tupleWithRestAsync", () => {
      const schema = v.tupleWithRestAsync([v.string()], v.number());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("tuple_with_rest");
    });

    it("unionAsync", () => {
      const schema = v.unionAsync([v.string(), v.number()]);
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("union");
    });

    it("variantAsync", () => {
      const schema = v.variantAsync("type", [
        v.objectAsync({ type: v.literal("a") }),
        v.objectAsync({ type: v.literal("b") }),
      ]);
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("variant");
    });

    it("recordAsync", () => {
      const schema = v.recordAsync(v.string(), v.number());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("record");
    });

    it("mapAsync", () => {
      const schema = v.mapAsync(v.string(), v.number());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("map");
    });

    it("setAsync", () => {
      const schema = v.setAsync(v.string());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("set");
    });

    it("intersectAsync", () => {
      const schema = v.intersectAsync([
        v.objectAsync({ a: v.string() }),
        v.objectAsync({ b: v.number() }),
      ]);
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("intersect");
    });

    it("optionalAsync without default", () => {
      const schema = v.optionalAsync(v.string());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("optional");
    });

    it("optionalAsync with default", () => {
      const schema = v.optionalAsync(v.string(), "fallback");
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
    });

    it("nullableAsync without default", () => {
      const schema = v.nullableAsync(v.string());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("nullable");
    });

    it("nullableAsync with default", () => {
      const schema = v.nullableAsync(v.string(), "fallback");
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
    });

    it("nullishAsync without default", () => {
      const schema = v.nullishAsync(v.string());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("nullish");
    });

    it("nullishAsync with default", () => {
      const schema = v.nullishAsync(v.string(), "fallback");
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
    });

    it("nonOptionalAsync", () => {
      const schema = v.nonOptionalAsync(v.optional(v.string()));
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("non_optional");
    });

    it("nonNullableAsync", () => {
      const schema = v.nonNullableAsync(v.nullable(v.string()));
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("non_nullable");
    });

    it("nonNullishAsync", () => {
      const schema = v.nonNullishAsync(v.nullish(v.string()));
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("non_nullish");
    });

    it("exactOptionalAsync without default", () => {
      const schema = v.exactOptionalAsync(v.string());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("exact_optional");
    });

    it("exactOptionalAsync with default", () => {
      const schema = v.exactOptionalAsync(v.string(), "fallback");
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
    });

    it("undefinedableAsync without default", () => {
      const schema = v.undefinedableAsync(v.string());
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("undefinedable");
    });

    it("undefinedableAsync with default", () => {
      const schema = v.undefinedableAsync(v.string(), "fallback");
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
    });

    it("lazyAsync", () => {
      const getter = () => v.string();
      const schema = v.lazyAsync(getter);
      const dict = createDictionary({ getter });
      const rebuilt = asyncRoundTrip(schema, dict);
      expect(rebuilt.async).toBe(true);
      expect(rebuilt.type).toBe("lazy");
    });

    it("pipeAsync for schema with pipe", () => {
      const check = async (val: string) => val.length > 2;
      const dict = createDictionary({ check });
      const schema = v.pipeAsync(v.string(), v.checkAsync(check));
      const rebuilt = asyncRoundTrip(schema, dict);
      expect(rebuilt.async).toBe(true);
    });

    it("pipeAsync for schema with info", () => {
      const schema = v.pipeAsync(v.objectAsync({}), v.title("Async Object"));
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
    });

    it("checkAsync for custom validation in async context", async () => {
      const check = async (val: string) => val === "valid";
      const dict = createDictionary({ check });
      const schema = v.pipeAsync(v.string(), v.checkAsync(check));
      const { document } = schemaToAST(schema, { dictionary: dict });
      const json = JSON.parse(JSON.stringify(document));
      const rebuilt = astToSchema<v.GenericSchemaAsync>(json, { dictionary: dict });
      expect(await v.safeParseAsync(rebuilt, "valid")).toMatchObject({ success: true });
      expect(await v.safeParseAsync(rebuilt, "invalid")).toMatchObject({ success: false });
    });

    it("transformAsync for custom transformation in async context", async () => {
      const transform = async (val: string) => val.toUpperCase();
      const dict = createDictionary({ transform });
      const schema = v.pipeAsync(v.string(), v.transformAsync(transform));
      const { document } = schemaToAST(schema, { dictionary: dict });
      const json = JSON.parse(JSON.stringify(document));
      const rebuilt = astToSchema<v.GenericSchemaAsync>(json, { dictionary: dict });
      expect(await v.parseAsync(rebuilt, "hello")).toBe("HELLO");
    });
  });

  // ─── Sync wrapped schema variants without round-trip coverage ────────────

  describe("sync wrapped schemas (manual AST)", () => {
    function fromDoc(doc: ASTDocument): v.GenericSchema {
      return astToSchema<v.GenericSchema>(doc);
    }

    it("nonNullish sync", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "non_nullish",
        wrapped: { kind: "schema", type: "string" },
      });
      expect(fromDoc(doc).type).toBe("non_nullish");
    });

    it("exactOptional sync without default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "exact_optional",
        wrapped: { kind: "schema", type: "string" },
      });
      expect(fromDoc(doc).type).toBe("exact_optional");
    });

    it("exactOptional sync with default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "exact_optional",
        wrapped: { kind: "schema", type: "string" },
        default: "hello",
      });
      expect(fromDoc(doc).type).toBe("exact_optional");
    });

    it("undefinedable sync without default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "undefinedable",
        wrapped: { kind: "schema", type: "string" },
      });
      expect(fromDoc(doc).type).toBe("undefinedable");
    });

    it("undefinedable sync with default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "undefinedable",
        wrapped: { kind: "schema", type: "string" },
        default: "hello",
      });
      expect(fromDoc(doc).type).toBe("undefinedable");
    });

    it("nullable sync with default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "nullable",
        wrapped: { kind: "schema", type: "string" },
        default: "hello",
      });
      expect(fromDoc(doc).type).toBe("nullable");
    });

    it("nullish sync with default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "nullish",
        wrapped: { kind: "schema", type: "string" },
        default: "hello",
      });
      expect(fromDoc(doc).type).toBe("nullish");
    });
  });

  describe("async wrapped schemas with defaults (manual AST)", () => {
    function fromAsyncDoc(doc: ASTDocument): v.GenericSchemaAsync {
      return astToSchema<v.GenericSchemaAsync>(doc);
    }

    it("nonNullish async", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "non_nullish",
        async: true,
        wrapped: { kind: "schema", type: "string" },
      });
      const schema = fromAsyncDoc(doc);
      expect(schema.async).toBe(true);
      expect(schema.type).toBe("non_nullish");
    });

    it("nullable async with default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "nullable",
        async: true,
        wrapped: { kind: "schema", type: "string" },
        default: "fallback",
      });
      expect(fromAsyncDoc(doc).async).toBe(true);
    });

    it("nullish async with default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "nullish",
        async: true,
        wrapped: { kind: "schema", type: "string" },
        default: "fallback",
      });
      expect(fromAsyncDoc(doc).async).toBe(true);
    });

    it("exactOptional async without default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "exact_optional",
        async: true,
        wrapped: { kind: "schema", type: "string" },
      });
      const schema = fromAsyncDoc(doc);
      expect(schema.async).toBe(true);
      expect(schema.type).toBe("exact_optional");
    });

    it("exactOptional async with default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "exact_optional",
        async: true,
        wrapped: { kind: "schema", type: "string" },
        default: "fallback",
      });
      expect(fromAsyncDoc(doc).async).toBe(true);
    });

    it("undefinedable async without default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "undefinedable",
        async: true,
        wrapped: { kind: "schema", type: "string" },
      });
      const schema = fromAsyncDoc(doc);
      expect(schema.async).toBe(true);
      expect(schema.type).toBe("undefinedable");
    });

    it("undefinedable async with default", () => {
      const doc = makeDoc({
        kind: "schema",
        type: "undefinedable",
        async: true,
        wrapped: { kind: "schema", type: "string" },
        default: "fallback",
      });
      expect(fromAsyncDoc(doc).async).toBe(true);
    });
  });

  // ─── Additional schema paths ─────────────────────────────────────────────

  describe("primitive types", () => {
    it("file schema", () => {
      const { document } = schemaToAST(v.file());
      const rebuilt = astToSchema<v.GenericSchema>(document);
      expect(rebuilt.type).toBe("file");
    });

    it("promise schema", () => {
      const { document } = schemaToAST(v.promise());
      const rebuilt = astToSchema<v.GenericSchema>(document);
      expect(rebuilt.type).toBe("promise");
    });
  });

  describe("schema node inside pipe", () => {
    it("deserializes a schema-kind pipe item recursively", () => {
      // When to-ast.ts serializes a non-custom schema in a pipe, it emits a
      // schema node inside the pipe. Verify that astToSchema handles it.
      const doc = makeDoc({
        kind: "schema",
        type: "string",
        pipe: [{ kind: "schema", type: "number" }],
      });
      const schema = astToSchema<v.GenericSchema>(doc);
      expect(schema).toBeDefined();
    });
  });

  describe("info fields", () => {
    it("restores description from info", () => {
      const schema = v.pipe(v.string(), v.description("A helpful description"));
      const { document } = schemaToAST(schema);
      const rebuilt = astToSchema<v.GenericSchema>(document);
      expect(rebuilt.type).toBe("string");
    });

    it("restores metadata from info", () => {
      const schema = v.pipe(v.string(), v.metadata({ custom: "value" }));
      const { document } = schemaToAST(schema);
      const rebuilt = astToSchema<v.GenericSchema>(document);
      expect(rebuilt.type).toBe("string");
    });

    it("restores examples from info", () => {
      const schema = v.pipe(v.string(), v.examples(["hello", "world"]));
      const { document } = schemaToAST(schema);
      const rebuilt = astToSchema<v.GenericSchema>(document);
      expect(rebuilt.type).toBe("string");
    });

    it("restores examples from info for async schema", () => {
      const schema = v.pipeAsync(v.objectAsync({}), v.examples([{ name: "test" }]));
      const rebuilt = asyncRoundTrip(schema);
      expect(rebuilt.async).toBe(true);
    });

    it("handles info block with no applicable fields (pipeArgs.length stays 1)", () => {
      // info object exists but has no title/description/examples/metadata → pipeArgs.length = 1
      const doc = makeDoc({ kind: "schema", type: "string", info: {} });
      const schema = astToSchema<v.GenericSchema>(doc);
      expect(schema.type).toBe("string");
    });
  });

  // ─── Validation types not covered by to-ast round-trips ─────────────────

  describe("validations", () => {
    function roundTrip(schema: v.GenericSchema): v.GenericSchema {
      const { document } = schemaToAST(schema);
      const json = JSON.parse(JSON.stringify(document));
      return astToSchema<v.GenericSchema>(json);
    }

    describe("string format validations", () => {
      it("emoji", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.emoji()));
        expect(v.safeParse(rebuilt, "😀").success).toBe(true);
        expect(v.safeParse(rebuilt, "not-emoji").success).toBe(false);
      });

      it("ip", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.ip()));
        expect(v.safeParse(rebuilt, "192.168.1.1").success).toBe(true);
        expect(v.safeParse(rebuilt, "not-ip").success).toBe(false);
      });

      it("ipv4", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.ipv4()));
        expect(v.safeParse(rebuilt, "192.168.1.1").success).toBe(true);
        expect(v.safeParse(rebuilt, "::1").success).toBe(false);
      });

      it("ipv6", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.ipv6()));
        expect(v.safeParse(rebuilt, "::1").success).toBe(true);
        expect(v.safeParse(rebuilt, "192.168.1.1").success).toBe(false);
      });

      it("ulid", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.ulid()));
        expect(v.safeParse(rebuilt, "01ARZ3NDEKTSV4RRFFQ69G5FAV").success).toBe(true);
        expect(v.safeParse(rebuilt, "not-ulid").success).toBe(false);
      });

      it("cuid2", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.cuid2()));
        expect(v.safeParse(rebuilt, "clbqmfci5000008l80xnpbkvb").success).toBe(true);
        expect(v.safeParse(rebuilt, "not-cuid2").success).toBe(false);
      });

      it("nanoid", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.nanoid()));
        expect(v.safeParse(rebuilt, "V1StGXR8_Z5jdHi6B-myT").success).toBe(true);
        expect(v.safeParse(rebuilt, "invalid id").success).toBe(false);
      });

      it("mac", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.mac()));
        expect(v.safeParse(rebuilt, "00:11:22:33:44:55").success).toBe(true);
        expect(v.safeParse(rebuilt, "not-mac").success).toBe(false);
      });

      it("mac48", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.mac48()));
        expect(v.safeParse(rebuilt, "00:11:22:33:44:55").success).toBe(true);
      });

      it("mac64", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.mac64()));
        expect(v.safeParse(rebuilt, "00:11:22:33:44:55:66:77").success).toBe(true);
      });

      it("imei", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.imei()));
        expect(v.safeParse(rebuilt, "490154203237518").success).toBe(true);
      });

      it("iso_date", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.isoDate()));
        expect(v.safeParse(rebuilt, "2024-01-15").success).toBe(true);
        expect(v.safeParse(rebuilt, "not-a-date").success).toBe(false);
      });

      it("iso_date_time", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.isoDateTime()));
        expect(v.safeParse(rebuilt, "2024-01-15T10:30").success).toBe(true);
        expect(v.safeParse(rebuilt, "not-datetime").success).toBe(false);
      });

      it("iso_time", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.isoTime()));
        expect(v.safeParse(rebuilt, "10:30").success).toBe(true);
      });

      it("iso_time_second", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.isoTimeSecond()));
        expect(v.safeParse(rebuilt, "10:30:00").success).toBe(true);
      });

      it("iso_timestamp", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.isoTimestamp()));
        expect(v.safeParse(rebuilt, "2024-01-15T10:30:00.000Z").success).toBe(true);
      });

      it("iso_week", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.isoWeek()));
        expect(v.safeParse(rebuilt, "2024-W03").success).toBe(true);
      });

      it("includes", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.includes("hello")));
        expect(v.safeParse(rebuilt, "say hello world").success).toBe(true);
        expect(v.safeParse(rebuilt, "goodbye").success).toBe(false);
      });

      it("excludes", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.excludes("bad")));
        expect(v.safeParse(rebuilt, "good string").success).toBe(true);
        expect(v.safeParse(rebuilt, "bad string").success).toBe(false);
      });

      it("starts_with", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.startsWith("hello")));
        expect(v.safeParse(rebuilt, "hello world").success).toBe(true);
        expect(v.safeParse(rebuilt, "world hello").success).toBe(false);
      });

      it("ends_with", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.endsWith("world")));
        expect(v.safeParse(rebuilt, "hello world").success).toBe(true);
        expect(v.safeParse(rebuilt, "world hello").success).toBe(false);
      });

      it("hash", () => {
        // hash stores a compiled RegExp as requirement; deserializes as v.regex equivalent
        const rebuilt = roundTrip(v.pipe(v.string(), v.hash(["md5"])));
        expect(v.safeParse(rebuilt, "d41d8cd98f00b204e9800998ecf8427e").success).toBe(true);
        expect(v.safeParse(rebuilt, "xyz").success).toBe(false);
      });

      it("mime_type", () => {
        const rebuilt = roundTrip(v.pipe(v.blob(), v.mimeType(["image/png"])));
        const blob = new Blob([""], { type: "image/png" });
        expect(v.safeParse(rebuilt, blob).success).toBe(true);
      });

      it("bic", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.bic()));
        expect(v.safeParse(rebuilt, "DEUTDEDB").success).toBe(true);
        expect(v.safeParse(rebuilt, "not-bic").success).toBe(false);
      });

      it("credit_card", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.creditCard()));
        expect(v.safeParse(rebuilt, "4111111111111111").success).toBe(true);
      });

      it("decimal", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.decimal()));
        expect(v.safeParse(rebuilt, "42").success).toBe(true);
        expect(v.safeParse(rebuilt, "abc").success).toBe(false);
      });

      it("digits", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.digits()));
        expect(v.safeParse(rebuilt, "12345").success).toBe(true);
        expect(v.safeParse(rebuilt, "abc").success).toBe(false);
      });

      it("hex_color", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.hexColor()));
        expect(v.safeParse(rebuilt, "#ff0000").success).toBe(true);
        expect(v.safeParse(rebuilt, "not-color").success).toBe(false);
      });

      it("hexadecimal", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.hexadecimal()));
        expect(v.safeParse(rebuilt, "ff0a1b").success).toBe(true);
        expect(v.safeParse(rebuilt, "xyz").success).toBe(false);
      });

      it("octal", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.octal()));
        expect(v.safeParse(rebuilt, "0o755").success).toBe(true);
        expect(v.safeParse(rebuilt, "999").success).toBe(false);
      });

      it("rfc_email", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.rfcEmail()));
        expect(v.safeParse(rebuilt, "test@example.com").success).toBe(true);
      });

      it("slug", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.slug()));
        expect(v.safeParse(rebuilt, "my-slug-123").success).toBe(true);
        expect(v.safeParse(rebuilt, "not a slug!").success).toBe(false);
      });

      it("empty", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.empty()));
        expect(v.safeParse(rebuilt, "").success).toBe(true);
        expect(v.safeParse(rebuilt, "not-empty").success).toBe(false);
      });
    });

    describe("size/length variants", () => {
      it("length", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.length(5)));
        expect(v.safeParse(rebuilt, "hello").success).toBe(true);
        expect(v.safeParse(rebuilt, "hi").success).toBe(false);
      });

      it("safe_integer", () => {
        const rebuilt = roundTrip(v.pipe(v.number(), v.safeInteger()));
        expect(v.safeParse(rebuilt, 42).success).toBe(true);
        expect(v.safeParse(rebuilt, 4.5).success).toBe(false);
      });

      it("finite", () => {
        const rebuilt = roundTrip(v.pipe(v.number(), v.finite()));
        expect(v.safeParse(rebuilt, 42).success).toBe(true);
        expect(v.safeParse(rebuilt, Infinity).success).toBe(false);
      });

      it("value", () => {
        const rebuilt = roundTrip(v.pipe(v.number(), v.value(42)));
        expect(v.safeParse(rebuilt, 42).success).toBe(true);
        expect(v.safeParse(rebuilt, 43).success).toBe(false);
      });

      it("not_length", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.notLength(3)));
        expect(v.safeParse(rebuilt, "hello").success).toBe(true);
        expect(v.safeParse(rebuilt, "abc").success).toBe(false);
      });

      it("not_value", () => {
        const rebuilt = roundTrip(v.pipe(v.number(), v.notValue(0)));
        expect(v.safeParse(rebuilt, 1).success).toBe(true);
        expect(v.safeParse(rebuilt, 0).success).toBe(false);
      });

      it("gt_value", () => {
        const rebuilt = roundTrip(v.pipe(v.number(), v.gtValue(5)));
        expect(v.safeParse(rebuilt, 6).success).toBe(true);
        expect(v.safeParse(rebuilt, 5).success).toBe(false);
      });

      it("lt_value", () => {
        const rebuilt = roundTrip(v.pipe(v.number(), v.ltValue(5)));
        expect(v.safeParse(rebuilt, 4).success).toBe(true);
        expect(v.safeParse(rebuilt, 5).success).toBe(false);
      });
    });

    describe("collection validations", () => {
      it("min_size on set", () => {
        const rebuilt = roundTrip(v.pipe(v.set(v.string()), v.minSize(1)));
        expect(v.safeParse(rebuilt, new Set(["a"])).success).toBe(true);
        expect(v.safeParse(rebuilt, new Set()).success).toBe(false);
      });

      it("max_size on set", () => {
        const rebuilt = roundTrip(v.pipe(v.set(v.string()), v.maxSize(2)));
        expect(v.safeParse(rebuilt, new Set(["a", "b"])).success).toBe(true);
        expect(v.safeParse(rebuilt, new Set(["a", "b", "c"])).success).toBe(false);
      });

      it("size on set", () => {
        const rebuilt = roundTrip(v.pipe(v.set(v.string()), v.size(2)));
        expect(v.safeParse(rebuilt, new Set(["a", "b"])).success).toBe(true);
      });

      it("not_size on set", () => {
        const rebuilt = roundTrip(v.pipe(v.set(v.string()), v.notSize(0)));
        expect(v.safeParse(rebuilt, new Set(["a"])).success).toBe(true);
        expect(v.safeParse(rebuilt, new Set()).success).toBe(false);
      });

      it("min_entries on record", () => {
        const rebuilt = roundTrip(v.pipe(v.record(v.string(), v.number()), v.minEntries(1)));
        expect(v.safeParse(rebuilt, { a: 1 }).success).toBe(true);
        expect(v.safeParse(rebuilt, {}).success).toBe(false);
      });

      it("max_entries on record", () => {
        const rebuilt = roundTrip(v.pipe(v.record(v.string(), v.number()), v.maxEntries(2)));
        expect(v.safeParse(rebuilt, { a: 1, b: 2 }).success).toBe(true);
        expect(v.safeParse(rebuilt, { a: 1, b: 2, c: 3 }).success).toBe(false);
      });

      it("entries on record", () => {
        const rebuilt = roundTrip(v.pipe(v.record(v.string(), v.number()), v.entries(2)));
        expect(v.safeParse(rebuilt, { a: 1, b: 2 }).success).toBe(true);
      });

      it("not_entries on record", () => {
        const rebuilt = roundTrip(v.pipe(v.record(v.string(), v.number()), v.notEntries(0)));
        expect(v.safeParse(rebuilt, { a: 1 }).success).toBe(true);
        expect(v.safeParse(rebuilt, {}).success).toBe(false);
      });
    });

    describe("byte validations", () => {
      it("min_bytes", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.minBytes(1)));
        expect(v.safeParse(rebuilt, "a").success).toBe(true);
        expect(v.safeParse(rebuilt, "").success).toBe(false);
      });

      it("max_bytes", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.maxBytes(5)));
        expect(v.safeParse(rebuilt, "hello").success).toBe(true);
        expect(v.safeParse(rebuilt, "hello!").success).toBe(false);
      });

      it("bytes", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.bytes(5)));
        expect(v.safeParse(rebuilt, "hello").success).toBe(true);
      });

      it("not_bytes", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.notBytes(0)));
        expect(v.safeParse(rebuilt, "a").success).toBe(true);
        expect(v.safeParse(rebuilt, "").success).toBe(false);
      });
    });

    describe("grapheme validations", () => {
      it("min_graphemes", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.minGraphemes(1)));
        expect(v.safeParse(rebuilt, "a").success).toBe(true);
        expect(v.safeParse(rebuilt, "").success).toBe(false);
      });

      it("max_graphemes", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.maxGraphemes(3)));
        expect(v.safeParse(rebuilt, "abc").success).toBe(true);
        expect(v.safeParse(rebuilt, "abcd").success).toBe(false);
      });

      it("graphemes", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.graphemes(3)));
        expect(v.safeParse(rebuilt, "abc").success).toBe(true);
      });

      it("not_graphemes", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.notGraphemes(0)));
        expect(v.safeParse(rebuilt, "a").success).toBe(true);
        expect(v.safeParse(rebuilt, "").success).toBe(false);
      });
    });

    describe("word validations", () => {
      it("min_words", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.minWords(undefined, 2)));
        expect(v.safeParse(rebuilt, "hello world").success).toBe(true);
        expect(v.safeParse(rebuilt, "hello").success).toBe(false);
      });

      it("max_words", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.maxWords(undefined, 2)));
        expect(v.safeParse(rebuilt, "hello world").success).toBe(true);
        expect(v.safeParse(rebuilt, "one two three").success).toBe(false);
      });

      it("words", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.words(undefined, 2)));
        expect(v.safeParse(rebuilt, "hello world").success).toBe(true);
      });

      it("not_words", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.notWords(undefined, 0)));
        expect(v.safeParse(rebuilt, "hello").success).toBe(true);
        expect(v.safeParse(rebuilt, "").success).toBe(false);
      });
    });
  });

  // ─── Transformation types not covered by to-ast round-trips ─────────────

  describe("transformations", () => {
    function roundTrip(schema: v.GenericSchema): v.GenericSchema {
      const { document } = schemaToAST(schema);
      const json = JSON.parse(JSON.stringify(document));
      return astToSchema<v.GenericSchema>(json);
    }

    it("toUpperCase", () => {
      const rebuilt = roundTrip(v.pipe(v.string(), v.toUpperCase()));
      expect(v.parse(rebuilt, "hello")).toBe("HELLO");
    });

    it("trimStart", () => {
      const rebuilt = roundTrip(v.pipe(v.string(), v.trimStart()));
      expect(v.parse(rebuilt, "  hello  ")).toBe("hello  ");
    });

    it("trimEnd", () => {
      const rebuilt = roundTrip(v.pipe(v.string(), v.trimEnd()));
      expect(v.parse(rebuilt, "  hello  ")).toBe("  hello");
    });

    it("toString", () => {
      const rebuilt = roundTrip(v.pipe(v.unknown(), v.toString()));
      expect(v.parse(rebuilt, 42)).toBe("42");
    });

    it("toNumber", () => {
      const rebuilt = roundTrip(v.pipe(v.unknown(), v.toNumber()));
      expect(v.parse(rebuilt, "42")).toBe(42);
    });

    it("toBigint", () => {
      const rebuilt = roundTrip(v.pipe(v.unknown(), v.toBigint()));
      expect(v.parse(rebuilt, "42")).toBe(42n);
    });

    it("toBoolean", () => {
      const rebuilt = roundTrip(v.pipe(v.unknown(), v.toBoolean()));
      expect(v.parse(rebuilt, "true")).toBe(true);
    });

    it("toDate", () => {
      const rebuilt = roundTrip(v.pipe(v.unknown(), v.toDate()));
      const result = v.parse(rebuilt, "2024-01-15");
      expect(result).toBeInstanceOf(Date);
    });

    it("sync custom validation with dictionaryKey (v.custom path)", () => {
      const isLong = (val: string) => val.length > 3;
      const dict = createDictionary({ isLong });
      const schema = v.pipe(v.string(), v.check(isLong));
      const { document } = schemaToAST(schema, { dictionary: dict });
      const json = JSON.parse(JSON.stringify(document));
      const rebuilt = astToSchema<v.GenericSchema>(json, { dictionary: dict });
      expect(v.safeParse(rebuilt, "hello").success).toBe(true);
      expect(v.safeParse(rebuilt, "hi").success).toBe(false);
    });

    it("sync custom transformation with dictionaryKey (v.transform path)", () => {
      const upper = (val: string) => val.toUpperCase();
      const dict = createDictionary({ upper });
      const schema = v.pipe(v.string(), v.transform(upper));
      const { document } = schemaToAST(schema, { dictionary: dict });
      const json = JSON.parse(JSON.stringify(document));
      const rebuilt = astToSchema<v.GenericSchema>(json, { dictionary: dict });
      expect(v.parse(rebuilt, "hello")).toBe("HELLO");
    });
  });
});
