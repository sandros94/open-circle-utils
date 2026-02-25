import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { getLiteralValue } from "./get.ts";

describe("literal", () => {
  describe("get", () => {
    describe("getLiteralValue", () => {
      it("returns the string literal value", () => {
        expect(getLiteralValue(v.literal("hello"))).toBe("hello");
      });

      it("returns the number literal value", () => {
        expect(getLiteralValue(v.literal(42))).toBe(42);
      });

      it("returns the boolean literal value", () => {
        expect(getLiteralValue(v.literal(true))).toBe(true);
        expect(getLiteralValue(v.literal(false))).toBe(false);
      });

      it("returns null for non-literal schema", () => {
        expect(getLiteralValue(v.string())).toBeNull();
      });

      it("returns null for number schema", () => {
        expect(getLiteralValue(v.number())).toBeNull();
      });
    });
  });
});
