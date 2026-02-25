import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { inferInitialValue } from "./infer-initial-value.ts";

function ast(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return schemaToAST(schema).document.schema;
}

describe("inferInitialValue", () => {
  describe("primitives", () => {
    test("string → ''", () => {
      expect(inferInitialValue(ast(v.string()))).toBe("");
    });

    test("number → undefined (not pre-filled)", () => {
      expect(inferInitialValue(ast(v.number()))).toBeUndefined();
    });

    test("bigint → undefined (not pre-filled)", () => {
      expect(inferInitialValue(ast(v.bigint()))).toBeUndefined();
    });

    test("boolean → false", () => {
      expect(inferInitialValue(ast(v.boolean()))).toBe(false);
    });

    test("date → undefined (not pre-filled)", () => {
      expect(inferInitialValue(ast(v.date()))).toBeUndefined();
    });

    test("null schema → null", () => {
      expect(inferInitialValue(ast(v.null()))).toBeNull();
    });

    test("undefined schema → undefined", () => {
      expect(inferInitialValue(ast(v.undefined()))).toBeUndefined();
    });

    test("any → undefined", () => {
      expect(inferInitialValue(ast(v.any()))).toBeUndefined();
    });

    test("unknown → undefined", () => {
      expect(inferInitialValue(ast(v.unknown()))).toBeUndefined();
    });
  });

  describe("wrappers", () => {
    test("optional → undefined", () => {
      expect(inferInitialValue(ast(v.optional(v.string())))).toBeUndefined();
    });

    test("exact_optional → undefined", () => {
      expect(inferInitialValue(ast(v.exactOptional(v.string())))).toBeUndefined();
    });

    test("undefinedable → undefined", () => {
      expect(inferInitialValue(ast(v.undefinedable(v.string())))).toBeUndefined();
    });

    test("nullable (required) → null", () => {
      expect(inferInitialValue(ast(v.nullable(v.string())))).toBeNull();
    });

    test("nullish (optional + nullable) → undefined", () => {
      // nullish = optional + nullable; undefined wins since it's not required
      expect(inferInitialValue(ast(v.nullish(v.string())))).toBeUndefined();
    });

    test("optional(string, 'default') → uses default value", () => {
      expect(inferInitialValue(ast(v.optional(v.string(), "default")))).toBe("default");
    });

    test("optional(number, 42) → uses default value", () => {
      expect(inferInitialValue(ast(v.optional(v.number(), 42)))).toBe(42);
    });

    test("optional(boolean, true) → uses default value", () => {
      expect(inferInitialValue(ast(v.optional(v.boolean(), true)))).toBe(true);
    });

    test("nullable(string, null) → uses null default", () => {
      expect(inferInitialValue(ast(v.nullable(v.string(), null)))).toBeNull();
    });
  });

  describe("literal", () => {
    test("literal string → that string", () => {
      expect(inferInitialValue(ast(v.literal("fixed")))).toBe("fixed");
    });

    test("literal number → that number", () => {
      expect(inferInitialValue(ast(v.literal(42)))).toBe(42);
    });

    test("literal boolean → that boolean", () => {
      expect(inferInitialValue(ast(v.literal(true)))).toBe(true);
    });
  });

  describe("choice types (not pre-filled)", () => {
    test("enum → undefined (user must choose)", () => {
      enum Status {
        Active = "active",
        Inactive = "inactive",
      }
      expect(inferInitialValue(ast(v.enum(Status)))).toBeUndefined();
    });

    test("picklist → undefined (user must choose)", () => {
      expect(inferInitialValue(ast(v.picklist(["a", "b", "c"])))).toBeUndefined();
    });

    test("picklist with numbers → undefined (user must choose)", () => {
      expect(inferInitialValue(ast(v.picklist([1, 2, 3])))).toBeUndefined();
    });

    test("enum with explicit default → uses default", () => {
      enum Status {
        Active = "active",
        Inactive = "inactive",
      }
      expect(inferInitialValue(ast(v.optional(v.enum(Status), "active" as Status)))).toBe("active");
    });

    test("picklist with explicit default → uses default", () => {
      expect(inferInitialValue(ast(v.optional(v.picklist(["a", "b"]), "b")))).toBe("b");
    });
  });

  describe("object", () => {
    test("empty object → {}", () => {
      const result = inferInitialValue(ast(v.object({})));
      expect(result).toEqual({});
    });

    test("object with primitive fields → correct defaults", () => {
      const result = inferInitialValue(
        ast(
          v.object({
            name: v.string(),
            age: v.number(),
            active: v.boolean(),
          })
        )
      );
      expect(result).toEqual({ name: "", age: undefined, active: false });
    });

    test("object with optional field → undefined for that field", () => {
      const result = inferInitialValue(
        ast(
          v.object({
            name: v.string(),
            middle: v.optional(v.string()),
          })
        )
      );
      expect(result).toEqual({ name: "", middle: undefined });
    });

    test("nested object → recursively populated", () => {
      const result = inferInitialValue(
        ast(
          v.object({
            user: v.object({
              name: v.string(),
              age: v.number(),
            }),
          })
        )
      );
      expect(result).toEqual({ user: { name: "", age: undefined } });
    });
  });

  describe("array and tuple", () => {
    test("array → []", () => {
      expect(inferInitialValue(ast(v.array(v.string())))).toEqual([]);
    });

    test("tuple → []", () => {
      expect(inferInitialValue(ast(v.tuple([v.string(), v.number()])))).toEqual([]);
    });
  });

  describe("union and variant", () => {
    test("union → initial value of first option", () => {
      const result = inferInitialValue(ast(v.union([v.string(), v.number()])));
      expect(result).toBe(""); // first option is string
    });

    test("variant → initial value of first branch (object)", () => {
      const result = inferInitialValue(
        ast(
          v.variant("type", [
            v.object({ type: v.literal("a"), value: v.string() }),
            v.object({ type: v.literal("b"), value: v.number() }),
          ])
        )
      );
      // first branch is object { type: "a", value: "" }
      expect(result).toEqual({ type: "a", value: "" });
    });
  });

  describe("unsupported types", () => {
    test("file → undefined", () => {
      expect(inferInitialValue(ast(v.file()))).toBeUndefined();
    });

    test("blob → undefined", () => {
      expect(inferInitialValue(ast(v.blob()))).toBeUndefined();
    });
  });

  describe("empty options edge cases", () => {
    test("union with no options → undefined", () => {
      const node = { kind: "schema" as const, type: "union" as const, options: [] };
      expect(inferInitialValue(node as any)).toBeUndefined();
    });

    test("variant with no options → undefined", () => {
      const node = { kind: "schema" as const, type: "variant" as const, key: "type", options: [] };
      expect(inferInitialValue(node as any)).toBeUndefined();
    });

    test("intersect → {}", () => {
      const result = inferInitialValue(
        ast(v.intersect([v.object({ a: v.string() }), v.object({ b: v.number() })]))
      );
      expect(result).toEqual({});
    });

    test("enum with no values → undefined", () => {
      const node = { kind: "schema" as const, type: "enum" as const, enum: {} };
      expect(inferInitialValue(node as any)).toBeUndefined();
    });

    test("picklist with no options → undefined", () => {
      const node = { kind: "schema" as const, type: "picklist" as const, options: [] };
      expect(inferInitialValue(node as any)).toBeUndefined();
    });
  });

  describe("SerializedBigInt in literals", () => {
    test("literal bigint → deserialized BigInt value", () => {
      const node = {
        kind: "schema" as const,
        type: "literal" as const,
        literal: { __type: "bigint" as const, value: "42" },
      };
      expect(inferInitialValue(node)).toBe(BigInt(42));
    });
  });
});
