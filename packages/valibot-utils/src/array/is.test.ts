import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { isArraySchema, isTupleSchema, isTupleWithRestSchema } from "./is.ts";

describe("isArraySchema", () => {
  test("Array schemas", () => {
    const schema = v.array(v.string());

    expect(isArraySchema(schema)).toBe(true);
  });

  test("Non-array schemas", () => {
    expect(isArraySchema(v.string())).toBe(false);
    expect(isArraySchema(v.number())).toBe(false);
    expect(isArraySchema(v.object({ name: v.string() }))).toBe(false);
    expect(isArraySchema(v.tuple([v.string(), v.number()]))).toBe(false);
  });
});

describe("isTupleSchema", () => {
  test("Tuple schemas", () => {
    const schema = v.tuple([v.string(), v.number()]);

    expect(isTupleSchema(schema)).toBe(true);
  });

  test("Loose tuple schemas", () => {
    const schema = v.looseTuple([v.string(), v.number()]);

    expect(isTupleSchema(schema)).toBe(true);
  });

  test("Strict tuple schemas", () => {
    const schema = v.strictTuple([v.string(), v.number()]);

    expect(isTupleSchema(schema)).toBe(true);
  });

  test("Tuple with rest schemas", () => {
    const schema = v.tupleWithRest([v.string(), v.number()], v.boolean());

    expect(isTupleSchema(schema)).toBe(true);
  });

  test("Non-tuple schemas", () => {
    expect(isTupleSchema(v.string())).toBe(false);
    expect(isTupleSchema(v.array(v.string()))).toBe(false);
    expect(isTupleSchema(v.object({ name: v.string() }))).toBe(false);
  });
});

describe("isTupleWithRestSchema", () => {
  test("Tuple with rest schemas", () => {
    const schema = v.tupleWithRest([v.string(), v.number()], v.boolean());

    expect(isTupleWithRestSchema(schema)).toBe(true);
  });

  test("Non-tuple with rest schemas", () => {
    expect(isTupleWithRestSchema(v.tuple([v.string()]))).toBe(false);
    expect(isTupleWithRestSchema(v.looseTuple([v.string()]))).toBe(false);
    expect(isTupleWithRestSchema(v.strictTuple([v.string()]))).toBe(false);
    expect(isTupleWithRestSchema(v.array(v.string()))).toBe(false);
  });
});

test("early return false when schema has no type property", () => {
  const noType = {} as any;
  expect(isArraySchema(noType)).toBe(false);
  expect(isTupleSchema(noType)).toBe(false);
  expect(isTupleWithRestSchema(noType)).toBe(false);
});
