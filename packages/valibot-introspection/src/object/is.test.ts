import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { isObjectSchema, isObjectWithRestSchema } from "./is.ts";

describe("isObjectSchema", () => {
  test("Object schemas", () => {
    const schema = v.object({ name: v.string() });

    expect(isObjectSchema(schema)).toBe(true);
  });

  test("Non-object schemas", () => {
    expect(isObjectSchema(v.string())).toBe(false);
    expect(isObjectSchema(v.number())).toBe(false);
    expect(isObjectSchema(v.array(v.string()))).toBe(false);
    expect(isObjectSchema(v.boolean())).toBe(false);
  });
});

describe("isObjectWithRestSchema", () => {
  test("Object with rest schemas", () => {
    const schema = v.objectWithRest({ name: v.string() }, v.number());

    expect(isObjectWithRestSchema(schema)).toBe(true);
  });

  test("Non-tuple with rest schemas", () => {
    expect(isObjectWithRestSchema(v.tuple([v.string()]))).toBe(false);
    expect(isObjectWithRestSchema(v.looseTuple([v.string()]))).toBe(false);
    expect(isObjectWithRestSchema(v.strictTuple([v.string()]))).toBe(false);
    expect(isObjectWithRestSchema(v.array(v.string()))).toBe(false);
  });
});
