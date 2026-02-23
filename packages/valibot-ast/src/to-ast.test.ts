import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { schemaToAST } from "./to-ast.ts";

// Test enum for enum schema tests
enum TestEnum {
  Value1 = "value1",
  Value2 = "value2",
  Value3 = 3,
}

// Test class for instance schema tests
class TestClass {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

describe("Schema to AST", () => {
  describe("document structure", () => {
    test("produces correct ASTDocument shape for a plain schema", () => {
      const result = schemaToAST(v.string());
      expect(result.version).toBe("1.0.0");
      expect(result.library).toBe("valibot");
      expect(result.schema).toBeDefined();
      expect(result.customTransformations).toBeUndefined();
      expect(result.customValidations).toBeUndefined();
      expect(result.customInstances).toBeUndefined();
      expect(result.customLazy).toBeUndefined();
      expect(result.customClosures).toBeUndefined();
      expect(result.metadata).toBeUndefined();
    });

    test("respects custom library option", () => {
      const result = schemaToAST(v.string(), { library: "zod" });
      expect(result.library).toBe("zod");
    });

    test("passes through document-level metadata", () => {
      const meta = { source: "test", version: 1 };
      const result = schemaToAST(v.string(), { metadata: meta });
      expect(result.metadata).toEqual(meta);
    });
  });

  describe("primitive schemas", () => {
    test.each([
      ["string", v.string()],
      ["number", v.number()],
      ["boolean", v.boolean()],
      ["bigint", v.bigint()],
      ["date", v.date()],
      ["any", v.any()],
      ["unknown", v.unknown()],
      ["never", v.never()],
      ["nan", v.nan()],
      ["null", v.null_()],
      ["undefined", v.undefined_()],
      ["void", v.void_()],
    ] as const)("%s schema produces kind:schema type:%s", (type, schema) => {
      const result = schemaToAST(schema);
      expect(result.schema.kind).toBe("schema");
      expect(result.schema.type).toBe(type);
    });
  });

  describe("literal schema", () => {
    test("string literal", () => {
      const result = schemaToAST(v.literal("hello"));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "literal",
        literal: "hello",
      });
    });

    test("number literal", () => {
      const result = schemaToAST(v.literal(42));
      expect(result.schema).toMatchObject({ kind: "schema", type: "literal", literal: 42 });
    });

    test("bigint literal", () => {
      const result = schemaToAST(v.literal(42n));
      expect(result.schema).toMatchObject({ kind: "schema", type: "literal", literal: 42n });
    });

    test("boolean literal", () => {
      const result = schemaToAST(v.literal(true));
      expect(result.schema).toMatchObject({ kind: "schema", type: "literal", literal: true });
    });
  });

  describe("wrapped schemas", () => {
    test("optional wraps the inner schema", () => {
      const result = schemaToAST(v.optional(v.string()));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "optional",
        wrapped: { kind: "schema", type: "string" },
      });
    });

