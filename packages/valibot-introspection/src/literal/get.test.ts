import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { getLiteralValue } from "./get.ts";

describe("getLiteralValue", () => {
  test("string literal", () => {
    const schema = v.literal("test");
    expect(getLiteralValue(schema)).toBe("test");
  });

  test("number literal", () => {
    const schema = v.literal(123);
    expect(getLiteralValue(schema)).toBe(123);
  });

  test("boolean literal", () => {
    const schema = v.literal(true);
    expect(getLiteralValue(schema)).toBe(true);
  });

  test("not a literal schema", () => {
    expect(getLiteralValue(v.string())).toBe(null);
  });
});
