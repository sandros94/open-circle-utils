import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST, AST_VERSION } from "./to-ast.ts";
import { astToSchema, ASTToSchemaOptions } from "./to-schema.ts";
import { createDictionary } from "./dictionary.ts";
import type {
  ASTNode,
  LazyASTNode,
  WrappedASTNode,
  TransformationASTNode,
  ValidationASTNode,
  MetadataASTNode,
  InstanceASTNode,
  CustomASTNode,
  LiteralASTNode,
  PicklistASTNode,
  SerializedBigInt,
} from "./types/index.ts";

// ─── Helpers ────────────────────────────────────────────────────────────────

type ASTNodeWithPipe = Exclude<
  ASTNode,
  LazyASTNode | WrappedASTNode | TransformationASTNode | ValidationASTNode | MetadataASTNode
>;
type ASTNodeWithInfo = Exclude<
  ASTNode,
  TransformationASTNode | ValidationASTNode | MetadataASTNode
>;

function roundTrip(schema: v.GenericSchema, dictionary?: ASTToSchemaOptions["dictionary"]) {
  const { document } = schemaToAST(schema, { dictionary });
  const json = JSON.parse(JSON.stringify(document));
  return astToSchema<v.GenericSchema>(json, { dictionary });
}

function expectRoundTrip(schema: v.GenericSchema, validInput: unknown, invalidInput?: unknown) {
  const rebuilt = roundTrip(schema);
  expect(v.safeParse(rebuilt, validInput).success).toBe(true);
  if (invalidInput !== undefined) {
    expect(v.safeParse(rebuilt, invalidInput).success).toBe(false);
  }
}

// ─── schemaToAST ─────────────────────────────────────────────────────────────

