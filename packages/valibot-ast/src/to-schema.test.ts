import { describe, test, expect } from "vitest";
import * as v from "valibot";

import type { ASTDocument, ASTNode } from "./types.ts";
import { ASTDocumentSchema } from "./schema.ts";
import { astToSchema } from "./to-schema.ts";
import { astToSchemaAsync } from "./to-schema-async.ts";

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

enum TestEnum {
  A = "a",
  B = "b",
  C = 3,
}

class TestClass {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
}

function makeDoc(
  schema: ASTNode,
  extras?: Partial<Omit<ASTDocument, "schema" | "version" | "library">>
): ASTDocument {
  return { version: "1.0.0", library: "valibot", schema, ...extras };
}

const strNode: ASTNode = { kind: "schema", type: "string", async: false };
const numNode: ASTNode = { kind: "schema", type: "number", async: false };

// ---------------------------------------------------------------------------

describe("AST to Schema", () => {
  describe.each([
    ["astToSchema (sync)", astToSchema],
    ["astToSchemaAsync (async)", astToSchemaAsync],
  ] as const)("%s", (_, convert) => {
    // -----------------------------------------------------------------------
    // Document-level guards
    // -----------------------------------------------------------------------

    describe("document guards", () => {
      test("throws for non-valibot library by default", () => {
        expect(() => convert({ ...makeDoc(strNode), library: "zod" as any })).toThrow(
          "library 'zod'"
        );
      });

      test("strictLibraryCheck: false bypasses library check", async () => {
        const s = convert(
          { ...makeDoc(strNode), library: "zod" as any },
          { strictLibraryCheck: false }
        );
        expect(await v.parseAsync(s, "hello")).toBe("hello");
      });

      test("throws for customTransformations without transformationDictionary", () => {
        expect(() => convert(makeDoc(strNode, { customTransformations: { myFn: {} } }))).toThrow(
          "transformation dictionary"
        );
      });

      test("throws for customValidations without validationDictionary", () => {
        expect(() => convert(makeDoc(strNode, { customValidations: { myFn: {} } }))).toThrow(
          "validation dictionary"
        );
      });

      test("throws for customInstances without instanceDictionary", () => {
        expect(() => convert(makeDoc(strNode, { customInstances: { MyClass: {} } }))).toThrow(
          "instance dictionary"
        );
      });

      test("throws for customLazy without lazyDictionary", () => {
        expect(() => convert(makeDoc(strNode, { customLazy: { myLazy: {} } }))).toThrow(
          "lazy dictionary"
        );
      });

      test("throws for customClosures without closureDictionary", () => {
        expect(() => convert(makeDoc(strNode, { customClosures: { myClosure: {} } }))).toThrow(
          "closure dictionary"
        );
      });

      test("validateAST: invalid document with nested field errors throws with details", () => {
        expect(() =>
          convert(
            { version: 123 as any, library: "valibot", schema: strNode },
            {
              validateAST: ASTDocumentSchema,
            }
          )
        ).toThrow("Invalid AST document structure:");
      });

      test("validateAST: root-level failure shows 'validation failed' fallback", () => {
        // Passing null gives a root-level issue → nested is undefined
        expect(() => convert(null as any, { validateAST: ASTDocumentSchema })).toThrow(
          "Invalid AST document structure: validation failed"
        );
      });

      test("validateAST: valid document passes and schema works", async () => {
        const s = convert(makeDoc(strNode), { validateAST: ASTDocumentSchema });
        expect(await v.parseAsync(s, "hello")).toBe("hello");
      });
    });

    // -----------------------------------------------------------------------
    // Standalone node errors (astNodeToSchema guard)
    // -----------------------------------------------------------------------

    describe("standalone node errors", () => {
      test.each([
        ["validation", { kind: "validation", type: "email" } as ASTNode],
        ["transformation", { kind: "transformation", type: "trim" } as ASTNode],
        ["metadata", { kind: "metadata", type: "title", value: "x" } as ASTNode],
      ])("throws for standalone %s node", (_, node) => {
        expect(() => convert(makeDoc(node))).toThrow("Cannot convert standalone");
      });
    });

    // -----------------------------------------------------------------------
    // Primitive schemas
    // -----------------------------------------------------------------------

    describe("primitive schemas", () => {
      test.each([
        ["string", "hello"],
        ["number", 42],
        ["boolean", true],
        ["bigint", 42n],
        ["date", new Date("2024-01-15")],
        ["blob", new Blob(["data"])],
        ["symbol", Symbol("s")],
        ["any", "anything"],
        ["unknown", null],
        ["nan", NaN],
        ["null", null],
        ["undefined", undefined],
        ["void", undefined],
      ] as const)("%s → parses valid value", async (type, valid) => {
        const s = convert(makeDoc({ kind: "schema", type } as ASTNode));
        const result = await v.parseAsync(s, valid);
        if (typeof valid === "symbol") {
          expect(typeof result).toBe("symbol");
        } else if (typeof valid === "number" && isNaN(valid)) {
          expect(result).toBeNaN();
        } else {
          expect(result).toStrictEqual(valid);
        }
      });

      test("promise → parses a Promise instance", async () => {
        // Can't use toStrictEqual because await unwraps nested Promises
        const s = convert(makeDoc({ kind: "schema", type: "promise" }));
        await expect(v.parseAsync(s, Promise.resolve(1))).resolves.toBeDefined();
        await expect(v.parseAsync(s, "not-a-promise")).rejects.toThrow();
      });

      test("file schema parses a File instance", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "file" }));
        const file = new File([], "test.txt");
        expect(await v.parseAsync(s, file)).toBe(file);
      });

      test("function schema parses a function", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "function" }));
        const fn = () => "hello";
        expect(await v.parseAsync(s, fn)).toBe(fn);
      });

      test("never schema rejects all values", () => {
        const s = convert(makeDoc({ kind: "schema", type: "never" }));
        expect(() => v.parse(s as any, null)).toThrow();
      });

      test("unknown schema type throws", () => {
        expect(() => convert(makeDoc({ kind: "schema", type: "foobar" as any }))).toThrow(
          "Unknown schema type: foobar"
        );
      });
    });

    // -----------------------------------------------------------------------
    // Literal schema
    // -----------------------------------------------------------------------

    describe("literal schema", () => {
      test.each([
        ["string literal", "hello"],
        ["number literal", 42],
        ["boolean literal", true],
        ["bigint literal", 42n],
      ] as const)("%s", async (_, value) => {
        const s = convert(makeDoc({ kind: "schema", type: "literal", literal: value as any }));
        expect(await v.parseAsync(s, value)).toStrictEqual(value);
      });
    });

    // -----------------------------------------------------------------------
    // Wrapped schemas
    // -----------------------------------------------------------------------

    describe("wrapped schemas", () => {
      test("optional without default accepts undefined", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "optional", wrapped: strNode }));
        expect(await v.parseAsync(s, undefined)).toBeUndefined();
        expect(await v.parseAsync(s, "x")).toBe("x");
      });

      test("optional with default returns default for undefined", async () => {
        const s = convert(
          makeDoc({ kind: "schema", type: "optional", wrapped: strNode, default: "fallback" })
        );
        expect(await v.parseAsync(s, undefined)).toBe("fallback");
      });

      test("nullable without default accepts null", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "nullable", wrapped: strNode }));
        expect(await v.parseAsync(s, null)).toBeNull();
      });

      test("nullable with default returns default for null", async () => {
        const s = convert(
          makeDoc({ kind: "schema", type: "nullable", wrapped: strNode, default: "fallback" })
        );
        expect(await v.parseAsync(s, null)).toBe("fallback");
      });

      test("nullish without default accepts null and undefined", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "nullish", wrapped: strNode }));
        expect(await v.parseAsync(s, null)).toBeNull();
        expect(await v.parseAsync(s, undefined)).toBeUndefined();
      });

      test("nullish with default returns default for null", async () => {
        const s = convert(
          makeDoc({ kind: "schema", type: "nullish", wrapped: strNode, default: "z" })
        );
        expect(await v.parseAsync(s, null)).toBe("z");
      });

      test("non_optional rejects undefined", async () => {
        const wrapped: ASTNode = { kind: "schema", type: "optional", wrapped: strNode };
        const s = convert(makeDoc({ kind: "schema", type: "non_optional", wrapped }));
        await expect(v.parseAsync(s, undefined)).rejects.toThrow();
        expect(await v.parseAsync(s, "x")).toBe("x");
      });

      test("non_nullable rejects null", async () => {
        const wrapped: ASTNode = { kind: "schema", type: "nullable", wrapped: strNode };
        const s = convert(makeDoc({ kind: "schema", type: "non_nullable", wrapped }));
        await expect(v.parseAsync(s, null)).rejects.toThrow();
        expect(await v.parseAsync(s, "x")).toBe("x");
      });

      test("non_nullish rejects null and undefined", async () => {
        const wrapped: ASTNode = { kind: "schema", type: "nullish", wrapped: strNode };
        const s = convert(makeDoc({ kind: "schema", type: "non_nullish", wrapped }));
        await expect(v.parseAsync(s, null)).rejects.toThrow();
        await expect(v.parseAsync(s, undefined)).rejects.toThrow();
        expect(await v.parseAsync(s, "x")).toBe("x");
      });

      test("exact_optional without default", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "exact_optional", wrapped: strNode }));
        expect(await v.parseAsync(s, "x")).toBe("x");
      });

      test("exact_optional with default uses default when key is absent", async () => {
        // exactOptional only fires default when key is absent in an object context,
        // not when standalone undefined is parsed directly
        const node: ASTNode = {
          kind: "schema",
          type: "object",
          entries: {
            name: { kind: "schema", type: "exact_optional", wrapped: strNode, default: "anon" },
          },
        };
        const s = convert(makeDoc(node));
        const result = (await v.parseAsync(s, {})) as any;
        expect(result.name).toBe("anon");
      });

      test("undefinedable without default accepts undefined", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "undefinedable", wrapped: strNode }));
        expect(await v.parseAsync(s, undefined)).toBeUndefined();
      });

      test("undefinedable with default returns default for undefined", async () => {
        const s = convert(
          makeDoc({ kind: "schema", type: "undefinedable", wrapped: strNode, default: "d" })
        );
        expect(await v.parseAsync(s, undefined)).toBe("d");
      });

      test("unknown wrapped type falls through to inner schema", async () => {
        const node = { kind: "schema", type: "future_wrapper" as any, wrapped: strNode } as ASTNode;
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, "hello")).toBe("hello");
      });
    });

    // -----------------------------------------------------------------------
    // Object schemas
    // -----------------------------------------------------------------------

    describe("object schemas", () => {
      test("object with entries", async () => {
        const s = convert(
          makeDoc({ kind: "schema", type: "object", entries: { name: strNode, age: numNode } })
        );
        expect(await v.parseAsync(s, { name: "Alice", age: 30 })).toStrictEqual({
          name: "Alice",
          age: 30,
        });
      });

      test("empty object", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "object", entries: {} }));
        expect(await v.parseAsync(s, {})).toStrictEqual({});
      });

      test("loose_object allows extra keys", async () => {
        const s = convert(
          makeDoc({ kind: "schema", type: "loose_object", entries: { name: strNode } })
        );
        const result = (await v.parseAsync(s, { name: "Bob", extra: 1 })) as any;
        expect(result.name).toBe("Bob");
        expect(result.extra).toBe(1);
      });

      test("strict_object rejects extra keys", async () => {
        const s = convert(
          makeDoc({ kind: "schema", type: "strict_object", entries: { name: strNode } })
        );
        await expect(v.parseAsync(s, { name: "Bob", extra: 1 })).rejects.toThrow();
        expect(await v.parseAsync(s, { name: "Bob" })).toStrictEqual({ name: "Bob" });
      });

      test("object_with_rest validates extra keys against rest schema", async () => {
        const s = convert(
          makeDoc({
            kind: "schema",
            type: "object_with_rest",
            entries: { name: strNode },
            rest: numNode,
          })
        );
        const result = (await v.parseAsync(s, { name: "Alice", score: 99 })) as any;
        expect(result.name).toBe("Alice");
        expect(result.score).toBe(99);
        await expect(v.parseAsync(s, { name: "Alice", score: "bad" })).rejects.toThrow();
      });

      test("object_with_rest without rest field falls through to unknown type error", () => {
        const node = { kind: "schema", type: "object_with_rest", entries: {} } as any;
        expect(() => convert(makeDoc(node))).toThrow("Unknown schema type");
      });
    });

    // -----------------------------------------------------------------------
    // Array schema
    // -----------------------------------------------------------------------

    describe("array schema", () => {
      test("array parses array of items", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "array", item: strNode }));
        expect(await v.parseAsync(s, ["a", "b"])).toStrictEqual(["a", "b"]);
        await expect(v.parseAsync(s, [1, 2])).rejects.toThrow();
      });
    });

    // -----------------------------------------------------------------------
    // Tuple schemas
    // -----------------------------------------------------------------------

    describe("tuple schemas", () => {
      test("tuple with fixed items", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "tuple", items: [strNode, numNode] }));
        expect(await v.parseAsync(s, ["hello", 42])).toStrictEqual(["hello", 42]);
      });

      test("loose_tuple allows extra elements", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "loose_tuple", items: [strNode] }));
        const result = (await v.parseAsync(s, ["hello", 99, true])) as any;
        expect(result[0]).toBe("hello");
      });

      test("strict_tuple rejects extra elements", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "strict_tuple", items: [strNode] }));
        await expect(v.parseAsync(s, ["hello", 99])).rejects.toThrow();
        expect(await v.parseAsync(s, ["hello"])).toStrictEqual(["hello"]);
      });

      test("tuple_with_rest validates rest elements", async () => {
        const s = convert(
          makeDoc({
            kind: "schema",
            type: "tuple_with_rest",
            items: [strNode],
            rest: numNode,
          })
        );
        expect(await v.parseAsync(s, ["hello", 1, 2, 3])).toStrictEqual(["hello", 1, 2, 3]);
      });

      test("tuple_with_rest without rest field falls through to unknown type error", () => {
        const node = { kind: "schema", type: "tuple_with_rest", items: [] } as any;
        expect(() => convert(makeDoc(node))).toThrow("Unknown schema type");
      });
    });

    // -----------------------------------------------------------------------
    // Union / variant / enum / picklist
    // -----------------------------------------------------------------------

    describe("union schema", () => {
      test("union accepts any of the options", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "union", options: [strNode, numNode] }));
        expect(await v.parseAsync(s, "hello")).toBe("hello");
        expect(await v.parseAsync(s, 42)).toBe(42);
        await expect(v.parseAsync(s, true)).rejects.toThrow();
      });
    });

    describe("variant schema", () => {
      test("variant uses discriminator key", async () => {
        const options: ASTNode[] = [
          {
            kind: "schema",
            type: "object",
            entries: {
              type: { kind: "schema", type: "literal", literal: "click" },
              x: numNode,
              y: numNode,
            },
          },
          {
            kind: "schema",
            type: "object",
            entries: {
              type: { kind: "schema", type: "literal", literal: "key" },
              key: strNode,
            },
          },
        ];
        const s = convert(makeDoc({ kind: "schema", type: "variant", key: "type", options }));
        expect(await v.parseAsync(s, { type: "click", x: 10, y: 20 })).toStrictEqual({
          type: "click",
          x: 10,
          y: 20,
        });
        expect(await v.parseAsync(s, { type: "key", key: "Enter" })).toStrictEqual({
          type: "key",
          key: "Enter",
        });
        await expect(v.parseAsync(s, { type: "scroll" })).rejects.toThrow();
      });
    });

    describe("enum schema", () => {
      test("native enum accepts enum values", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "enum", enum: TestEnum as any }));
        expect(await v.parseAsync(s, "a")).toBe("a");
        expect(await v.parseAsync(s, 3)).toBe(3);
        await expect(v.parseAsync(s, "x")).rejects.toThrow();
      });
    });

    describe("picklist schema", () => {
      test("picklist accepts listed values", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "picklist", options: ["a", "b", "c"] }));
        expect(await v.parseAsync(s, "b")).toBe("b");
        await expect(v.parseAsync(s, "d")).rejects.toThrow();
      });

      test("picklist filters out non-string/number/bigint options", async () => {
        // boolean true gets filtered out, leaving ["a", "b"]
        const s = convert(
          makeDoc({ kind: "schema", type: "picklist", options: ["a", true as any, "b"] })
        );
        expect(await v.parseAsync(s, "a")).toBe("a");
      });
    });

    // -----------------------------------------------------------------------
    // Record / map / set / intersect
    // -----------------------------------------------------------------------

    describe("record schema", () => {
      test("record validates key and value schemas", async () => {
        const s = convert(
          makeDoc({ kind: "schema", type: "record", key: strNode, value: numNode })
        );
        expect(await v.parseAsync(s, { a: 1, b: 2 })).toStrictEqual({ a: 1, b: 2 });
        await expect(v.parseAsync(s, { a: "not-a-number" })).rejects.toThrow();
      });
    });

    describe("map schema", () => {
      test("map validates key and value types", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "map", key: strNode, value: numNode }));
        const result = (await v.parseAsync(s, new Map([["key", 42]]))) as Map<string, number>;
        expect(result.get("key")).toBe(42);
      });
    });

    describe("set schema", () => {
      test("set validates item type", async () => {
        const s = convert(makeDoc({ kind: "schema", type: "set", item: strNode }));
        const result = (await v.parseAsync(s, new Set(["a", "b"]))) as Set<string>;
        expect(result.has("a")).toBe(true);
        await expect(v.parseAsync(s, new Set([1, 2]))).rejects.toThrow();
      });
    });

    describe("intersect schema", () => {
      test("intersect requires all options to pass", async () => {
        const objA: ASTNode = { kind: "schema", type: "object", entries: { a: strNode } };
        const objB: ASTNode = { kind: "schema", type: "object", entries: { b: numNode } };
        const s = convert(makeDoc({ kind: "schema", type: "intersect", options: [objA, objB] }));
        const result = (await v.parseAsync(s, { a: "hello", b: 42 })) as any;
        expect(result.a).toBe("hello");
        expect(result.b).toBe(42);
      });
    });

    // -----------------------------------------------------------------------
    // Instance schema
    // -----------------------------------------------------------------------

    describe("instance schema", () => {
      test("throws without customKey (cannot reconstruct class reference)", () => {
        const node: ASTNode = { kind: "schema", type: "instance", class: "TestClass" };
        expect(() => convert(makeDoc(node))).toThrow("Cannot reconstruct instance schema");
      });

      test("throws when customKey not found in instanceDictionary", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "instance",
          class: "TestClass",
          customKey: "tc",
        };
        expect(() =>
          convert(makeDoc(node, { customInstances: { tc: {} } }), {
            instanceDictionary: new Map(),
          })
        ).toThrow(`key "tc" but it was not found`);
      });

      test("reconstructs from customKey + instanceDictionary", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "instance",
          class: "TestClass",
          customKey: "tc",
        };
        const s = convert(makeDoc(node, { customInstances: { tc: { className: "TestClass" } } }), {
          instanceDictionary: new Map([["tc", TestClass]]),
        });
        const obj = new TestClass(99);
        expect(await v.parseAsync(s, obj)).toBe(obj);
        await expect(v.parseAsync(s, { value: 99 })).rejects.toThrow();
      });
    });

    // -----------------------------------------------------------------------
    // Lazy schema
    // -----------------------------------------------------------------------

    describe("lazy schema", () => {
      test("throws without customKey", () => {
        const node: ASTNode = { kind: "schema", type: "lazy" };
        expect(() => convert(makeDoc(node))).toThrow("Cannot reconstruct lazy");
      });

      test("throws when customKey not found in lazyDictionary", () => {
        const node: ASTNode = { kind: "schema", type: "lazy", customKey: "mySchema" };
        expect(() =>
          convert(makeDoc(node, { customLazy: { mySchema: {} } }), {
            lazyDictionary: new Map(),
          })
        ).toThrow("'mySchema' referenced but not found");
      });

      test("reconstructs from customKey + lazyDictionary", async () => {
        const strSchema = v.string();
        const node: ASTNode = { kind: "schema", type: "lazy", customKey: "myStr" };
        const s = convert(makeDoc(node, { customLazy: { myStr: {} } }), {
          lazyDictionary: new Map([["myStr", () => strSchema]]),
        });
        expect(await v.parseAsync(s, "hello")).toBe("hello");
      });
    });

    // -----------------------------------------------------------------------
    // Schema info (title / description / examples / metadata)
    // -----------------------------------------------------------------------

    describe("schema info", () => {
      test("applies title action", async () => {
        const node: ASTNode = { kind: "schema", type: "string", info: { title: "Full Name" } };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, "Alice")).toBe("Alice");
      });

      test("applies description action", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          info: { description: "A string value" },
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, "x")).toBe("x");
      });

      test("applies examples action", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          info: { examples: ["foo", "bar"] },
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, "baz")).toBe("baz");
      });

      test("applies metadata action", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          info: { metadata: { id: "name-field" } },
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, "x")).toBe("x");
      });
    });

    // -----------------------------------------------------------------------
    // Pipe: validation actions
    // -----------------------------------------------------------------------

    describe("pipe: validation actions", () => {
      test("schema node in pipe is recursively converted", async () => {
        const node: ASTNode = { kind: "schema", type: "string", pipe: [strNode] };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, "hello")).toBe("hello");
      });

      test("metadata node in pipe throws (not silently ignored)", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "metadata", type: "title", value: "x" }],
        };
        expect(() => convert(makeDoc(node))).toThrow();
      });

      test("unknown pipe item kind throws", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [strNode, { kind: "unknown_kind" as any, type: "x" }],
        };
        expect(() => convert(makeDoc(node))).toThrow("Unknown pipe item kind");
      });

      // Custom validation
      test("custom validation via validationDictionary", async () => {
        const isLong = (s: string) => s.length > 5;
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type: "custom", customKey: "isLong" }],
        };
        const s = convert(makeDoc(node, { customValidations: { isLong: {} } }), {
          validationDictionary: new Map([["isLong", isLong]]),
        });
        expect(await v.parseAsync(s, "toolong")).toBe("toolong");
        await expect(v.parseAsync(s, "hi")).rejects.toThrow();
      });

      test("custom validation falls back to closureDictionary", async () => {
        const isLong = (s: string) => s.length > 5;
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type: "custom", customKey: "isLong" }],
        };
        const s = convert(makeDoc(node, { customClosures: { isLong: {} } }), {
          closureDictionary: new Map([["isLong", isLong]]),
        });
        expect(await v.parseAsync(s, "toolong")).toBe("toolong");
      });

      test("custom validation throws when impl not found in any dictionary", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type: "custom", customKey: "missing" }],
        };
        expect(() =>
          convert(makeDoc(node, { customValidations: { missing: {} } }), {
            validationDictionary: new Map(),
          })
        ).toThrow("'missing' referenced but not found");
      });

      test("check type without customKey throws", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type: "check" }],
        };
        expect(() => convert(makeDoc(node))).toThrow("no customKey provided");
      });

      test("custom type without customKey throws", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type: "custom" }],
        };
        expect(() => convert(makeDoc(node))).toThrow("no customKey provided");
      });

      test("unknown validation type throws", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type: "unknown_validation_xyz" }],
        };
        expect(() => convert(makeDoc(node))).toThrow("Unknown validation type");
      });

      // Length validations
      test.each([
        ["min_length", 3, "abc", "ab"],
        ["max_length", 5, "abc", "toolong123"],
        ["length", 3, "abc", "ab"],
        ["not_length", 3, "ab", "abc"],
      ] as const)("%s validation", async (type, req, valid, invalid) => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type, requirement: req }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, valid)).toBe(valid);
        await expect(v.parseAsync(s, invalid)).rejects.toThrow();
      });

      // Value validations (number)
      test.each([
        ["min_value", 5, 10, 3],
        ["max_value", 5, 3, 10],
        ["value", 5, 5, 3],
        ["gt_value", 5, 6, 5],
        ["lt_value", 5, 4, 5],
        ["multiple_of", 3, 9, 7],
        ["not_value", 0, 1, 0],
      ] as const)("%s validation", async (type, req, valid, invalid) => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "validation", type, requirement: req }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, valid)).toBe(valid);
        await expect(v.parseAsync(s, invalid)).rejects.toThrow();
      });

      // Number-only validations (no requirement)
      test.each([
        ["integer", 42, 42.5],
        ["safe_integer", 42, Number.MAX_SAFE_INTEGER + 1],
        ["finite", 42, Infinity],
      ] as const)("%s validation", async (type, valid, invalid) => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "validation", type }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, valid)).toBe(valid);
        await expect(v.parseAsync(s, invalid)).rejects.toThrow();
      });

      // String format validations
      test.each([
        ["email", "test@example.com", "not-email"],
        ["url", "https://example.com", "not-url"],
        ["uuid", "550e8400-e29b-41d4-a716-446655440000", "not-uuid"],
        ["ulid", "01ARZ3NDEKTSV4RRFFQ69G5FAV", "x"],
        ["nanoid", "V1StGXR8_Z5jdHi6B-myT", "hello world!"],
        ["cuid2", "clh3lkq0s0000zx4q3w7q2k8r", "UPPERCASE-INVALID"],
        ["emoji", "😀", "abc"],
        ["ip", "192.168.1.1", "not-ip"],
        ["ipv4", "192.168.1.1", "not-ipv4"],
        ["ipv6", "2001:db8::1", "not-ipv6"],
        ["mac", "00:1A:2B:3C:4D:5E", "not-mac"],
        ["mac48", "00:1A:2B:3C:4D:5E", "not-mac48"],
        ["mac64", "00:1A:2B:3C:4D:5E:6F:70", "not-mac64"],
        ["imei", "490154203237518", "not-imei"],
        ["iso_date", "2024-01-15", "not-date"],
        ["iso_date_time", "2024-01-15T10:30", "not-datetime"],
        ["iso_time", "10:30", "x"],
        ["iso_time_second", "10:30:00", "x"],
        ["iso_timestamp", "2024-01-15T10:30:00.000Z", "x"],
        ["iso_week", "2024-W03", "x"],
        ["non_empty", "hello", ""],
        ["bic", "DEUTDEDB", "x"],
        ["credit_card", "4111111111111111", "x"],
        ["decimal", "123.45", "abc"],
        ["digits", "12345", "abc"],
        ["hex_color", "#FF0000", "red"],
        ["hexadecimal", "FF0A3C", "xyz"],
        ["octal", "0755", "999"],
        ["rfc_email", "test@example.com", "not-email"],
        ["slug", "my-slug-123", "not a slug!"],
        ["empty", "", "x"],
      ] as const)("%s validation", async (type, valid, invalid) => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, valid)).toBe(valid);
        await expect(v.parseAsync(s, invalid)).rejects.toThrow();
      });

      // Pattern validations (require requirement)
      test.each([
        ["regex", /^[a-z]+$/, "hello", "Hello123"],
        ["includes", "foo", "foobar", "bazqux"],
        ["excludes", "foo", "bazqux", "foobar"],
        ["starts_with", "hel", "hello", "world"],
        ["ends_with", "rld", "world", "hello"],
      ] as const)("%s validation", async (type, req, valid, invalid) => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type, requirement: req }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, valid)).toBe(valid);
        await expect(v.parseAsync(s, invalid)).rejects.toThrow();
      });

      // Bytes validations
      test.each([
        ["min_bytes", 3, "abc", "ab"],
        ["max_bytes", 3, "ab", "abcd"],
        ["bytes", 3, "abc", "abcd"],
        ["not_bytes", 3, "ab", "abc"],
      ] as const)("%s validation", async (type, req, valid, invalid) => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type, requirement: req }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, valid)).toBe(valid);
        await expect(v.parseAsync(s, invalid)).rejects.toThrow();
      });

      // Graphemes validations
      test.each([
        ["min_graphemes", 3, "abc", "ab"],
        ["max_graphemes", 3, "ab", "abcd"],
        ["graphemes", 3, "abc", "ab"],
        ["not_graphemes", 3, "ab", "abc"],
      ] as const)("%s validation", async (type, req, valid, invalid) => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type, requirement: req }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, valid)).toBe(valid);
        await expect(v.parseAsync(s, invalid)).rejects.toThrow();
      });

      // Words validations (with locales)
      test.each([
        ["min_words", undefined, 2, "hello world", "hello"],
        ["max_words", undefined, 2, "hello world", "hello world foo"],
        ["words", undefined, 2, "hello world", "hello"],
        ["not_words", undefined, 2, "hello world foo", "hello world"],
      ] as const)("%s validation", async (type, locales, req, valid, invalid) => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type, locales, requirement: req }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, valid)).toBe(valid);
        await expect(v.parseAsync(s, invalid)).rejects.toThrow();
      });

      // Size validations (set)
      test.each([
        ["min_size", 2, new Set([1, 2]), new Set([1])],
        ["max_size", 2, new Set([1]), new Set([1, 2, 3])],
        ["size", 2, new Set([1, 2]), new Set([1])],
        ["not_size", 2, new Set([1]), new Set([1, 2])],
      ] as const)("%s validation", async (type, req, valid, invalid) => {
        const node: ASTNode = {
          kind: "schema",
          type: "set",
          item: numNode,
          pipe: [{ kind: "validation", type, requirement: req }],
        };
        const s = convert(makeDoc(node));
        await expect(v.parseAsync(s, valid)).resolves.toBeDefined();
        await expect(v.parseAsync(s, invalid)).rejects.toThrow();
      });

      // Entries validations (record)
      test.each([
        ["min_entries", 2, { a: 1, b: 2 }, { a: 1 }],
        ["max_entries", 2, { a: 1 }, { a: 1, b: 2, c: 3 }],
        ["entries", 2, { a: 1, b: 2 }, { a: 1 }],
        ["not_entries", 2, { a: 1 }, { a: 1, b: 2 }],
      ] as const)("%s validation", async (type, req, valid, invalid) => {
        const node: ASTNode = {
          kind: "schema",
          type: "record",
          key: strNode,
          value: numNode,
          pipe: [{ kind: "validation", type, requirement: req }],
        };
        const s = convert(makeDoc(node));
        await expect(v.parseAsync(s, valid)).resolves.toBeDefined();
        await expect(v.parseAsync(s, invalid)).rejects.toThrow();
      });

      // hash validation
      test("hash validation", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "validation", type: "hash", requirement: ["md5"] }],
        };
        const s = convert(makeDoc(node));
        const md5Hash = "d41d8cd98f00b204e9800998ecf8427e";
        expect(await v.parseAsync(s, md5Hash)).toBe(md5Hash);
        await expect(v.parseAsync(s, "not-a-hash")).rejects.toThrow();
      });

      // mime_type validation
      test("mime_type validation", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "file",
          pipe: [{ kind: "validation", type: "mime_type", requirement: ["image/png"] }],
        };
        const s = convert(makeDoc(node));
        const png = new File([], "img.png", { type: "image/png" });
        await expect(v.parseAsync(s, png)).resolves.toBeDefined();
        const jpg = new File([], "img.jpg", { type: "image/jpeg" });
        await expect(v.parseAsync(s, jpg)).rejects.toThrow();
      });
    });

    // -----------------------------------------------------------------------
    // Pipe: transformation actions
    // -----------------------------------------------------------------------

    describe("pipe: transformation actions", () => {
      // Custom transformation
      test("custom transformation via transformationDictionary", async () => {
        const double = (n: number) => n * 2;
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "transform", customKey: "double" }],
        };
        const s = convert(makeDoc(node, { customTransformations: { double: {} } }), {
          transformationDictionary: new Map([["double", double]]),
        });
        expect(await v.parseAsync(s, 21)).toBe(42);
      });

      test("custom transformation falls back to closureDictionary", async () => {
        const double = (n: number) => n * 2;
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "transform", customKey: "double" }],
        };
        const s = convert(makeDoc(node, { customClosures: { double: {} } }), {
          closureDictionary: new Map([["double", double]]),
        });
        expect(await v.parseAsync(s, 21)).toBe(42);
      });

      test("custom transformation throws when impl not found in any dictionary", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "transform", customKey: "missing" }],
        };
        expect(() =>
          convert(makeDoc(node, { customTransformations: { missing: {} } }), {
            transformationDictionary: new Map(),
          })
        ).toThrow("'missing' referenced but not found");
      });

      test("transform type without customKey throws", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "transform" }],
        };
        expect(() => convert(makeDoc(node))).toThrow("no customKey provided");
      });

      // String transformations
      test.each([
        ["to_lower_case", "HELLO", "hello"],
        ["to_upper_case", "hello", "HELLO"],
        ["trim", "  hello  ", "hello"],
        ["trim_start", "  hello  ", "hello  "],
        ["trim_end", "  hello  ", "  hello"],
      ] as const)("%s transformation", async (type, input, expected) => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "transformation", type }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, input)).toBe(expected);
      });

      test("to_string transforms number to string", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "to_string" }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, 42)).toBe("42");
      });

      test("to_number transforms string to number", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "transformation", type: "to_number" }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, "42")).toBe(42);
      });

      test("to_boolean transforms number to boolean", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "to_boolean" }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, 1)).toBe(true);
        expect(await v.parseAsync(s, 0)).toBe(false);
      });

      test("to_bigint transforms number to bigint", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "to_bigint" }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, 42)).toBe(42n);
      });

      test("to_date transforms string to Date", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "transformation", type: "to_date" }],
        };
        const s = convert(makeDoc(node));
        const result = await v.parseAsync(s, "2024-01-15");
        expect(result).toBeInstanceOf(Date);
      });

      test("to_min_value clamps value up to minimum", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "to_min_value", requirement: 10 }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, 5)).toBe(10);
        expect(await v.parseAsync(s, 15)).toBe(15);
      });

      test("to_min_value without requirement falls through to unknown error", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "to_min_value" }],
        };
        expect(() => convert(makeDoc(node))).toThrow("Unknown or non-reconstructable");
      });

      test("to_max_value clamps value down to maximum", async () => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "to_max_value", requirement: 10 }],
        };
        const s = convert(makeDoc(node));
        expect(await v.parseAsync(s, 15)).toBe(10);
        expect(await v.parseAsync(s, 5)).toBe(5);
      });

      test("to_max_value without requirement falls through to unknown error", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "number",
          pipe: [{ kind: "transformation", type: "to_max_value" }],
        };
        expect(() => convert(makeDoc(node))).toThrow("Unknown or non-reconstructable");
      });

      test("unknown transformation type throws", () => {
        const node: ASTNode = {
          kind: "schema",
          type: "string",
          pipe: [{ kind: "transformation", type: "unknown_transform_xyz" }],
        };
        expect(() => convert(makeDoc(node))).toThrow("Unknown or non-reconstructable");
      });
    });
  });

  // -------------------------------------------------------------------------
  // astToSchemaAsync-specific: async validators, transformers, and schema types
  // -------------------------------------------------------------------------

  describe("astToSchemaAsync specific", () => {
    test("async custom validator (returns Promise<boolean>)", async () => {
      const asyncIsLong = async (s: string) => {
        await Promise.resolve();
        return s.length > 5;
      };
      const node: ASTNode = {
        kind: "schema",
        type: "string",
        pipe: [{ kind: "validation", type: "custom", customKey: "asyncIsLong" }],
      };
      const s = astToSchemaAsync(makeDoc(node, { customValidations: { asyncIsLong: {} } }), {
        validationDictionary: new Map([["asyncIsLong", asyncIsLong]]),
      });
      expect(await v.parseAsync(s, "toolong123")).toBe("toolong123");
      await expect(v.parseAsync(s, "hi")).rejects.toThrow();
    });

    test("async custom transformer (returns Promise<T>)", async () => {
      const asyncDouble = async (n: number) => {
        await Promise.resolve();
        return n * 2;
      };
      const node: ASTNode = {
        kind: "schema",
        type: "number",
        pipe: [{ kind: "transformation", type: "transform", customKey: "asyncDouble" }],
      };
      const s = astToSchemaAsync(makeDoc(node, { customTransformations: { asyncDouble: {} } }), {
        transformationDictionary: new Map([["asyncDouble", asyncDouble]]),
      });
      expect(await v.parseAsync(s, 21)).toBe(42);
    });

    test("async lazy getter resolving to a sync schema", async () => {
      const strSchema = v.string();
      const node: ASTNode = { kind: "schema", type: "lazy", customKey: "myStr" };
      const s = astToSchemaAsync(makeDoc(node, { customLazy: { myStr: {} } }), {
        lazyDictionary: new Map([["myStr", () => strSchema]]),
      });
      expect(await v.parseAsync(s, "hello")).toBe("hello");
      await expect(v.parseAsync(s, 42)).rejects.toThrow();
    });

    test("produces async schema for object type", () => {
      const s = astToSchemaAsync(
        makeDoc({
          kind: "schema",
          type: "object",
          entries: { name: strNode },
        })
      );
      expect((s as any).async).toBe(true);
    });

    test("produces async schema for array type", () => {
      const s = astToSchemaAsync(makeDoc({ kind: "schema", type: "array", item: strNode }));
      expect((s as any).async).toBe(true);
    });

    test("uses checkAsync (not v.custom) for custom validations", async () => {
      // checkAsync item has kind "check_async" in valibot pipe internals
      const isOk = (s: string) => s.length > 0;
      const node: ASTNode = {
        kind: "schema",
        type: "string",
        pipe: [{ kind: "validation", type: "custom", customKey: "isOk" }],
      };
      const s = astToSchemaAsync(makeDoc(node, { customValidations: { isOk: {} } }), {
        validationDictionary: new Map([["isOk", isOk]]),
      });
      expect(await v.parseAsync(s, "hello")).toBe("hello");
      await expect(v.parseAsync(s, "")).rejects.toThrow();
    });

    test("uses transformAsync (not v.transform) for custom transformations", async () => {
      const addBang = (s: string) => s + "!";
      const node: ASTNode = {
        kind: "schema",
        type: "string",
        pipe: [{ kind: "transformation", type: "transform", customKey: "addBang" }],
      };
      const s = astToSchemaAsync(makeDoc(node, { customTransformations: { addBang: {} } }), {
        transformationDictionary: new Map([["addBang", addBang]]),
      });
      expect(await v.parseAsync(s, "hello")).toBe("hello!");
    });
  });
});
