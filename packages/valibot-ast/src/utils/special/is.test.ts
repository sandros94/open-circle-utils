import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  isIntersectSchema,
  isInstanceSchema,
  isMapSchema,
  isSetSchema,
  isFunctionSchema,
} from "./is.ts";

describe("special", () => {
  describe("is", () => {
    describe("isIntersectSchema", () => {
      it("returns true for intersect schema", () => {
        const schema = v.intersect([
          v.object({ a: v.string() }),
          v.object({ b: v.number() }),
        ]);
        expect(isIntersectSchema(schema)).toBe(true);
      });

      it("returns false for union schema", () => {
        expect(isIntersectSchema(v.union([v.string(), v.number()]))).toBe(false);
      });

      it("returns false for string schema", () => {
        expect(isIntersectSchema(v.string())).toBe(false);
      });
    });

    describe("isInstanceSchema", () => {
      it("returns true for instance schema with Date", () => {
        expect(isInstanceSchema(v.instance(Date))).toBe(true);
      });

      it("returns true for instance schema with custom class", () => {
        class MyClass {}
        expect(isInstanceSchema(v.instance(MyClass))).toBe(true);
      });

      it("returns false for string schema", () => {
        expect(isInstanceSchema(v.string())).toBe(false);
      });

      it("returns false for object schema", () => {
        expect(isInstanceSchema(v.object({}))).toBe(false);
      });
    });

    describe("isMapSchema", () => {
      it("returns true for map schema", () => {
        expect(isMapSchema(v.map(v.string(), v.number()))).toBe(true);
      });

      it("returns false for record schema", () => {
        expect(isMapSchema(v.record(v.string(), v.number()))).toBe(false);
      });

      it("returns false for string schema", () => {
        expect(isMapSchema(v.string())).toBe(false);
      });
    });

    describe("isSetSchema", () => {
      it("returns true for set schema", () => {
        expect(isSetSchema(v.set(v.string()))).toBe(true);
      });

      it("returns false for array schema", () => {
        expect(isSetSchema(v.array(v.string()))).toBe(false);
      });

      it("returns false for string schema", () => {
        expect(isSetSchema(v.string())).toBe(false);
      });
    });

    describe("isFunctionSchema", () => {
      it("returns true for function schema", () => {
        expect(isFunctionSchema(v.function())).toBe(true);
      });

      it("returns false for string schema", () => {
        expect(isFunctionSchema(v.string())).toBe(false);
      });

      it("returns false for object schema", () => {
        expect(isFunctionSchema(v.object({}))).toBe(false);
      });
    });
  });
});
