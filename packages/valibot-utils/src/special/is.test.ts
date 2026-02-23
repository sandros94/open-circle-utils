import { test, expect } from "vitest";
import * as v from "valibot";

import {
  isIntersectSchema,
  isInstanceSchema,
  isMapSchema,
  isSetSchema,
  isFunctionSchema,
} from "./is.ts";

test("isIntersectSchema", () => {
  const schema = v.intersect([v.object({ name: v.string() }), v.object({ age: v.number() })]);
  expect(isIntersectSchema(schema)).toBe(true);
  expect(isIntersectSchema(v.string())).toBe(false);
});

test("isInstanceSchema", () => {
  class MyClass {}
  const schema = v.instance(MyClass);
  expect(isInstanceSchema(schema)).toBe(true);
  expect(isInstanceSchema(v.string())).toBe(false);
});

test("isMapSchema", () => {
  const schema = v.map(v.string(), v.number());
  expect(isMapSchema(schema)).toBe(true);
  expect(isMapSchema(v.string())).toBe(false);
});

test("isSetSchema", () => {
  const schema = v.set(v.string());
  expect(isSetSchema(schema)).toBe(true);
  expect(isSetSchema(v.string())).toBe(false);
});

test("isFunctionSchema", () => {
  const schema = v.function_();
  expect(isFunctionSchema(schema)).toBe(true);
  expect(isFunctionSchema(v.string())).toBe(false);
});

test("early return false when schema has no type property", () => {
  const noType = {} as any;
  expect(isIntersectSchema(noType)).toBe(false);
  expect(isInstanceSchema(noType)).toBe(false);
  expect(isMapSchema(noType)).toBe(false);
  expect(isSetSchema(noType)).toBe(false);
  expect(isFunctionSchema(noType)).toBe(false);
});
