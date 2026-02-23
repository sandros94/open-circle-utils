import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { inferInputType } from "./infer-input-type.ts";

function ast(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return schemaToAST(schema).schema;
}

describe("inferInputType — string variants", () => {
  test("plain string → 'text'", () => {
    expect(inferInputType(ast(v.string()))).toBe("text");
  });

  test("string + email → 'email'", () => {
    expect(inferInputType(ast(v.pipe(v.string(), v.email())))).toBe("email");
  });

  test("string + url → 'url'", () => {
    expect(inferInputType(ast(v.pipe(v.string(), v.url())))).toBe("url");
  });

  test("string + isoDate → 'date'", () => {
    expect(inferInputType(ast(v.pipe(v.string(), v.isoDate())))).toBe("date");
  });

  test("string + isoDateTime → 'datetime-local'", () => {
    expect(inferInputType(ast(v.pipe(v.string(), v.isoDateTime())))).toBe("datetime-local");
  });

  test("string + isoTimestamp → 'datetime-local'", () => {
    expect(inferInputType(ast(v.pipe(v.string(), v.isoTimestamp())))).toBe("datetime-local");
  });

  test("string + isoTime → 'time'", () => {
    expect(inferInputType(ast(v.pipe(v.string(), v.isoTime())))).toBe("time");
  });

  test("string + isoWeek → 'week'", () => {
    expect(inferInputType(ast(v.pipe(v.string(), v.isoWeek())))).toBe("week");
  });

  test("string + hexColor → 'color'", () => {
    expect(inferInputType(ast(v.pipe(v.string(), v.hexColor())))).toBe("color");
  });

  test("string + multiple validators uses first matched format", () => {
    // email check comes first in the switch
    expect(inferInputType(ast(v.pipe(v.string(), v.email(), v.minLength(3))))).toBe("email");
  });
});

describe("inferInputType — numeric types", () => {
  test("number → 'number'", () => {
    expect(inferInputType(ast(v.number()))).toBe("number");
  });

  test("bigint → 'number'", () => {
    expect(inferInputType(ast(v.bigint()))).toBe("number");
  });
});

describe("inferInputType — boolean", () => {
  test("boolean → 'checkbox'", () => {
    expect(inferInputType(ast(v.boolean()))).toBe("checkbox");
  });
});

describe("inferInputType — date", () => {
  test("date schema → 'date'", () => {
    expect(inferInputType(ast(v.date()))).toBe("date");
  });
});

describe("inferInputType — file types", () => {
  test("file → 'file'", () => {
    expect(inferInputType(ast(v.file()))).toBe("file");
  });

  test("blob → 'file'", () => {
    expect(inferInputType(ast(v.blob()))).toBe("file");
  });
});

describe("inferInputType — wrapper transparency", () => {
  test("optional(string) → 'text' (unwraps)", () => {
    expect(inferInputType(ast(v.optional(v.string())))).toBe("text");
  });

  test("nullable(string + email) → 'email' (unwraps)", () => {
    expect(inferInputType(ast(v.nullable(v.pipe(v.string(), v.email()))))).toBe("email");
  });

  test("nullish(number) → 'number' (unwraps)", () => {
    expect(inferInputType(ast(v.nullish(v.number())))).toBe("number");
  });

  test("optional(boolean) → 'checkbox' (unwraps)", () => {
    expect(inferInputType(ast(v.optional(v.boolean())))).toBe("checkbox");
  });
});

describe("inferInputType — structural and choice types → undefined", () => {
  test("object → undefined", () => {
    expect(inferInputType(ast(v.object({ a: v.string() })))).toBeUndefined();
  });

  test("array → undefined", () => {
    expect(inferInputType(ast(v.array(v.string())))).toBeUndefined();
  });

  test("tuple → undefined", () => {
    expect(inferInputType(ast(v.tuple([v.string(), v.number()])))).toBeUndefined();
  });

  test("enum → undefined", () => {
    enum Color {
      Red = "red",
      Blue = "blue",
    }
    expect(inferInputType(ast(v.enum(Color)))).toBeUndefined();
  });

  test("picklist → undefined", () => {
    expect(inferInputType(ast(v.picklist(["a", "b", "c"])))).toBeUndefined();
  });

  test("union → undefined", () => {
    expect(inferInputType(ast(v.union([v.string(), v.number()])))).toBeUndefined();
  });

  test("literal → undefined", () => {
    expect(inferInputType(ast(v.literal("fixed")))).toBeUndefined();
  });

  test("any → undefined", () => {
    expect(inferInputType(ast(v.any()))).toBeUndefined();
  });

  test("unknown → undefined", () => {
    expect(inferInputType(ast(v.unknown()))).toBeUndefined();
  });

  test("unrecognised node type → undefined (default branch)", () => {
    // A hypothetical future or custom schema type not in the switch cases
    const node = { kind: "schema" as const, type: "custom_unknown" } as any;
    expect(inferInputType(node)).toBeUndefined();
  });
});
