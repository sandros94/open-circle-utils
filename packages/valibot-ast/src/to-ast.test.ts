import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST, AST_VERSION } from "./to-ast.ts";
import { astToSchema } from "./to-schema.ts";
import { createDictionary } from "./dictionary.ts";

// ─── Helpers ────────────────────────────────────────────────────────────────

function roundTrip(schema: v.GenericSchema, dictionary?: Map<string, any>) {
  const { document } = schemaToAST(schema, { dictionary });
  const json = JSON.parse(JSON.stringify(document));
  return astToSchema(json, { dictionary });
}

function expectRoundTrip(schema: v.GenericSchema, validInput: unknown, invalidInput?: unknown) {
  const rebuilt = roundTrip(schema);
  const validResult = v.safeParse(rebuilt, validInput);
  expect(validResult.success).toBe(true);
  if (invalidInput !== undefined) {
    const invalidResult = v.safeParse(rebuilt, invalidInput);
    expect(invalidResult.success).toBe(false);
  }
}

// ─── Serialization ──────────────────────────────────────────────────────────

describe("schemaToAST", () => {
  it("produces correct document structure", () => {
    const { document } = schemaToAST(v.string());
    expect(document.version).toBe(AST_VERSION);
    expect(document.library).toBe("valibot");
    expect(document.schema.kind).toBe("schema");
    expect(document.schema.type).toBe("string");
    expect(document.dictionary).toBeUndefined();
  });

  it("includes metadata in document", () => {
    const { document } = schemaToAST(v.string(), {
      metadata: { author: "test" },
    });
    expect(document.metadata).toEqual({ author: "test" });
  });

  it("tracks referenced dictionary entries", () => {
    const getter = () => v.string();
    const dict = createDictionary({ myLazy: getter });
    const schema = v.lazy(getter);
    const { document, referencedDictionary } = schemaToAST(schema, { dictionary: dict });
    expect(referencedDictionary.has("myLazy")).toBe(true);
    expect(document.dictionary).toBeDefined();
    expect(document.dictionary!["myLazy"]).toBeDefined();
  });

  it("annotates lazy schemas without dictionary entry", () => {
    const schema = v.lazy(() => v.string());
    const { document } = schemaToAST(schema);
    expect(document.schema.type).toBe("lazy");
    expect((document.schema as any).note).toBe("lazy-schema-requires-runtime-getter");
  });

  it("serializes schema info (title, description, examples, metadata)", () => {
    const schema = v.pipe(
      v.string(),
      v.title("Name"),
      v.description("A name"),
      v.examples(["Alice", "Bob"]),
      v.metadata({ custom: true })
    );
    const { document } = schemaToAST(schema);
    expect(document.schema.info).toEqual({
      title: "Name",
      description: "A name",
      examples: ["Alice", "Bob"],
      metadata: { custom: true },
    });
  });

  it("serializes RegExp requirements as source/flags", () => {
    const schema = v.pipe(v.string(), v.regex(/^[a-z]+$/i));
    const { document } = schemaToAST(schema);
    const regexPipe = document.schema.pipe![0];
    expect(regexPipe.kind).toBe("validation");
    expect(regexPipe.type).toBe("regex");
    expect((regexPipe as any).requirement).toEqual({ source: "^[a-z]+$", flags: "i" });
  });
});

// ─── Primitives Round-Trip ──────────────────────────────────────────────────

describe("round-trip: primitives", () => {
  it("string", () => expectRoundTrip(v.string(), "hello", 123));
  it("number", () => expectRoundTrip(v.number(), 42, "hello"));
  it("boolean", () => expectRoundTrip(v.boolean(), true, "hello"));
  it("bigint", () => {
    const rebuilt = roundTrip(v.bigint());
    expect(v.safeParse(rebuilt, 42n).success).toBe(true);
    expect(v.safeParse(rebuilt, 42).success).toBe(false);
  });
  it("date", () => expectRoundTrip(v.date(), new Date(), "hello"));
  it("symbol", () => expectRoundTrip(v.symbol(), Symbol("x"), "hello"));
  it("any", () => expectRoundTrip(v.any(), "anything"));
  it("unknown", () => expectRoundTrip(v.unknown(), { x: 1 }));
  it("never", () => {
    const rebuilt = roundTrip(v.never());
    expect(v.safeParse(rebuilt, "hello").success).toBe(false);
  });
  it("nan", () => expectRoundTrip(v.nan(), NaN, 42));
  it("null", () => expectRoundTrip(v.null_(), null, "hello"));
  it("undefined", () => expectRoundTrip(v.undefined_(), undefined, "hello"));
  it("void", () => expectRoundTrip(v.void_(), undefined, "hello"));
});

