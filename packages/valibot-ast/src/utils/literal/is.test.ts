import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { isLiteralSchema } from "./is.ts";

describe("literal", () => {
  describe("is", () => {
    describe("isLiteralSchema", () => {
      it("returns true for string literal schema", () => {
        expect(isLiteralSchema(v.literal("hello"))).toBe(true);
      });

      it("returns true for number literal schema", () => {
        expect(isLiteralSchema(v.literal(42))).toBe(true);
      });

      it("returns true for boolean literal schema", () => {
        expect(isLiteralSchema(v.literal(true))).toBe(true);
      });

      it("returns false for string schema", () => {
        expect(isLiteralSchema(v.string())).toBe(false);
      });

      it("returns false for number schema", () => {
        expect(isLiteralSchema(v.number())).toBe(false);
      });

      it("returns false for picklist schema", () => {
        expect(isLiteralSchema(v.picklist(["a", "b"]))).toBe(false);
      });
    });
  });
});
