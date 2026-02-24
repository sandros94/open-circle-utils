import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  getEnumOptions,
  getPicklistOptions,
  getUnionOptions,
  getVariantOptions,
  getVariantKey,
} from "./get.ts";

enum Status {
  Active = "active",
  Inactive = "inactive",
}

describe("choice", () => {
  describe("get", () => {
    describe("getEnumOptions", () => {
      it("returns the enum object for an enum schema", () => {
        const schema = v.enum(Status);
        const options = getEnumOptions(schema);
        expect(options).not.toBeNull();
        expect(options).toEqual(Status);
      });

      it("returns null for non-enum schema", () => {
        expect(getEnumOptions(v.string())).toBeNull();
      });

      it("returns null for picklist schema", () => {
        expect(getEnumOptions(v.picklist(["a"]))).toBeNull();
      });
    });

    describe("getPicklistOptions", () => {
      it("returns the options array for a picklist schema", () => {
        const schema = v.picklist(["a", "b", "c"]);
        const options = getPicklistOptions(schema);
        expect(options).not.toBeNull();
        expect(options).toEqual(["a", "b", "c"]);
      });

      it("returns null for non-picklist schema", () => {
        expect(getPicklistOptions(v.string())).toBeNull();
      });
    });

    describe("getUnionOptions", () => {
      it("returns options array for a union schema", () => {
        const schema = v.union([v.string(), v.number()]);
        const options = getUnionOptions(schema);
        expect(options).not.toBeNull();
        expect(Array.isArray(options)).toBe(true);
        expect(options!.length).toBe(2);
        expect(options![0].type).toBe("string");
        expect(options![1].type).toBe("number");
      });

      it("returns null for non-union schema", () => {
        expect(getUnionOptions(v.string())).toBeNull();
      });
    });

    describe("getVariantOptions", () => {
      it("returns options array for a variant schema", () => {
        const schema = v.variant("type", [
          v.object({ type: v.literal("a") }),
          v.object({ type: v.literal("b") }),
        ]);
        const options = getVariantOptions(schema);
        expect(options).not.toBeNull();
        expect(Array.isArray(options)).toBe(true);
        expect(options!.length).toBe(2);
      });

      it("returns null for non-variant schema", () => {
        expect(getVariantOptions(v.string())).toBeNull();
      });
    });

    describe("getVariantKey", () => {
      it("returns the discriminant key for a variant schema", () => {
        const schema = v.variant("kind", [v.object({ kind: v.literal("x") })]);
        const key = getVariantKey(schema);
        expect(key).toBe("kind");
      });

      it("returns null for non-variant schema", () => {
        expect(getVariantKey(v.string())).toBeNull();
      });

      it("returns null for union schema", () => {
        expect(getVariantKey(v.union([v.string(), v.number()]))).toBeNull();
      });
    });
  });
});
