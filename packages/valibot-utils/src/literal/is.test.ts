import { test, expect } from "vitest";
import * as v from "valibot";
import { isLiteralSchema } from "./is.ts";
import { getLiteralValue } from "./get.ts";

test("isLiteralSchema", () => {
  expect(isLiteralSchema(v.literal("hello"))).toBe(true);
  expect(isLiteralSchema(v.literal(42))).toBe(true);
  expect(isLiteralSchema(v.literal(true))).toBe(true);
  expect(isLiteralSchema(v.string())).toBe(false);
});

test("getLiteralValue", () => {
  expect(getLiteralValue(v.literal("hello"))).toBe("hello");
  expect(getLiteralValue(v.literal(42))).toBe(42);
  expect(getLiteralValue(v.literal(true))).toBe(true);
  expect(getLiteralValue(v.literal(false))).toBe(false);
  expect(getLiteralValue(v.string())).toBe(null);
});
