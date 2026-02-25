import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { getRecordKey, getRecordValue } from "./get.ts";

describe("record", () => {
  describe("get", () => {
    describe("getRecordKey", () => {
      it("returns the key schema for a record schema", () => {
        const schema = v.record(v.string(), v.number());
        const key = getRecordKey(schema);
        expect(key).not.toBeNull();
        expect(key!.type).toBe("string");
      });

      it("returns the key schema for a record with picklist key", () => {
        const schema = v.record(v.picklist(["a", "b"]), v.number());
        const key = getRecordKey(schema);
        expect(key!.type).toBe("picklist");
      });

      it("returns null for non-record schema", () => {
        expect(getRecordKey(v.string())).toBeNull();
      });

      it("returns null for object schema", () => {
        expect(getRecordKey(v.object({ a: v.string() }))).toBeNull();
      });
    });

    describe("getRecordValue", () => {
      it("returns the value schema for a record schema", () => {
        const schema = v.record(v.string(), v.number());
        const value = getRecordValue(schema);
        expect(value).not.toBeNull();
        expect(value!.type).toBe("number");
      });

      it("returns the value schema for a nested value", () => {
        const schema = v.record(v.string(), v.object({ name: v.string() }));
        const value = getRecordValue(schema);
        expect(value!.type).toBe("object");
      });

      it("returns null for non-record schema", () => {
        expect(getRecordValue(v.string())).toBeNull();
      });
    });
  });
});