// ─── Literal Round-Trip ─────────────────────────────────────────────────────

describe("round-trip: literal", () => {
  it("string literal", () => expectRoundTrip(v.literal("hello"), "hello", "world"));
  it("number literal", () => expectRoundTrip(v.literal(42), 42, 43));
  it("boolean literal", () => expectRoundTrip(v.literal(true), true, false));
});

// ─── Wrapped Round-Trip ─────────────────────────────────────────────────────

describe("round-trip: wrapped schemas", () => {
  it("optional", () => expectRoundTrip(v.optional(v.string()), undefined));
  it("optional with default", () => {
    const rebuilt = roundTrip(v.optional(v.string(), "fallback"));
    const result = v.parse(rebuilt, undefined);
    expect(result).toBe("fallback");
  });
  it("nullable", () => expectRoundTrip(v.nullable(v.string()), null));
  it("nullish", () => {
    expectRoundTrip(v.nullish(v.string()), null);
    expectRoundTrip(v.nullish(v.string()), undefined);
  });
  it("nonOptional", () => {
    const rebuilt = roundTrip(v.nonOptional(v.optional(v.string())));
    expect(v.safeParse(rebuilt, undefined).success).toBe(false);
    expect(v.safeParse(rebuilt, "hello").success).toBe(true);
  });
  it("nonNullable", () => {
    const rebuilt = roundTrip(v.nonNullable(v.nullable(v.string())));
    expect(v.safeParse(rebuilt, null).success).toBe(false);
    expect(v.safeParse(rebuilt, "hello").success).toBe(true);
  });
});

// ─── Object Round-Trip ──────────────────────────────────────────────────────

describe("round-trip: objects", () => {
  it("object", () => {
    expectRoundTrip(
      v.object({ name: v.string(), age: v.number() }),
      { name: "Alice", age: 30 },
      { name: 123 }
    );
  });

  it("looseObject", () => {
    const rebuilt = roundTrip(v.looseObject({ name: v.string() }));
    const result = v.safeParse(rebuilt, { name: "Alice", extra: true });
    expect(result.success).toBe(true);
  });

  it("strictObject", () => {
    const rebuilt = roundTrip(v.strictObject({ name: v.string() }));
    const result = v.safeParse(rebuilt, { name: "Alice", extra: true });
    expect(result.success).toBe(false);
  });

  it("objectWithRest", () => {
    const rebuilt = roundTrip(v.objectWithRest({ name: v.string() }, v.number()));
    const result = v.safeParse(rebuilt, { name: "Alice", extra: 42 });
    expect(result.success).toBe(true);
  });

  it("nested objects", () => {
    expectRoundTrip(v.object({ address: v.object({ city: v.string() }) }), {
      address: { city: "NYC" },
    });
  });
});

// ─── Array / Tuple Round-Trip ───────────────────────────────────────────────

describe("round-trip: arrays and tuples", () => {
  it("array", () => expectRoundTrip(v.array(v.string()), ["a", "b"], [1]));
  it("tuple", () => expectRoundTrip(v.tuple([v.string(), v.number()]), ["a", 1]));
  it("looseTuple", () => {
    const rebuilt = roundTrip(v.looseTuple([v.string()]));
    expect(v.safeParse(rebuilt, ["a", "extra"]).success).toBe(true);
  });
  it("strictTuple", () => {
    const rebuilt = roundTrip(v.strictTuple([v.string()]));
    expect(v.safeParse(rebuilt, ["a", "extra"]).success).toBe(false);
  });
  it("tupleWithRest", () => {
    const rebuilt = roundTrip(v.tupleWithRest([v.string()], v.number()));
    expect(v.safeParse(rebuilt, ["a", 1, 2]).success).toBe(true);
  });
});

// ─── Union / Variant / Picklist / Enum Round-Trip ───────────────────────────

describe("round-trip: choice schemas", () => {
  it("union", () => {
    expectRoundTrip(v.union([v.string(), v.number()]), "hello");
    expectRoundTrip(v.union([v.string(), v.number()]), 42);
  });

  it("variant", () => {
    const schema = v.variant("type", [
      v.object({ type: v.literal("a"), value: v.string() }),
      v.object({ type: v.literal("b"), value: v.number() }),
    ]);
    expectRoundTrip(schema, { type: "a", value: "hi" });
    expectRoundTrip(schema, { type: "b", value: 42 });
  });

  it("picklist", () => {
    expectRoundTrip(v.picklist(["a", "b", "c"]), "a", "d");
  });

  it("enum", () => {
    enum Color {
      Red = "red",
      Blue = "blue",
    }
    expectRoundTrip(v.enum(Color), "red", "green");
  });
});

// ─── Record / Map / Set / Intersect Round-Trip ──────────────────────────────

