import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { hasPipe } from "./is.ts";

describe("pipe", () => {
  describe("is", () => {
    describe("hasPipe", () => {
      it("returns true for a schema created with v.pipe()", () => {
        const schema = v.pipe(v.string(), v.minLength(1));
        expect(hasPipe(schema)).toBe(true);
      });

      it("returns true for v.pipe with multiple actions", () => {
        const schema = v.pipe(v.string(), v.minLength(1), v.maxLength(100), v.trim());
        expect(hasPipe(schema)).toBe(true);
      });

      it("returns false for plain string schema", () => {
        expect(hasPipe(v.string())).toBe(false);
      });

      it("returns false for plain number schema", () => {
        expect(hasPipe(v.number())).toBe(false);
      });

      it("returns false for object schema", () => {
        expect(hasPipe(v.object({}))).toBe(false);
      });

      it("returns false for array schema", () => {
        expect(hasPipe(v.array(v.string()))).toBe(false);
      });
    });
  });
});
