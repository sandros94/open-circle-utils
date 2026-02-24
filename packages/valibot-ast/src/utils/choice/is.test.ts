import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { isEnumSchema, isPicklistSchema, isUnionSchema, isVariantSchema } from "./is.ts";

enum Color {
  Red = "red",
  Blue = "blue",
}

describe("choice", () => {
  describe("is", () => {
    describe("isEnumSchema", () => {
      it("returns true for enum schema", () => {
        expect(isEnumSchema(v.enum(Color))).toBe(true);
      });

      it("returns false for non-enum schema", () => {
        expect(isEnumSchema(v.string())).toBe(false);
      });

      it("returns false for picklist schema", () => {
        expect(isEnumSchema(v.picklist(["a", "b"]))).toBe(false);
      });
    });

    describe("isPicklistSchema", () => {
      it("returns true for picklist schema", () => {
        expect(isPicklistSchema(v.picklist(["a", "b", "c"]))).toBe(true);
      });

      it("returns false for non-picklist schema", () => {
        expect(isPicklistSchema(v.string())).toBe(false);
      });

      it("returns false for enum schema", () => {
        expect(isPicklistSchema(v.enum(Color))).toBe(false);
      });
    });

    describe("isUnionSchema", () => {
      it("returns true for union schema", () => {
        expect(isUnionSchema(v.union([v.string(), v.number()]))).toBe(true);
      });

      it("returns false for non-union schema", () => {
        expect(isUnionSchema(v.string())).toBe(false);
      });

      it("returns false for variant schema", () => {
        expect(isUnionSchema(v.variant("type", [v.object({ type: v.literal("a") })]))).toBe(false);
      });
    });

    describe("isVariantSchema", () => {
      it("returns true for variant schema", () => {
        const schema = v.variant("type", [
          v.object({ type: v.literal("a") }),
          v.object({ type: v.literal("b") }),
        ]);
        expect(isVariantSchema(schema)).toBe(true);
      });

      it("returns false for non-variant schema", () => {
        expect(isVariantSchema(v.string())).toBe(false);
      });

      it("returns false for union schema", () => {
        expect(isVariantSchema(v.union([v.string(), v.number()]))).toBe(false);
      });
    });
  });
});