describe("round-trip: containers", () => {
  it("record", () => {
    expectRoundTrip(v.record(v.string(), v.number()), { a: 1, b: 2 });
  });

  it("map", () => {
    const rebuilt = roundTrip(v.map(v.string(), v.number()));
    const result = v.safeParse(rebuilt, new Map([["a", 1]]));
    expect(result.success).toBe(true);
  });

  it("set", () => {
    const rebuilt = roundTrip(v.set(v.string()));
    const result = v.safeParse(rebuilt, new Set(["a", "b"]));
    expect(result.success).toBe(true);
  });

  it("intersect", () => {
    const rebuilt = roundTrip(
      v.intersect([v.object({ a: v.string() }), v.object({ b: v.number() })])
    );
    expect(v.safeParse(rebuilt, { a: "hi", b: 42 }).success).toBe(true);
  });
});

// ─── Instance Round-Trip ────────────────────────────────────────────────────

describe("round-trip: instance", () => {
  it("with dictionary", () => {
    const dict = createDictionary({ MyDate: Date });
    const schema = v.instance(Date);
    const { document } = schemaToAST(schema, { dictionary: dict });
    const rebuilt = astToSchema(document, { dictionary: dict });
    expect(v.safeParse(rebuilt, new Date()).success).toBe(true);
  });

  it("throws without dictionary", () => {
    const { document } = schemaToAST(v.instance(Date));
    expect(() => astToSchema(document)).toThrow(/dictionary/i);
  });
});

// ─── Lazy Round-Trip ────────────────────────────────────────────────────────

describe("round-trip: lazy", () => {
  it("with dictionary", () => {
    const getter = () => v.string();
    const dict = createDictionary({ myGetter: getter });
    const schema = v.lazy(getter);
    const { document } = schemaToAST(schema, { dictionary: dict });
    const rebuilt = astToSchema(document, { dictionary: dict });
    expect(v.safeParse(rebuilt, "hello").success).toBe(true);
  });
});

// ─── Pipe Round-Trip ────────────────────────────────────────────────────────

describe("round-trip: pipe validations", () => {
  it("string validations", () => {
    expectRoundTrip(v.pipe(v.string(), v.email()), "test@test.com", "not-email");
    expectRoundTrip(v.pipe(v.string(), v.url()), "https://example.com", "not-url");
    expectRoundTrip(v.pipe(v.string(), v.uuid()), "550e8400-e29b-41d4-a716-446655440000", "nope");
    expectRoundTrip(v.pipe(v.string(), v.minLength(3)), "abc", "ab");
    expectRoundTrip(v.pipe(v.string(), v.maxLength(3)), "abc", "abcd");
  });

  it("number validations", () => {
    expectRoundTrip(v.pipe(v.number(), v.minValue(5)), 5, 4);
    expectRoundTrip(v.pipe(v.number(), v.maxValue(10)), 10, 11);
    expectRoundTrip(v.pipe(v.number(), v.integer()), 42, 4.5);
    expectRoundTrip(v.pipe(v.number(), v.multipleOf(3)), 9, 10);
  });

  it("regex validation with RegExp round-trip", () => {
    const schema = v.pipe(v.string(), v.regex(/^[a-z]+$/i));
    const rebuilt = roundTrip(schema);
    expect(v.safeParse(rebuilt, "hello").success).toBe(true);
    expect(v.safeParse(rebuilt, "123").success).toBe(false);
  });

  it("string transformations", () => {
    const schema = v.pipe(v.string(), v.trim(), v.toLowerCase());
    const rebuilt = roundTrip(schema);
    expect(v.parse(rebuilt, "  HELLO  ")).toBe("hello");
  });
});

// ─── Deserialization Errors ─────────────────────────────────────────────────

describe("astToSchema: error handling", () => {
  it("throws on wrong library", () => {
    const { document } = schemaToAST(v.string());
    document.library = "zod";
    expect(() => astToSchema(document)).toThrow(/zod/);
  });

  it("allows wrong library with strictLibraryCheck: false", () => {
    const { document } = schemaToAST(v.string());
    document.library = "zod";
    expect(() => astToSchema(document, { strictLibraryCheck: false })).not.toThrow();
  });

  it("throws when dictionary keys are missing", () => {
    const getter = () => v.string();
    const dict = createDictionary({ myGetter: getter });
    const schema = v.lazy(getter);
    const { document } = schemaToAST(schema, { dictionary: dict });
    expect(() => astToSchema(document)).toThrow(/dictionary/i);
  });

  it("validates AST when validateAST is true", () => {
    const { document } = schemaToAST(v.string());
    expect(() => astToSchema(document, { validateAST: true })).not.toThrow();
  });
});
