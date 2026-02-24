import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { isObjectSchema, isObjectWithRestSchema } from "./is.ts";

describe("object", () => {
  describe("is", () => {
    describe("isObjectSchema", () => {
      it("returns true for object schema", () => {
        expect(isObjectSchema(v.object({ name: v.string() }))).toBe(true);
      });

      it("returns true for looseObject schema", () => {
        expect(isObjectSchema(v.looseObject({ x: v.number() }))).toBe(true);
      });

      it("returns true for strictObject schema", () => {
        expect(isObjectSchema(v.strictObject({ y: v.boolean() }))).toBe(true);
      });

      it("returns true for objectWithRest schema", () => {
        expect(isObjectSchema(v.objectWithRest({}, v.string()))).toBe(true);
      });

      it("returns false for string schema", () => {
        expect(isObjectSchema(v.string())).toBe(false);
      });

      it("returns false for array schema", () => {
        expect(isObjectSchema(v.array(v.string()))).toBe(false);
      });

      it("returns false for record schema", () => {
        expect(isObjectSchema(v.record(v.string(), v.number()))).toBe(false);
      });
    });

    describe("isObjectWithRestSchema", () => {
      it("returns true for objectWithRest schema", () => {
        expect(isObjectWithRestSchema(v.objectWithRest({ a: v.string() }, v.number()))).toBe(true);
      });

      it("returns false for plain object schema", () => {
        expect(isObjectWithRestSchema(v.object({ a: v.string() }))).toBe(false);
      });

      it("returns false for looseObject schema", () => {
        expect(isObjectWithRestSchema(v.looseObject({}))).toBe(false);
      });

      it("returns false for string schema", () => {
        expect(isObjectWithRestSchema(v.string())).toBe(false);
      });
    });
  });
});
