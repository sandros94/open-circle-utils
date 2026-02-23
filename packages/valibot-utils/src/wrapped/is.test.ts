import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { isWrappedSchema } from "./is.ts";

describe("isWrappedSchema", () => {
  test("isWrappedSchema - Wrapped schemas", () => {
    expect(isWrappedSchema(v.exactOptional(v.string()))).toBe(true);
    expect(isWrappedSchema(v.nonNullable(v.number()))).toBe(true);
    expect(isWrappedSchema(v.nonNullish(v.boolean()))).toBe(true);
    expect(isWrappedSchema(v.nonOptional(v.string()))).toBe(true);
    expect(isWrappedSchema(v.nullable(v.number()))).toBe(true);
    expect(isWrappedSchema(v.nullish(v.boolean()))).toBe(true);
    expect(isWrappedSchema(v.optional(v.string()))).toBe(true);
    expect(isWrappedSchema(v.undefinedable(v.string()))).toBe(true);
  });

  test("isWrappedSchema - Non-wrapped schemas", () => {
    expect(isWrappedSchema(v.string())).toBe(false);
    expect(isWrappedSchema(v.number())).toBe(false);
    expect(isWrappedSchema(v.array(v.string()))).toBe(false);
    expect(isWrappedSchema(v.boolean())).toBe(false);
  });
});

test("early return false when schema has no type property", () => {
  expect(isWrappedSchema({} as any)).toBe(false);
});
