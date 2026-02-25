import { describe, test, expect } from "vitest";
import { deepMerge } from "./deep-merge.ts";

describe("deepMerge", () => {
  test("shallow merge of flat objects", () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  test("deep merge of nested objects", () => {
    const base = { user: { name: "", age: 0, address: { city: "" } } };
    const override = { user: { name: "John", address: { city: "NYC" } } };
    const result = deepMerge(base, override);
    expect(result).toEqual({
      user: { name: "John", age: 0, address: { city: "NYC" } },
    });
  });

  test("arrays are replaced wholesale (not merged)", () => {
    const result = deepMerge({ tags: [1, 2, 3] }, { tags: [4, 5] });
    expect(result).toEqual({ tags: [4, 5] });
  });

  test("undefined override values are skipped", () => {
    const result = deepMerge({ a: 1, b: 2 }, { a: undefined, b: 3 });
    expect(result).toEqual({ a: 1, b: 3 });
  });

  test("null override replaces value", () => {
    const result = deepMerge({ a: 1 }, { a: null } as any);
    expect(result).toEqual({ a: null });
  });

  test("does not mutate base", () => {
    const base = { a: { b: 1 } };
    const result = deepMerge(base, { a: { b: 2 } });
    expect(base.a.b).toBe(1);
    expect(result.a.b).toBe(2);
  });

  test("empty override returns copy of base", () => {
    const base = { a: 1, b: { c: 2 } };
    const result = deepMerge(base, {});
    expect(result).toEqual(base);
    expect(result).not.toBe(base);
  });
});
