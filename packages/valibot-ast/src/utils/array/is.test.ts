import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { isArraySchema, isTupleSchema, isTupleWithRestSchema } from "./is.ts";

describe("array", () => {
  describe("is", () => {
    describe("isArraySchema", () => {
      it("returns true for array schema", () => {
        expect(isArraySchema(v.array(v.string()))).toBe(true);
      });

      it("returns false for non-array schema", () => {
        expect(isArraySchema(v.string())).toBe(false);
      });

      it("returns false for tuple schema", () => {
        expect(isArraySchema(v.tuple([v.string()]))).toBe(false);
      });
    });

    describe("isTupleSchema", () => {
      it("returns true for tuple schema", () => {
        expect(isTupleSchema(v.tuple([v.string()]))).toBe(true);
      });

      it("returns true for looseTuple schema", () => {
        expect(isTupleSchema(v.looseTuple([v.string()]))).toBe(true);
      });

      it("returns true for strictTuple schema", () => {
        expect(isTupleSchema(v.strictTuple([v.string()]))).toBe(true);
      });

      it("returns true for tupleWithRest schema", () => {
        expect(isTupleSchema(v.tupleWithRest([v.string()], v.number()))).toBe(true);
      });

      it("returns false for array schema", () => {
        expect(isTupleSchema(v.array(v.string()))).toBe(false);
      });

      it("returns false for non-tuple schema", () => {
        expect(isTupleSchema(v.string())).toBe(false);
      });
    });

    describe("isTupleWithRestSchema", () => {
      it("returns true for tupleWithRest schema", () => {
        expect(isTupleWithRestSchema(v.tupleWithRest([v.string()], v.number()))).toBe(true);
      });

      it("returns false for plain tuple schema", () => {
        expect(isTupleWithRestSchema(v.tuple([v.string()]))).toBe(false);
      });

      it("returns false for looseTuple schema", () => {
        expect(isTupleWithRestSchema(v.looseTuple([v.string()]))).toBe(false);
      });

      it("returns false for non-tuple schema", () => {
        expect(isTupleWithRestSchema(v.string())).toBe(false);
      });
    });
  });
});
