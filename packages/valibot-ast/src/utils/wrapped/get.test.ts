import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { getWrappedSchema } from "./get.ts";

describe("getWrappedSchema", () => {
  it("returns wasWrapped: false for non-wrapped schemas", () => {
    const result = getWrappedSchema(v.string());
    expect(result.wasWrapped).toBe(false);
    expect(result.schema.type).toBe("string");
  });

  it("unwraps optional", () => {
    const result = getWrappedSchema(v.optional(v.string()));
    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
    expect(result.schema.type).toBe("string");
  });

  it("unwraps nullable", () => {
    const result = getWrappedSchema(v.nullable(v.string()));
    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(true);
    expect(result.schema.type).toBe("string");
  });

  it("unwraps nullish", () => {
    const result = getWrappedSchema(v.nullish(v.string()));
    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
    expect(result.schema.type).toBe("string");
  });

  it("outermost wins: optional wrapping nonOptional", () => {
    const result = getWrappedSchema(v.optional(v.nonOptional(v.optional(v.string()))));
    expect(result.required).toBe(false); // optional (outermost) wins
  });

  it("outermost wins: nonOptional wrapping optional", () => {
    const result = getWrappedSchema(v.nonOptional(v.optional(v.string())));
    expect(result.required).toBe(true); // nonOptional (outermost) wins
  });

  it("captures default value", () => {
    const result = getWrappedSchema(v.optional(v.string(), "fallback"));
    expect(result.defaultValue).toBe("fallback");
  });

  it("deeply nested wrappers", () => {
    const result = getWrappedSchema(v.optional(v.nullable(v.nonOptional(v.string()))));
    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(false); // optional (outermost) wins
    expect(result.nullable).toBe(true); // nullable (second layer)
    expect(result.schema.type).toBe("string");
  });
});
