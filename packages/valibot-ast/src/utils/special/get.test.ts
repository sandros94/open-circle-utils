import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  getIntersectOptions,
  getInstanceClass,
  getMapKey,
  getMapValue,
  getSetItem,
} from "./get.ts";

describe("special", () => {
  describe("get", () => {
    describe("getIntersectOptions", () => {
      it("returns options array for intersect schema", () => {
        const schema = v.intersect([
          v.object({ a: v.string() }),
          v.object({ b: v.number() }),
        ]);
        const options = getIntersectOptions(schema);
        expect(options).not.toBeNull();
        expect(Array.isArray(options)).toBe(true);
        expect(options!.length).toBe(2);
      });

      it("returns null for non-intersect schema", () => {
        expect(getIntersectOptions(v.string())).toBeNull();
      });

      it("returns null for union schema", () => {
        expect(getIntersectOptions(v.union([v.string(), v.number()]))).toBeNull();
      });
    });

    describe("getInstanceClass", () => {
      it("returns the class for an instance schema", () => {
        const schema = v.instance(Date);
        const cls = getInstanceClass(schema);
        expect(cls).not.toBeNull();
        expect(cls).toBe(Date);
      });

      it("returns the custom class for custom instance schema", () => {
        class MyError extends Error {}
        const schema = v.instance(MyError);
        const cls = getInstanceClass(schema);
        expect(cls).toBe(MyError);
      });

      it("returns null for non-instance schema", () => {
        expect(getInstanceClass(v.string())).toBeNull();
      });

      it("returns null for object schema", () => {
        expect(getInstanceClass(v.object({}))).toBeNull();
      });
    });

    describe("getMapKey", () => {
      it("returns the key schema for a map schema", () => {
        const schema = v.map(v.string(), v.number());
        const key = getMapKey(schema);
        expect(key).not.toBeNull();
        expect(key!.type).toBe("string");
      });

      it("returns null for non-map schema", () => {
        expect(getMapKey(v.string())).toBeNull();
      });

      it("returns null for record schema", () => {
        expect(getMapKey(v.record(v.string(), v.number()))).toBeNull();
      });
    });

    describe("getMapValue", () => {
      it("returns the value schema for a map schema", () => {
        const schema = v.map(v.string(), v.number());
        const value = getMapValue(schema);
        expect(value).not.toBeNull();
        expect(value!.type).toBe("number");
      });

      it("returns null for non-map schema", () => {
        expect(getMapValue(v.string())).toBeNull();
      });
    });

    describe("getSetItem", () => {
      it("returns the item schema for a set schema", () => {
        const schema = v.set(v.string());
        const item = getSetItem(schema);
        expect(item).not.toBeNull();
        expect(item!.type).toBe("string");
      });

      it("returns item for set of numbers", () => {
        const schema = v.set(v.number());
        const item = getSetItem(schema);
        expect(item!.type).toBe("number");
      });

      it("returns null for non-set schema", () => {
        expect(getSetItem(v.string())).toBeNull();
      });

      it("returns null for array schema", () => {
        expect(getSetItem(v.array(v.string()))).toBeNull();
      });
    });
  });
});
