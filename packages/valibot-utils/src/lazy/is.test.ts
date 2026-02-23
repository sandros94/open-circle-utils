import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { isLazySchema } from "./is.ts";

describe("isLazySchema", () => {
  test("Lazy schemas", () => {
    const lazySchema = v.lazy(() => v.string());
    expect(isLazySchema(lazySchema)).toBe(true);
  });

  test("Non-lazy schemas", () => {
    expect(isLazySchema(v.string())).toBe(false);
    expect(isLazySchema(v.number())).toBe(false);
    expect(isLazySchema(v.array(v.string()))).toBe(false);
    expect(isLazySchema(v.boolean())).toBe(false);
  });
});

test("early return false when schema has no type property", () => {
  expect(isLazySchema({} as any)).toBe(false);
});