    test("optional with default value preserves the default", () => {
      const result = schemaToAST(v.optional(v.string(), "default-value"));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "optional",
        default: "default-value",
        wrapped: { kind: "schema", type: "string" },
      });
    });

    test("nullable wraps the inner schema", () => {
      const result = schemaToAST(v.nullable(v.string()));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "nullable",
        wrapped: { kind: "schema", type: "string" },
      });
    });

    test("nullish wraps the inner schema", () => {
      const result = schemaToAST(v.nullish(v.string()));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "nullish",
        wrapped: { kind: "schema", type: "string" },
      });
    });

    test("nonOptional wraps the inner schema", () => {
      const result = schemaToAST(v.nonOptional(v.optional(v.string())));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "non_optional",
        wrapped: { kind: "schema", type: "optional" },
      });
    });

    test("nonNullable wraps the inner schema", () => {
      const result = schemaToAST(v.nonNullable(v.nullable(v.string())));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "non_nullable",
        wrapped: { kind: "schema", type: "nullable" },
      });
    });

    test("nonNullish wraps the inner schema", () => {
      const result = schemaToAST(v.nonNullish(v.nullish(v.string())));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "non_nullish",
        wrapped: { kind: "schema", type: "nullish" },
      });
    });
  });

  describe("object schemas", () => {
    test("basic object with entries", () => {
      const result = schemaToAST(v.object({ name: v.string(), age: v.number() }));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "object",
        entries: {
          name: { kind: "schema", type: "string" },
          age: { kind: "schema", type: "number" },
        },
      });
    });

    test("empty object has empty entries", () => {
      const result = schemaToAST(v.object({}));
      expect(result.schema).toMatchObject({ kind: "schema", type: "object", entries: {} });
    });

    test("looseObject produces type loose_object", () => {
      const result = schemaToAST(v.looseObject({ key: v.string() }));
      expect(result.schema).toMatchObject({ kind: "schema", type: "loose_object" });
    });

    test("strictObject produces type strict_object", () => {
      const result = schemaToAST(v.strictObject({ key: v.string() }));
      expect(result.schema).toMatchObject({ kind: "schema", type: "strict_object" });
    });

    test("objectWithRest includes rest node", () => {
      const result = schemaToAST(v.objectWithRest({ key: v.string() }, v.number()));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "object_with_rest",
        rest: { kind: "schema", type: "number" },
      });
    });
  });

  describe("array schema", () => {
    test("array includes item node", () => {
      const result = schemaToAST(v.array(v.string()));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "array",
        item: { kind: "schema", type: "string" },
      });
    });
  });

  describe("tuple schemas", () => {
    test("basic tuple with ordered items", () => {
      const result = schemaToAST(v.tuple([v.string(), v.number()]));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "tuple",
        items: [
          { kind: "schema", type: "string" },
          { kind: "schema", type: "number" },
        ],
      });
    });

    test("looseTuple produces type loose_tuple", () => {
      const result = schemaToAST(v.looseTuple([v.string()]));
      expect(result.schema).toMatchObject({ kind: "schema", type: "loose_tuple" });
    });

    test("strictTuple produces type strict_tuple", () => {
      const result = schemaToAST(v.strictTuple([v.string()]));
      expect(result.schema).toMatchObject({ kind: "schema", type: "strict_tuple" });
    });

    test("tupleWithRest includes rest node", () => {
      const result = schemaToAST(v.tupleWithRest([v.string()], v.number()));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "tuple_with_rest",
        rest: { kind: "schema", type: "number" },
      });
    });
  });

  describe("union schema", () => {
    test("union of primitives produces options array", () => {
      const result = schemaToAST(v.union([v.string(), v.number()]));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "union",
        options: [
          { kind: "schema", type: "string" },
          { kind: "schema", type: "number" },
        ],
      });
    });
  });

  describe("variant schema", () => {
    test("discriminated union captures key and options", () => {
      const result = schemaToAST(
        v.variant("type", [
          v.object({ type: v.literal("a"), value: v.string() }),
          v.object({ type: v.literal("b"), count: v.number() }),
        ])
      );
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "variant",
        key: "type",
        options: [
          { kind: "schema", type: "object" },
          { kind: "schema", type: "object" },
        ],
      });
    });
  });

  describe("enum schema", () => {
    test("native enum captures the enum object", () => {
      const result = schemaToAST(v.enum(TestEnum));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "enum",
        enum: expect.objectContaining({ Value1: "value1", Value2: "value2", Value3: 3 }),
      });
    });
  });

  describe("picklist schema", () => {
    test("picklist captures the options array", () => {
      const result = schemaToAST(v.picklist(["a", "b", "c"]));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "picklist",
        options: ["a", "b", "c"],
      });
    });
  });

  describe("record schema", () => {
    test("record captures key and value nodes", () => {
      const result = schemaToAST(v.record(v.string(), v.number()));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "record",
        key: { kind: "schema", type: "string" },
        value: { kind: "schema", type: "number" },
      });
    });
  });

  describe("map schema", () => {
    test("map captures key and value nodes", () => {
      const result = schemaToAST(v.map(v.string(), v.number()));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "map",
        key: { kind: "schema", type: "string" },
        value: { kind: "schema", type: "number" },
      });
    });
  });

  describe("set schema", () => {
    test("set captures item node", () => {
      const result = schemaToAST(v.set(v.string()));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "set",
        item: { kind: "schema", type: "string" },
      });
    });
  });

  describe("intersect schema", () => {
    test("intersect of objects produces options array", () => {
      const result = schemaToAST(
        v.intersect([v.object({ a: v.string() }), v.object({ b: v.number() })])
      );
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "intersect",
        options: [
          { kind: "schema", type: "object" },
          { kind: "schema", type: "object" },
        ],
      });
    });
  });

  describe("instance schema", () => {
    test("instance without dictionary captures class name only", () => {
      const result = schemaToAST(v.instance(Date));
      expect(result.schema).toMatchObject({ kind: "schema", type: "instance", class: "Date" });
      expect((result.schema as any).customKey).toBeUndefined();
    });

    test("instance with matching dictionary entry sets customKey", () => {
      const dict = new Map<string, new (...args: any[]) => any>([["myDate", Date]]);
      const result = schemaToAST(v.instance(Date), { instanceDictionary: dict });
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "instance",
        class: "Date",
        customKey: "myDate",
      });
    });

    test("instance with non-matching dictionary entry has no customKey", () => {
      // Forces findKeyByValue to iterate past a non-matching entry and return undefined
      const dict = new Map<string, new (...args: any[]) => any>([["myClass", TestClass]]);
      const result = schemaToAST(v.instance(Date), { instanceDictionary: dict });
      expect((result.schema as any).customKey).toBeUndefined();
    });

    test("instance dictionary entry appears in customInstances metadata", () => {
      const dict = new Map<string, new (...args: any[]) => any>([["myClass", TestClass]]);
      const result = schemaToAST(v.instance(TestClass), { instanceDictionary: dict });
      expect(result.customInstances).toMatchObject({
        myClass: { className: "TestClass" },
      });
    });
  });

  describe("lazy schema", () => {
    test("lazy without dictionary sets note and no customKey", () => {
      const getter = () => v.string();
      const result = schemaToAST(v.lazy(getter));
      expect(result.schema).toMatchObject({
        kind: "schema",
        type: "lazy",
        note: "lazy-schema-requires-runtime-getter",
      });
      expect((result.schema as any).customKey).toBeUndefined();
    });

    test("lazy with matching dictionary entry sets customKey and clears note", () => {
      const getter = () => v.string();
      const dict = new Map([["myGetter", getter]]);
      const result = schemaToAST(v.lazy(getter), { lazyDictionary: dict });
      expect(result.schema).toMatchObject({ kind: "schema", type: "lazy", customKey: "myGetter" });
      expect((result.schema as any).note).toBeUndefined();
    });

    test("lazyDictionary plain getter appears in customLazy metadata", () => {
      const getter = () => v.string();
      const dict = new Map([["myLazy", getter]]);
      schemaToAST(v.lazy(getter), { lazyDictionary: dict });
      const result = schemaToAST(v.lazy(getter), { lazyDictionary: dict });
      expect(result.customLazy).toMatchObject({
        myLazy: { type: "unknown" },
      });
    });

    test("lazyDictionary annotated getter includes description in customLazy metadata", () => {
      const getter = Object.assign(() => v.string(), {
        description: "Recursive string schema",
        type: "recursive",
      });
      const dict = new Map([["annotated", getter]]);
      const result = schemaToAST(v.lazy(getter), { lazyDictionary: dict });
      expect(result.customLazy).toMatchObject({
        annotated: { description: "Recursive string schema", type: "recursive" },
      });
    });

    test("lazyDictionary annotated getter with description but no type falls back to unknown", () => {
      const getter = Object.assign(() => v.string(), { description: "No type property" });
      const dict = new Map([["getter", getter]]);
      const result = schemaToAST(v.lazy(getter), { lazyDictionary: dict });
      expect(result.customLazy?.getter).toMatchObject({
        description: "No type property",
        type: "unknown",
      });
    });
  });

  describe("function schema", () => {
    test("function schema produces kind:schema type:function", () => {
      const result = schemaToAST(v.function_());
      expect(result.schema).toMatchObject({ kind: "schema", type: "function" });
    });
  });

  describe("schema info", () => {
    test("schema with no metadata has undefined info", () => {
      const result = schemaToAST(v.string());
      expect((result.schema as any).info).toBeUndefined();
    });

    test("title action lifts title into info", () => {
      const result = schemaToAST(v.pipe(v.string(), v.title("My Title")));
      expect((result.schema as any).info).toMatchObject({ title: "My Title" });
    });

    test("description action lifts description into info", () => {
      const result = schemaToAST(v.pipe(v.string(), v.description("My description")));
      expect((result.schema as any).info).toMatchObject({ description: "My description" });
    });

    test("examples action lifts examples into info", () => {
      const result = schemaToAST(v.pipe(v.string(), v.examples(["example1", "example2"])));
      expect((result.schema as any).info).toMatchObject({ examples: ["example1", "example2"] });
    });

    test("metadata action lifts custom metadata into info", () => {
      const result = schemaToAST(v.pipe(v.string(), v.metadata({ custom: "value" })));
      expect((result.schema as any).info).toMatchObject({ metadata: { custom: "value" } });
    });

    test("empty metadata object produces undefined info", () => {
      const result = schemaToAST(v.pipe(v.string(), v.metadata({} as any)));
      expect((result.schema as any).info).toBeUndefined();
    });
  });

  describe("pipe extraction", () => {
    test("schema without pipe has undefined pipe field", () => {
      const result = schemaToAST(v.string());
      expect((result.schema as any).pipe).toBeUndefined();
    });

    test("pipe with only metadata actions produces undefined pipe field", () => {
      const result = schemaToAST(v.pipe(v.string(), v.title("Title")));
      expect((result.schema as any).pipe).toBeUndefined();
    });

    test("email validation action appears as validation node", () => {
      const result = schemaToAST(v.pipe(v.string(), v.email()));
      const schema = result.schema as any;
      expect(schema.pipe).toHaveLength(1);
      expect(schema.pipe[0]).toMatchObject({ kind: "validation", type: "email" });
    });

    test("minLength validation action captures requirement value", () => {
      const result = schemaToAST(v.pipe(v.string(), v.minLength(3)));
      const schema = result.schema as any;
      expect(schema.pipe[0]).toMatchObject({
        kind: "validation",
        type: "min_length",
        requirement: 3,
      });
    });

    test("trim transformation action appears as transformation node", () => {
      const result = schemaToAST(v.pipe(v.string(), v.trim()));
      const schema = result.schema as any;
      expect(schema.pipe[0]).toMatchObject({ kind: "transformation", type: "trim" });
    });

    test("toLowerCase transformation action appears as transformation node", () => {
      const result = schemaToAST(v.pipe(v.string(), v.toLowerCase()));
      const schema = result.schema as any;
      expect(schema.pipe[0]).toMatchObject({ kind: "transformation", type: "to_lower_case" });
    });

    test("multiple actions all appear in pipe array", () => {
      const result = schemaToAST(v.pipe(v.string(), v.trim(), v.email()));
      const schema = result.schema as any;
      expect(schema.pipe).toHaveLength(2);
      expect(schema.pipe[0]).toMatchObject({ kind: "transformation", type: "trim" });
      expect(schema.pipe[1]).toMatchObject({ kind: "validation", type: "email" });
    });

    describe("custom transform(fn)", () => {
      test("transform without dictionary sets serialization warning note", () => {
        const fn = (s: string) => s.toUpperCase();
        const result = schemaToAST(v.pipe(v.string(), v.transform(fn)));
        const schema = result.schema as any;
        expect(schema.pipe[0]).toMatchObject({
          kind: "transformation",
          type: "transform",
          note: "custom-transformation-may-not-be-serializable",
        });
        expect(schema.pipe[0].customKey).toBeUndefined();
      });

      test("transform with transformationDictionary match sets customKey and clears note", () => {
        const fn = (s: string) => s.toUpperCase();
        const dict = new Map([["toUpper", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.transform(fn)), {
          transformationDictionary: dict,
        });
        const schema = result.schema as any;
        expect(schema.pipe[0]).toMatchObject({
          kind: "transformation",
          type: "transform",
          customKey: "toUpper",
        });
        expect(schema.pipe[0].note).toBeUndefined();
      });

      test("transform with closureDictionary match sets customKey", () => {
        const fn = (s: string) => s.toUpperCase();
        const dict = new Map([["toUpper", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.transform(fn)), {
          closureDictionary: dict,
        });
        const schema = result.schema as any;
        expect(schema.pipe[0]).toMatchObject({
          kind: "transformation",
          type: "transform",
          customKey: "toUpper",
        });
      });
    });

    describe("check(fn) validation", () => {
      test("check without dictionary produces no customKey", () => {
        const fn = (s: string) => s.length > 0;
        const result = schemaToAST(v.pipe(v.string(), v.check(fn)));
        const schema = result.schema as any;
        expect(schema.pipe[0]).toMatchObject({ kind: "validation", type: "check" });
        expect(schema.pipe[0].customKey).toBeUndefined();
      });

      test("check with validationDictionary match sets customKey", () => {
        const fn = (s: string) => s.length > 0;
        const dict = new Map([["nonEmpty", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.check(fn)), {
          validationDictionary: dict,
        });
        const schema = result.schema as any;
        expect(schema.pipe[0]).toMatchObject({
          kind: "validation",
          type: "check",
          customKey: "nonEmpty",
        });
      });

      test("check with closureDictionary match sets customKey", () => {
        const fn = (s: string) => s.length > 0;
        const dict = new Map([["nonEmpty", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.check(fn)), {
          closureDictionary: dict,
        });
        const schema = result.schema as any;
        expect(schema.pipe[0]).toMatchObject({
          kind: "validation",
          type: "check",
          customKey: "nonEmpty",
        });
      });
    });

    describe("custom() schema in pipe", () => {
      test("custom() without dictionary produces validation node with no customKey", () => {
        const fn = (s: unknown): boolean => typeof s === "string" && s.length > 0;
        const result = schemaToAST(v.pipe(v.string(), v.custom(fn) as any));
        const schema = result.schema as any;
        expect(schema.pipe[0]).toMatchObject({ kind: "validation", type: "custom" });
        expect(schema.pipe[0].customKey).toBeUndefined();
      });

      test("custom() with validationDictionary match sets customKey", () => {
        const fn = (s: unknown): boolean => typeof s === "string" && s.length > 0;
        const dict = new Map([["myCustom", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.custom(fn) as any), {
          validationDictionary: dict,
        });
        const schema = result.schema as any;
        expect(schema.pipe[0]).toMatchObject({
          kind: "validation",
          type: "custom",
          customKey: "myCustom",
        });
      });
    });

    describe("non-custom schema in pipe", () => {
      test("schema item in pipe is recursed and produces a schema node", () => {
        // Manually inject a non-custom schema into the pipe at index 1 to cover this branch
        const str = v.string();
        const obj = v.object({ name: v.string() });
        const mockSchema = { ...str, pipe: [str, obj] } as any;
        const result = schemaToAST(mockSchema);
        const schema = result.schema as any;
        expect(schema.pipe).toHaveLength(1);
        expect(schema.pipe[0]).toMatchObject({ kind: "schema", type: "object" });
      });
    });

    describe("unexpected pipe item kind", () => {
      test("throws for pipe items with unknown kind", () => {
        const str = v.string();
        const unknownItem = { kind: "weird", type: "foo", async: false };
        const mockSchema = { ...str, pipe: [str, unknownItem] } as any;
        expect(() => schemaToAST(mockSchema)).toThrow("Unexpected pipe item kind");
      });
    });
  });

  describe("custom dictionaries metadata in document", () => {
    describe("transformationDictionary", () => {
      test("plain function produces name and type:unknown entry", () => {
        function myTransform(s: string) {
          return s;
        }
        const dict = new Map([["myTransform", myTransform]]);
        const result = schemaToAST(v.pipe(v.string(), v.transform(myTransform)), {
          transformationDictionary: dict,
        });
        expect(result.customTransformations).toMatchObject({
          myTransform: { name: "myTransform", type: "unknown" },
        });
      });

      test("annotated function with description includes description and type", () => {
        const myTransform = Object.assign((s: string) => s, {
          description: "My transform description",
          type: "custom-transform",
        });
        const dict = new Map([["annotated", myTransform]]);
        const result = schemaToAST(v.pipe(v.string(), v.transform(myTransform)), {
          transformationDictionary: dict,
        });
        expect(result.customTransformations).toMatchObject({
          annotated: { description: "My transform description", type: "custom-transform" },
        });
      });

      test("annotated function with description but no type falls back to unknown", () => {
        const fn = Object.assign((s: string) => s, { description: "No type property" });
        const dict = new Map([["fn", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.transform(fn)), {
          transformationDictionary: dict,
        });
        expect(result.customTransformations?.fn).toMatchObject({
          description: "No type property",
          type: "unknown",
        });
      });
    });

    describe("validationDictionary", () => {
      test("plain function produces name and type:unknown entry", () => {
        const fn = (s: string) => s.length > 0;
        const dict = new Map([["myValidation", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.check(fn)), {
          validationDictionary: dict,
        });
        expect(result.customValidations).toMatchObject({
          myValidation: { type: "unknown" },
        });
      });

      test("annotated function includes description and type", () => {
        const fn = Object.assign((s: string) => s.length > 0, {
          description: "Validate non-empty",
          type: "string-validation",
        });
        const dict = new Map([["annotated", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.check(fn)), {
          validationDictionary: dict,
        });
        expect(result.customValidations).toMatchObject({
          annotated: { description: "Validate non-empty", type: "string-validation" },
        });
      });

      test("annotated function with description but no type falls back to unknown", () => {
        const fn = Object.assign((s: string) => s.length > 0, { description: "No type property" });
        const dict = new Map([["fn", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.check(fn)), {
          validationDictionary: dict,
        });
        expect(result.customValidations?.fn).toMatchObject({
          description: "No type property",
          type: "unknown",
        });
      });
    });

    describe("closureDictionary", () => {
      test("plain closure produces name and type:unknown entry", () => {
        const fn = (s: string) => s.toUpperCase();
        const dict = new Map([["myClosure", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.transform(fn)), {
          closureDictionary: dict,
        });
        expect(result.customClosures).toMatchObject({
          myClosure: { type: "unknown" },
        });
      });

      test("closure with description and context captures full metadata", () => {
        const fn = Object.assign((s: string) => s.toUpperCase(), {
          description: "Uppercase transform",
          type: "transformation",
          context: { case: "upper" },
        });
        const dict = new Map([["annotated", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.transform(fn)), {
          closureDictionary: dict,
        });
        expect(result.customClosures).toMatchObject({
          annotated: {
            description: "Uppercase transform",
            type: "transformation",
            context: { case: "upper" },
          },
        });
      });

      test("closure with only context (no description) still enters annotated branch", () => {
        const fn = Object.assign((s: string) => s.toUpperCase(), {
          context: { case: "upper" },
        });
        const dict = new Map([["contextOnly", fn]]);
        const result = schemaToAST(v.pipe(v.string(), v.transform(fn)), {
          closureDictionary: dict,
        });
        expect(result.customClosures).toMatchObject({
          contextOnly: { context: { case: "upper" } },
        });
      });
    });
  });

  describe("pipe guard: pipeItems length <= 1", () => {
    test("schema with pipe of only the root item produces undefined pipe field", () => {
      const str = v.string();
      // Manually construct a schema that has hasPipe=true but only 1 item (no actions)
      const mockSchema = { ...str, pipe: [str] } as any;
      const result = schemaToAST(mockSchema);
      expect((result.schema as any).pipe).toBeUndefined();
    });
  });
});
