import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { getSchemaType } from "./get.ts";

describe("getSchemaType", () => {
  test("string", () => {
    expect(getSchemaType(v.string())).toBe("string");
  });

  test("number", () => {
    expect(getSchemaType(v.number())).toBe("number");
  });

  test("boolean", () => {
    expect(getSchemaType(v.boolean())).toBe("boolean");
  });

  test("object", () => {
    expect(getSchemaType(v.object({ name: v.string() }))).toBe("object");
  });

  test("array", () => {
    expect(getSchemaType(v.array(v.string()))).toBe("array");
  });

  test("wrapped (optional)", () => {
    expect(getSchemaType(v.optional(v.string()))).toBe("optional");
  });
});
