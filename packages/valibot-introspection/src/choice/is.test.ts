import { describe, test, expect } from "vitest";
import * as v from "valibot";

import {
  isEnumSchema,
  isPicklistSchema,
  isUnionSchema,
  isVariantSchema,
} from "./is.ts";

enum TestEnum {
  A = "a",
  B = "b",
  C = "c",
}

describe("isEnumSchema", () => {
  test("Enum schemas", () => {
    const schema = v.enum_(TestEnum);

    expect(isEnumSchema(schema)).toBe(true);
  });

  test("Non-enum schemas", () => {
    expect(isEnumSchema(v.string())).toBe(false);
    expect(isEnumSchema(v.picklist(["a", "b", "c"]))).toBe(false);
    expect(isEnumSchema(v.union([v.string(), v.number()]))).toBe(false);
  });
});

describe("isPicklistSchema", () => {
  test("Picklist schemas", () => {
    const schema = v.picklist(["a", "b", "c"]);

    expect(isPicklistSchema(schema)).toBe(true);
  });

  test("Non-picklist schemas", () => {
    expect(isPicklistSchema(v.string())).toBe(false);
    expect(isPicklistSchema(v.enum_(TestEnum))).toBe(false);
    expect(isPicklistSchema(v.union([v.string(), v.number()]))).toBe(false);
  });
});

describe("isUnionSchema", () => {
  test("Union schemas", () => {
    const schema = v.union([v.string(), v.number()]);

    expect(isUnionSchema(schema)).toBe(true);
  });

  test("Non-union schemas", () => {
    expect(isUnionSchema(v.string())).toBe(false);
    expect(isUnionSchema(v.picklist(["a", "b", "c"]))).toBe(false);
    expect(
      isUnionSchema(
        v.variant("type", [
          v.object({ type: v.literal("a"), value: v.string() }),
          v.object({ type: v.literal("b"), value: v.number() }),
        ]),
      ),
    ).toBe(false);
  });
});

describe("isVariantSchema", () => {
  test("isVariantSchema - Variant schemas", () => {
    const schema = v.variant("type", [
      v.object({ type: v.literal("a"), value: v.string() }),
      v.object({ type: v.literal("b"), value: v.number() }),
    ]);

    expect(isVariantSchema(schema)).toBe(true);
  });

  test("isVariantSchema - Non-variant schemas", () => {
    expect(isVariantSchema(v.string())).toBe(false);
    expect(isVariantSchema(v.union([v.string(), v.number()]))).toBe(false);
  });
});