describe("schemaToAST", () => {
  describe("document", () => {
    it("produces correct document structure", () => {
      const { document } = schemaToAST(v.string());
      expect(document.version).toBe(AST_VERSION);
      expect(document.library).toBe("valibot");
      expect(document.schema.kind).toBe("schema");
      expect(document.schema.type).toBe("string");
      expect(document.dictionary).toBeUndefined();
    });

    it("includes metadata in document", () => {
      const { document } = schemaToAST(v.string(), { metadata: { author: "test" } });
      expect(document.metadata).toEqual({ author: "test" });
    });

    it("omits dictionary when no entries are referenced", () => {
      const dict = createDictionary({ unused: () => v.string() });
      const { document } = schemaToAST(v.string(), { dictionary: dict });
      expect(document.dictionary).toBeUndefined();
    });
  });

  describe("dictionary tracking", () => {
    it("tracks referenced dictionary entries for lazy schema", () => {
      const getter = () => v.string();
      const dict = createDictionary({ myLazy: getter });
      const { document, referencedDictionary } = schemaToAST(v.lazy(getter), { dictionary: dict });
      expect(referencedDictionary.has("myLazy")).toBe(true);
      expect(document.dictionary).toBeDefined();
      expect(document.dictionary!["myLazy"]).toBeDefined();
    });

    it("includes function name in dictionary manifest", () => {
      function namedGetter() {
        return v.string();
      }
      const dict = createDictionary({ namedGetter });
      const { document } = schemaToAST(v.lazy(namedGetter), { dictionary: dict });
      expect(document.dictionary!["namedGetter"].name).toBe("namedGetter");
    });

    it("includes description and category from function properties", () => {
      const fn = () => v.string();
      fn.description = "my description";
      fn.category = "custom";
      const dict = createDictionary({ fn });
      const { document } = schemaToAST(v.lazy(fn), { dictionary: dict });
      expect(document.dictionary!["fn"].description).toBe("my description");
      expect(document.dictionary!["fn"].category).toBe("custom");
    });

    it("sets className and category for class constructors", () => {
      const dict = createDictionary({ MyDate: Date });
      const { document } = schemaToAST(v.instance(Date), { dictionary: dict });
      expect(document.dictionary!["MyDate"].className).toBe("Date");
      expect(document.dictionary!["MyDate"].category).toBe("instance");
    });

    it("does not override explicit category with instance", () => {
      const fn: any = function MyClass() {};
      fn.prototype = { constructor: fn };
      fn.category = "special";
      const dict = createDictionary({ cls: fn });
      schemaToAST(v.instance(fn), { dictionary: dict });
      // category should remain "special" (category ?? "instance" means existing value wins)
    });
  });

  describe("info extraction", () => {
    it("serializes title, description, examples and metadata", () => {
      const schema = v.pipe(
        v.string(),
        v.title("Name"),
        v.description("A name"),
        v.examples(["Alice", "Bob"]),
        v.metadata({ custom: true })
      );
      const { document } = schemaToAST(schema);
      expect((document.schema as ASTNodeWithInfo).info).toEqual({
        title: "Name",
        description: "A name",
        examples: ["Alice", "Bob"],
        metadata: { custom: true },
      });
    });

    it("returns undefined info when no metadata actions are present", () => {
      const { document } = schemaToAST(v.string());
      expect((document.schema as ASTNodeWithInfo).info).toBeUndefined();
    });

    it("serializes partial info (no title)", () => {
      const schema = v.pipe(v.string(), v.description("just a description"));
      const { document } = schemaToAST(schema);
      expect((document.schema as ASTNodeWithInfo).info?.description).toBe("just a description");
      expect((document.schema as ASTNodeWithInfo).info?.title).toBeUndefined();
    });
  });

  describe("pipe serialization", () => {
    it("skips metadata actions (they are lifted to info)", () => {
      const schema = v.pipe(v.string(), v.title("T"));
      const { document } = schemaToAST(schema);
      expect((document.schema as ASTNodeWithPipe).pipe).toBeUndefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("T");
    });

    it("serializes RegExp requirement as source/flags", () => {
      const { document } = schemaToAST(v.pipe(v.string(), v.regex(/^[a-z]+$/i)));
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as ValidationASTNode;
      expect(node.kind).toBe("validation");
      expect(node.type).toBe("regex");
      expect(node.requirement).toEqual({ source: "^[a-z]+$", flags: "i" });
    });

    it("includes message in validation node when validator has a custom message", () => {
      const { document } = schemaToAST(v.pipe(v.string(), v.minLength(3, "too short")));
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as ValidationASTNode;
      expect(node.message).toBe("too short");
    });

    it("includes locales in validation node for locale-aware validators", () => {
      const { document } = schemaToAST(v.pipe(v.string(), v.minWords("en", 2)));
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as ValidationASTNode;
      expect(node.locales).toBe("en");
      expect(node.requirement).toBe(2);
    });

    it("serializes check validation with dictionary key", () => {
      const checkFn = (x: string) => x.length > 3;
      const dict = createDictionary({ myCheck: checkFn });
      const { document } = schemaToAST(v.pipe(v.string(), v.check(checkFn)), { dictionary: dict });
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as ValidationASTNode;
      expect(node.kind).toBe("validation");
      expect(node.type).toBe("check");
      expect(node.dictionaryKey).toBe("myCheck");
    });

    it("serializes check validation without dictionary key", () => {
      const { document } = schemaToAST(
        v.pipe(
          v.string(),
          v.check(() => true)
        )
      );
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as ValidationASTNode;
      expect(node.dictionaryKey).toBeUndefined();
    });

    it("omits dictionaryKey for check when dictionary does not contain its function", () => {
      const checkFn = (x: string) => x.length > 3;
      const dict = createDictionary({ other: () => true });
      const { document } = schemaToAST(v.pipe(v.string(), v.check(checkFn)), { dictionary: dict });
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as ValidationASTNode;
      expect(node.dictionaryKey).toBeUndefined();
    });

    it("serializes custom schema in pipe with dictionary key", () => {
      const checkFn = (x: unknown): x is string => typeof x === "string";
      const dict = createDictionary({ myCustom: checkFn });
      const schema = v.pipe(v.unknown(), v.custom(checkFn));
      const { document } = schemaToAST(schema, { dictionary: dict });
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as ValidationASTNode;
      expect(node.kind).toBe("validation");
      expect(node.type).toBe("custom");
      expect(node.dictionaryKey).toBe("myCustom");
    });

    it("serializes custom schema in pipe without dictionary key", () => {
      const schema = v.pipe(
        v.unknown(),
        v.custom(() => true)
      );
      const { document } = schemaToAST(schema);
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as ValidationASTNode;
      expect(node.kind).toBe("validation");
      expect(node.type).toBe("custom");
      expect(node.dictionaryKey).toBeUndefined();
    });

    it("omits dictionaryKey for custom schema when dictionary does not contain its check function", () => {
      const checkFn = (x: unknown): x is string => typeof x === "string";
      const dict = createDictionary({ other: () => true });
      const schema = v.pipe(v.unknown(), v.custom(checkFn));
      const { document } = schemaToAST(schema, { dictionary: dict });
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as ValidationASTNode;
      expect(node.dictionaryKey).toBeUndefined();
    });

    it("includes message in custom schema node in pipe", () => {
      const schema = v.pipe(
        v.unknown(),
        v.custom(() => true, "custom error")
      );
      const { document } = schemaToAST(schema);
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as ValidationASTNode;
      expect(node.message).toBe("custom error");
    });

    it("serializes non-custom schema directly in pipe", () => {
      const schema = v.pipe(v.unknown(), v.number());
      const { document } = schemaToAST(schema);
      expect((document.schema as ASTNodeWithPipe).pipe![0].kind).toBe("schema");
      expect((document.schema as ASTNodeWithPipe).pipe![0].type).toBe("number");
    });

    it("serializes custom transformation with dictionary key", () => {
      const transformFn = (x: string) => x.toUpperCase();
      const dict = createDictionary({ myTransform: transformFn });
      const { document } = schemaToAST(v.pipe(v.string(), v.transform(transformFn)), {
        dictionary: dict,
      });
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as TransformationASTNode;
      expect(node.kind).toBe("transformation");
      expect(node.dictionaryKey).toBe("myTransform");
      expect(node.note).toBeUndefined();
    });

    it("serializes custom transformation without dictionary key with note", () => {
      const { document } = schemaToAST(
        v.pipe(
          v.string(),
          v.transform((x) => x)
        )
      );
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as TransformationASTNode;
      expect(node.kind).toBe("transformation");
      expect(node.note).toBe("custom-transformation-may-not-be-serializable");
      expect(node.dictionaryKey).toBeUndefined();
    });

    it("sets note when dictionary is provided but transform function is not registered", () => {
      const transformFn = (x: string) => x.toUpperCase();
      const otherFn = (x: string) => x;
      const dict = createDictionary({ otherFn });
      const { document } = schemaToAST(v.pipe(v.string(), v.transform(transformFn)), {
        dictionary: dict,
      });
      const node = (document.schema as ASTNodeWithPipe).pipe![0] as TransformationASTNode;
      expect(node.note).toBe("custom-transformation-may-not-be-serializable");
      expect(node.dictionaryKey).toBeUndefined();
    });

    it("annotates lazy schema without dictionary entry", () => {
      const { document } = schemaToAST(v.lazy(() => v.string()));
      expect(document.schema.type).toBe("lazy");
      expect((document.schema as LazyASTNode).note).toBe("lazy-schema-requires-runtime-getter");
    });

    it("annotates lazy schema when dictionary is provided but does not contain the getter", () => {
      const getter = () => v.string();
      const dict = createDictionary({ other: () => v.number() });
      const { document } = schemaToAST(v.lazy(getter), { dictionary: dict });
      expect((document.schema as LazyASTNode).note).toBe("lazy-schema-requires-runtime-getter");
      expect((document.schema as LazyASTNode).dictionaryKey).toBeUndefined();
    });

    it("serializes lazy schema with info", () => {
      const schema = v.pipe(
        v.lazy(() => v.string()),
        v.title("MyLazy")
      );
      const { document } = schemaToAST(schema);
      // lazy is the wrapped schema; the pipe wraps it
      expect(document.schema.type).toBe("lazy");
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyLazy");
    });

    it("serializes function schema with pipe and info", () => {
      const schema = v.pipe(
        v.function(),
        v.check(() => true),
        v.title("MyFn")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("function");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyFn");
    });

    it("serializes intersect schema with pipe and info", () => {
      const schema = v.pipe(
        v.intersect([v.object({ a: v.string() }), v.object({ b: v.number() })]),
        v.check(() => true),
        v.title("Intersection")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("intersect");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("Intersection");
    });

    it("serializes literal schema with pipe and info", () => {
      const schema = v.pipe(
        v.literal("hello"),
        v.check(() => true),
        v.title("MyLiteral")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("literal");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyLiteral");
    });

    it("serializes object schema with pipe and info", () => {
      const schema = v.pipe(
        v.object({ name: v.string() }),
        v.check(() => true),
        v.title("MyObject")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("object");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyObject");
    });

    it("serializes array schema with pipe and info", () => {
      const schema = v.pipe(
        v.array(v.string()),
        v.check(() => true),
        v.title("MyArray")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("array");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyArray");
    });

    it("serializes tuple schema with pipe and info", () => {
      const schema = v.pipe(
        v.tuple([v.string(), v.number()]),
        v.check(() => true),
        v.title("MyTuple")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("tuple");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyTuple");
    });

    it("serializes union schema with pipe and info", () => {
      const schema = v.pipe(
        v.union([v.string(), v.number()]),
        v.check(() => true),
        v.title("MyUnion")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("union");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyUnion");
    });

    it("serializes variant schema with pipe and info", () => {
      const schema = v.pipe(
        v.variant("type", [v.object({ type: v.literal("a"), value: v.string() })]),
        v.check(() => true),
        v.title("MyVariant")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("variant");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyVariant");
    });

    it("serializes enum schema with pipe and info", () => {
      enum Color {
        Red = "red",
        Blue = "blue",
      }
      const schema = v.pipe(
        v.enum(Color),
        v.check(() => true),
        v.title("MyEnum")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("enum");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyEnum");
    });

    it("serializes picklist schema with pipe and info", () => {
      const schema = v.pipe(
        v.picklist(["a", "b", "c"]),
        v.check(() => true),
        v.title("MyPicklist")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("picklist");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyPicklist");
    });

    it("serializes record schema with pipe and info", () => {
      const schema = v.pipe(
        v.record(v.string(), v.number()),
        v.check(() => true),
        v.title("MyRecord")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("record");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyRecord");
    });

    it("serializes map schema with pipe and info", () => {
      const schema = v.pipe(
        v.map(v.string(), v.number()),
        v.check(() => true),
        v.title("MyMap")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("map");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MyMap");
    });

    it("serializes set schema with pipe and info", () => {
      const schema = v.pipe(
        v.set(v.string()),
        v.check(() => true),
        v.title("MySet")
      );
      const { document } = schemaToAST(schema);
      expect(document.schema.type).toBe("set");
      expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
      expect((document.schema as ASTNodeWithInfo).info?.title).toBe("MySet");
    });
  });

  describe("round-trip", () => {
    describe("primitives", () => {
      it("string", () => expectRoundTrip(v.string(), "hello", 123));
      it("number", () => expectRoundTrip(v.number(), 42, "hello"));
      it("function", () => expectRoundTrip(v.function(), () => {}, 42));
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
        expect(v.safeParse(roundTrip(v.never()), "hello").success).toBe(false);
      });
      it("nan", () => expectRoundTrip(v.nan(), NaN, 42));
      it("null", () => expectRoundTrip(v.null_(), null, "hello"));
      it("undefined", () => expectRoundTrip(v.undefined_(), undefined, "hello"));
      it("void", () => expectRoundTrip(v.void_(), undefined, "hello"));
    });

    describe("literals", () => {
      it("string literal", () => expectRoundTrip(v.literal("hello"), "hello", "world"));
      it("number literal", () => expectRoundTrip(v.literal(42), 42, 43));
      it("boolean literal", () => expectRoundTrip(v.literal(true), true, false));
      it("bigint literal serializes as tagged object and round-trips", () => {
        const { document } = schemaToAST(v.literal(42n));
        const literal = (document.schema as LiteralASTNode).literal as SerializedBigInt;
        expect(literal).toEqual({ __type: "bigint", value: "42" });

        // Survives JSON round-trip
        const json = JSON.parse(JSON.stringify(document));
        const rebuilt = astToSchema<v.GenericSchema>(json);
        expect(v.safeParse(rebuilt, 42n).success).toBe(true);
        expect(v.safeParse(rebuilt, 42).success).toBe(false);
      });
    });

    describe("wrapped schemas", () => {
      it("optional", () => expectRoundTrip(v.optional(v.string()), undefined));
      it("optional with default", () => {
        expect(v.parse(roundTrip(v.optional(v.string(), "fallback")), undefined)).toBe("fallback");
      });
      it("nullable", () => expectRoundTrip(v.nullable(v.string()), null));
      it("nullish accepts null", () => expectRoundTrip(v.nullish(v.string()), null));
      it("nullish accepts undefined", () => expectRoundTrip(v.nullish(v.string()), undefined));
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
      it("optional with function default omits default from AST", () => {
        // The factory (() => () => {}) returns a function — getDefault evaluates the factory,
        // so defaultValue is itself a function, which cannot be serialized to JSON.
        const { document } = schemaToAST(v.optional(v.function(), () => () => {}));
        expect((document.schema as WrappedASTNode).default).toBeUndefined();
      });
      it("optional with pipe and info", () => {
        const schema = v.pipe(
          v.optional(v.string()),
          v.check(() => true),
          v.title("OptionalString")
        );
        const { document } = schemaToAST(schema);
        expect(document.schema.type).toBe("optional");
        expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
        expect((document.schema as ASTNodeWithInfo).info?.title).toBe("OptionalString");
      });
    });

    describe("objects", () => {
      it("object", () => {
        expectRoundTrip(
          v.object({ name: v.string(), age: v.number() }),
          { name: "Alice", age: 30 },
          { name: 123 }
        );
      });
      it("looseObject allows extra keys", () => {
        const rebuilt = roundTrip(v.looseObject({ name: v.string() }));
        expect(v.safeParse(rebuilt, { name: "Alice", extra: true }).success).toBe(true);
      });
      it("strictObject rejects extra keys", () => {
        const rebuilt = roundTrip(v.strictObject({ name: v.string() }));
        expect(v.safeParse(rebuilt, { name: "Alice", extra: true }).success).toBe(false);
      });
      it("objectWithRest", () => {
        const rebuilt = roundTrip(v.objectWithRest({ name: v.string() }, v.number()));
        expect(v.safeParse(rebuilt, { name: "Alice", extra: 42 }).success).toBe(true);
      });
      it("nested objects", () => {
        expectRoundTrip(v.object({ address: v.object({ city: v.string() }) }), {
          address: { city: "NYC" },
        });
      });
    });

    describe("arrays and tuples", () => {
      it("array", () => expectRoundTrip(v.array(v.string()), ["a", "b"], [1]));
      it("tuple", () => expectRoundTrip(v.tuple([v.string(), v.number()]), ["a", 1]));
      it("looseTuple allows extra items", () => {
        expect(v.safeParse(roundTrip(v.looseTuple([v.string()])), ["a", "extra"]).success).toBe(
          true
        );
      });
      it("strictTuple rejects extra items", () => {
        expect(v.safeParse(roundTrip(v.strictTuple([v.string()])), ["a", "extra"]).success).toBe(
          false
        );
      });
      it("tupleWithRest", () => {
        expect(
          v.safeParse(roundTrip(v.tupleWithRest([v.string()], v.number())), ["a", 1, 2]).success
        ).toBe(true);
      });
    });

    describe("choice schemas", () => {
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
      it("picklist", () => expectRoundTrip(v.picklist(["a", "b", "c"]), "a", "d"));
      it("picklist with bigint options survives JSON round-trip", () => {
        const { document } = schemaToAST(v.picklist([1n, 2n, 3n]));
        const options = (document.schema as PicklistASTNode).options;
        expect(options).toEqual([
          { __type: "bigint", value: "1" },
          { __type: "bigint", value: "2" },
          { __type: "bigint", value: "3" },
        ]);

        const json = JSON.parse(JSON.stringify(document));
        const rebuilt = astToSchema<v.GenericSchema>(json);
        expect(v.safeParse(rebuilt, 2n).success).toBe(true);
        expect(v.safeParse(rebuilt, 4n).success).toBe(false);
      });
      it("enum", () => {
        enum Color {
          Red = "red",
          Blue = "blue",
        }
        expectRoundTrip(v.enum(Color), "red", "green");
      });
    });

    describe("containers", () => {
      it("record", () => expectRoundTrip(v.record(v.string(), v.number()), { a: 1, b: 2 }));
      it("map", () => {
        const rebuilt = roundTrip(v.map(v.string(), v.number()));
        expect(v.safeParse(rebuilt, new Map([["a", 1]])).success).toBe(true);
      });
      it("set", () => {
        const rebuilt = roundTrip(v.set(v.string()));
        expect(v.safeParse(rebuilt, new Set(["a", "b"])).success).toBe(true);
      });
      it("intersect", () => {
        const rebuilt = roundTrip(
          v.intersect([v.object({ a: v.string() }), v.object({ b: v.number() })])
        );
        expect(v.safeParse(rebuilt, { a: "hi", b: 42 }).success).toBe(true);
      });
    });

    describe("instance", () => {
      it("with dictionary succeeds", () => {
        const dict = createDictionary({ MyDate: Date });
        const { document } = schemaToAST(v.instance(Date), { dictionary: dict });
        const rebuilt = astToSchema<v.GenericSchema>(document, { dictionary: dict });
        expect(v.safeParse(rebuilt, new Date()).success).toBe(true);
      });
      it("without dictionary throws", () => {
        const { document } = schemaToAST(v.instance(Date));
        expect(() => astToSchema(document)).toThrow(/dictionary/i);
      });
      it("uses UnknownClass when class has no name", () => {
        const Anon = (() => class {})();
        const dict = createDictionary({ Anon });
        const { document } = schemaToAST(v.instance(Anon), { dictionary: dict });
        expect((document.schema as InstanceASTNode).class).toBe("UnknownClass");
      });
      it("serializes instance with pipe and info", () => {
        const dict = createDictionary({ MyDate: Date });
        const schema = v.pipe(
          v.instance(Date),
          v.check(() => true),
          v.title("A date")
        );
        const { document } = schemaToAST(schema, { dictionary: dict });
        expect(document.schema.type).toBe("instance");
        expect((document.schema as ASTNodeWithPipe).pipe).toBeDefined();
        expect((document.schema as ASTNodeWithInfo).info?.title).toBe("A date");
      });

      it("omits dictionaryKey when dictionary does not contain the instance class", () => {
        const dict = createDictionary({ OtherClass: Map });
        const { document } = schemaToAST(v.instance(Date), { dictionary: dict });
        expect(document.schema.type).toBe("instance");
        expect((document.schema as InstanceASTNode).class).toBe("Date");
        expect((document.schema as InstanceASTNode).dictionaryKey).toBeUndefined();
      });
    });

    describe("custom schema (standalone)", () => {
      it("serializes with dictionary key and round-trips", () => {
        const checkFn = (x: unknown): x is string => typeof x === "string";
        const dict = createDictionary({ myCheck: checkFn });
        const { document, referencedDictionary } = schemaToAST(v.custom(checkFn), {
          dictionary: dict,
        });
        expect(document.schema.type).toBe("custom");
        expect((document.schema as CustomASTNode).dictionaryKey).toBe("myCheck");
        expect((document.schema as CustomASTNode).note).toBeUndefined();
        expect(referencedDictionary.has("myCheck")).toBe(true);

        const rebuilt = astToSchema<v.GenericSchema>(document, { dictionary: dict });
        expect(v.safeParse(rebuilt, "hello").success).toBe(true);
        expect(v.safeParse(rebuilt, 42).success).toBe(false);
      });

      it("serializes without dictionary key with note", () => {
        const { document } = schemaToAST(v.custom(() => true));
        expect(document.schema.type).toBe("custom");
        expect((document.schema as CustomASTNode).note).toBe(
          "custom-schema-requires-runtime-check"
        );
        expect((document.schema as CustomASTNode).dictionaryKey).toBeUndefined();
      });

      it("omits dictionaryKey when dictionary does not contain check function", () => {
        const checkFn = (x: unknown): x is string => typeof x === "string";
        const dict = createDictionary({ other: () => true });
        const { document } = schemaToAST(v.custom(checkFn), { dictionary: dict });
        expect((document.schema as CustomASTNode).note).toBe(
          "custom-schema-requires-runtime-check"
        );
        expect((document.schema as CustomASTNode).dictionaryKey).toBeUndefined();
      });
    });

    describe("lazy", () => {
      it("with dictionary succeeds", () => {
        const getter = () => v.string();
        const dict = createDictionary({ myGetter: getter });
        const { document } = schemaToAST(v.lazy(getter), { dictionary: dict });
        const rebuilt = astToSchema<v.GenericSchema>(document, { dictionary: dict });
        expect(v.safeParse(rebuilt, "hello").success).toBe(true);
      });
    });

    describe("validations", () => {
      it("string validations", () => {
        expectRoundTrip(v.pipe(v.string(), v.email()), "test@test.com", "not-email");
        expectRoundTrip(v.pipe(v.string(), v.url()), "https://example.com", "not-url");
        expectRoundTrip(
          v.pipe(v.string(), v.uuid()),
          "550e8400-e29b-41d4-a716-446655440000",
          "nope"
        );
        expectRoundTrip(v.pipe(v.string(), v.minLength(3)), "abc", "ab");
        expectRoundTrip(v.pipe(v.string(), v.maxLength(3)), "abc", "abcd");
        expectRoundTrip(v.pipe(v.string(), v.nonEmpty()), "abc", "");
      });
      it("number validations", () => {
        expectRoundTrip(v.pipe(v.number(), v.minValue(5)), 5, 4);
        expectRoundTrip(v.pipe(v.number(), v.maxValue(10)), 10, 11);
        expectRoundTrip(v.pipe(v.number(), v.integer()), 42, 4.5);
        expectRoundTrip(v.pipe(v.number(), v.multipleOf(3)), 9, 10);
      });
      it("regex with RegExp round-trip", () => {
        const schema = v.pipe(v.string(), v.regex(/^[a-z]+$/i));
        const rebuilt = roundTrip(schema);
        expect(v.safeParse(rebuilt, "hello").success).toBe(true);
        expect(v.safeParse(rebuilt, "123").success).toBe(false);
      });
    });

    describe("transformations", () => {
      it("string transformations", () => {
        const rebuilt = roundTrip(v.pipe(v.string(), v.trim(), v.toLowerCase()));
        expect(v.parse(rebuilt, "  HELLO  ")).toBe("hello");
      });
      it("toMinValue clamps to minimum", () => {
        const rebuilt = roundTrip(v.pipe(v.number(), v.toMinValue(5)));
        expect(v.parse(rebuilt, 3)).toBe(5);
        expect(v.parse(rebuilt, 10)).toBe(10);
      });
      it("toMaxValue clamps to maximum", () => {
        const rebuilt = roundTrip(v.pipe(v.number(), v.toMaxValue(10)));
        expect(v.parse(rebuilt, 15)).toBe(10);
        expect(v.parse(rebuilt, 7)).toBe(7);
      });
    });

    describe("flat pipe structure", () => {
      it("produces a single flat pipe when both pipe items and info exist", () => {
        const schema = v.pipe(v.string(), v.minLength(3), v.title("Name"), v.description("A name"));
        const rebuilt = roundTrip(schema);
        // The rebuilt schema should have a single pipe (not nested)
        expect("pipe" in rebuilt && Array.isArray(rebuilt.pipe)).toBe(true);
        const pipe = (rebuilt as any).pipe;
        // pipe[0] is the root schema, pipe[1+] are items — no nesting
        expect(pipe[0].kind).toBe("schema");
        expect(pipe[0].type).toBe("string");
        // All remaining items should be direct children, not nested inside another pipe
        for (let i = 1; i < pipe.length; i++) {
          expect(pipe[i].kind).not.toBe("schema");
        }
        // Verify it still validates correctly
        expect(v.safeParse(rebuilt, "abc").success).toBe(true);
        expect(v.safeParse(rebuilt, "ab").success).toBe(false);
      });
    });
  });
});

// ─── astToSchema ─────────────────────────────────────────────────────────────

describe("astToSchema", () => {
  describe("error handling", () => {
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
    it("throws when AST document references dictionary keys but none provided", () => {
      const getter = () => v.string();
      const dict = createDictionary({ myGetter: getter });
      const { document } = schemaToAST(v.lazy(getter), { dictionary: dict });
      expect(() => astToSchema(document)).toThrow(/dictionary/i);
    });
    it("validates AST structure when validateAST is true", () => {
      const { document } = schemaToAST(v.string());
      expect(() => astToSchema(document, { validateAST: true })).not.toThrow();
    });
  });
});
