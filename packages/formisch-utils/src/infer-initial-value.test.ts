import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { inferInitialValue } from "./infer-initial-value.ts";

function ast(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return schemaToAST(schema).schema;
}

describe("inferInitialValue — primitives", () => {
  test("string → ''", () => {
    expect(inferInitialValue(ast(v.string()))).toBe("");
  });

  test("number → 0", () => {
    expect(inferInitialValue(ast(v.number()))).toBe(0);
  });

  test("bigint → 0", () => {
    expect(inferInitialValue(ast(v.bigint()))).toBe(0);
  });

  test("boolean → false", () => {
    expect(inferInitialValue(ast(v.boolean()))).toBe(false);
  });

  test("date → Date instance", () => {
    const result = inferInitialValue(ast(v.date()));
    expect(result).toBeInstanceOf(Date);
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

describe("inferInitialValue — wrappers", () => {
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

describe("inferInitialValue — literal", () => {
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

describe("inferInitialValue — choice types", () => {
  test("enum → first value", () => {
    enum Status {
      Active = "active",
      Inactive = "inactive",
    }
    const result = inferInitialValue(ast(v.enum(Status)));
    // Should be the first defined value
    expect(result).toBe("active");
  });

  test("picklist → first option", () => {
    const result = inferInitialValue(ast(v.picklist(["a", "b", "c"])));
    expect(result).toBe("a");
  });

  test("picklist with numbers → first option", () => {
    const result = inferInitialValue(ast(v.picklist([1, 2, 3])));
    expect(result).toBe(1);
  });
});

describe("inferInitialValue — object", () => {
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
    expect(result).toEqual({ name: "", age: 0, active: false });
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
    expect(result).toEqual({ user: { name: "", age: 0 } });
  });
});

describe("inferInitialValue — array and tuple", () => {
  test("array → []", () => {
    expect(inferInitialValue(ast(v.array(v.string())))).toEqual([]);
  });

  test("tuple → []", () => {
    expect(inferInitialValue(ast(v.tuple([v.string(), v.number()])))).toEqual([]);
  });
});

describe("inferInitialValue — union and variant", () => {
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

describe("inferInitialValue — unsupported types", () => {
  test("file → undefined", () => {
    expect(inferInitialValue(ast(v.file()))).toBeUndefined();
  });

  test("blob → undefined", () => {
    expect(inferInitialValue(ast(v.blob()))).toBeUndefined();
  });
});
