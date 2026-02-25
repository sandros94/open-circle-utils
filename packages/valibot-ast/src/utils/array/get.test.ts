import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { getArrayItem, getTupleItems, getTupleRest } from "./get.ts";

describe("array", () => {
  describe("get", () => {
    describe("getArrayItem", () => {
      it("returns the item schema for an array schema", () => {
        const schema = v.array(v.string());
        const item = getArrayItem(schema);
        expect(item).not.toBeNull();
        expect(item!.type).toBe("string");
      });

      it("returns item for array of numbers", () => {
        const schema = v.array(v.number());
        const item = getArrayItem(schema);
        expect(item!.type).toBe("number");
      });

      it("returns null for non-array schema", () => {
        expect(getArrayItem(v.string())).toBeNull();
      });

      it("returns null for tuple schema", () => {
        expect(getArrayItem(v.tuple([v.string()]))).toBeNull();
      });
    });

    describe("getTupleItems", () => {
      it("returns items array for tuple schema", () => {
        const schema = v.tuple([v.string(), v.number()]);
        const items = getTupleItems(schema);
        expect(items).not.toBeNull();
        expect(Array.isArray(items)).toBe(true);
        expect(items!.length).toBe(2);
        expect(items![0].type).toBe("string");
        expect(items![1].type).toBe("number");
      });

      it("returns items for looseTuple schema", () => {
        const schema = v.looseTuple([v.boolean()]);
        const items = getTupleItems(schema);
        expect(items![0].type).toBe("boolean");
      });

      it("returns items for strictTuple schema", () => {
        const schema = v.strictTuple([v.string()]);
        const items = getTupleItems(schema);
        expect(items![0].type).toBe("string");
      });

      it("returns items for tupleWithRest schema", () => {
        const schema = v.tupleWithRest([v.string()], v.number());
        const items = getTupleItems(schema);
        expect(items).not.toBeNull();
        expect(items![0].type).toBe("string");
      });

      it("returns null for non-tuple schema", () => {
        expect(getTupleItems(v.string())).toBeNull();
      });

      it("returns null for array schema", () => {
        expect(getTupleItems(v.array(v.string()))).toBeNull();
      });
    });

    describe("getTupleRest", () => {
      it("returns rest schema for tupleWithRest", () => {
        const schema = v.tupleWithRest([v.string()], v.number());
        const rest = getTupleRest(schema);
        expect(rest).not.toBeNull();
        expect(rest!.type).toBe("number");
      });

      it("returns null for plain tuple schema", () => {
        expect(getTupleRest(v.tuple([v.string()]))).toBeNull();
      });

      it("returns null for looseTuple schema", () => {
        expect(getTupleRest(v.looseTuple([v.string()]))).toBeNull();
      });

      it("returns null for non-tuple schema", () => {
        expect(getTupleRest(v.string())).toBeNull();
      });
    });
  });
});
