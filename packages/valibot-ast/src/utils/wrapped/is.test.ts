import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { isWrappedSchema } from "./is.ts";

describe("wrapped", () => {
  describe("is", () => {
    describe("isWrappedSchema", () => {
      it("returns true for optional schema", () => {
        expect(isWrappedSchema(v.optional(v.string()))).toBe(true);
      });

      it("returns true for nullable schema", () => {
        expect(isWrappedSchema(v.nullable(v.string()))).toBe(true);
      });

      it("returns true for nullish schema", () => {
        expect(isWrappedSchema(v.nullish(v.string()))).toBe(true);
      });

      it("returns true for nonOptional schema", () => {
        expect(isWrappedSchema(v.nonOptional(v.optional(v.string())))).toBe(true);
      });

      it("returns true for nonNullable schema", () => {
        expect(isWrappedSchema(v.nonNullable(v.nullable(v.string())))).toBe(true);
      });

      it("returns true for nonNullish schema", () => {
        expect(isWrappedSchema(v.nonNullish(v.nullish(v.string())))).toBe(true);
      });

      it("returns true for exactOptional schema", () => {
        expect(isWrappedSchema(v.exactOptional(v.string()))).toBe(true);
      });

      it("returns true for undefinedable schema", () => {
        expect(isWrappedSchema(v.undefinedable(v.string()))).toBe(true);
      });

      it("returns false for plain string schema", () => {
        expect(isWrappedSchema(v.string())).toBe(false);
      });

      it("returns false for plain object schema", () => {
        expect(isWrappedSchema(v.object({}))).toBe(false);
      });

      it("returns false for array schema", () => {
        expect(isWrappedSchema(v.array(v.string()))).toBe(false);
      });
    });
  });
});
