import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { isRecordSchema } from "./is.ts";

describe("record", () => {
  describe("is", () => {
    describe("isRecordSchema", () => {
      it("returns true for record schema", () => {
        expect(isRecordSchema(v.record(v.string(), v.number()))).toBe(true);
      });

      it("returns true for record with enum key", () => {
        enum K {
          A = "a",
        }
        expect(isRecordSchema(v.record(v.enum(K), v.string()))).toBe(true);
      });

      it("returns false for object schema", () => {
        expect(isRecordSchema(v.object({ a: v.string() }))).toBe(false);
      });

      it("returns false for string schema", () => {
        expect(isRecordSchema(v.string())).toBe(false);
      });

      it("returns false for map schema", () => {
        expect(isRecordSchema(v.map(v.string(), v.number()))).toBe(false);
      });
    });
  });
});
