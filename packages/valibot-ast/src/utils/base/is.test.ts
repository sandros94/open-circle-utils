import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  isAnySchema,
  isBigintSchema,
  isBlobSchema,
  isBooleanSchema,
  isDateSchema,
  isNanSchema,
  isNeverSchema,
  isNullSchema,
  isNumberSchema,
  isStringSchema,
  isSymbolSchema,
  isUndefinedSchema,
  isUnknownSchema,
  isVoidSchema,
} from "./is.ts";

describe("base", () => {
  describe("is", () => {
    describe("isStringSchema", () => {
      it("returns true for string schema", () => {
        expect(isStringSchema(v.string())).toBe(true);
      });
      it("returns false for non-string schema", () => {
        expect(isStringSchema(v.number())).toBe(false);
      });
    });

    describe("isNumberSchema", () => {
      it("returns true for number schema", () => {
        expect(isNumberSchema(v.number())).toBe(true);
      });
      it("returns false for non-number schema", () => {
        expect(isNumberSchema(v.string())).toBe(false);
      });
    });

    describe("isBooleanSchema", () => {
      it("returns true for boolean schema", () => {
        expect(isBooleanSchema(v.boolean())).toBe(true);
      });
      it("returns false for non-boolean schema", () => {
        expect(isBooleanSchema(v.string())).toBe(false);
      });
    });

    describe("isBigintSchema", () => {
      it("returns true for bigint schema", () => {
        expect(isBigintSchema(v.bigint())).toBe(true);
      });
      it("returns false for non-bigint schema", () => {
        expect(isBigintSchema(v.string())).toBe(false);
      });
    });

    describe("isDateSchema", () => {
      it("returns true for date schema", () => {
        expect(isDateSchema(v.date())).toBe(true);
      });
      it("returns false for non-date schema", () => {
        expect(isDateSchema(v.string())).toBe(false);
      });
    });

    describe("isSymbolSchema", () => {
      it("returns true for symbol schema", () => {
        expect(isSymbolSchema(v.symbol())).toBe(true);
      });
      it("returns false for non-symbol schema", () => {
        expect(isSymbolSchema(v.string())).toBe(false);
      });
    });

    describe("isAnySchema", () => {
      it("returns true for any schema", () => {
        expect(isAnySchema(v.any())).toBe(true);
      });
      it("returns false for non-any schema", () => {
        expect(isAnySchema(v.string())).toBe(false);
      });
    });

    describe("isUnknownSchema", () => {
      it("returns true for unknown schema", () => {
        expect(isUnknownSchema(v.unknown())).toBe(true);
      });
      it("returns false for non-unknown schema", () => {
        expect(isUnknownSchema(v.string())).toBe(false);
      });
    });

    describe("isNeverSchema", () => {
      it("returns true for never schema", () => {
        expect(isNeverSchema(v.never())).toBe(true);
      });
      it("returns false for non-never schema", () => {
        expect(isNeverSchema(v.string())).toBe(false);
      });
    });

    describe("isNanSchema", () => {
      it("returns true for nan schema", () => {
        expect(isNanSchema(v.nan())).toBe(true);
      });
      it("returns false for non-nan schema", () => {
        expect(isNanSchema(v.string())).toBe(false);
      });
    });

    describe("isNullSchema", () => {
      it("returns true for null schema", () => {
        expect(isNullSchema(v.null())).toBe(true);
      });
      it("returns false for non-null schema", () => {
        expect(isNullSchema(v.string())).toBe(false);
      });
    });

    describe("isUndefinedSchema", () => {
      it("returns true for undefined schema", () => {
        expect(isUndefinedSchema(v.undefined())).toBe(true);
      });
      it("returns false for non-undefined schema", () => {
        expect(isUndefinedSchema(v.string())).toBe(false);
      });
    });

    describe("isVoidSchema", () => {
      it("returns true for void schema", () => {
        expect(isVoidSchema(v.void())).toBe(true);
      });
      it("returns false for non-void schema", () => {
        expect(isVoidSchema(v.string())).toBe(false);
      });
    });

    describe("isBlobSchema", () => {
      it("returns true for blob schema", () => {
        expect(isBlobSchema(v.blob())).toBe(true);
      });
      it("returns false for non-blob schema", () => {
        expect(isBlobSchema(v.string())).toBe(false);
      });
    });
  });
});
