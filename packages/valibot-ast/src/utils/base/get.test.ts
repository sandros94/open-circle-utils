import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { getSchemaType } from "./get.ts";

describe("base", () => {
  describe("get", () => {
    describe("getSchemaType", () => {
      it("returns 'string' for string schema", () => {
        expect(getSchemaType(v.string())).toBe("string");
      });

      it("returns 'number' for number schema", () => {
        expect(getSchemaType(v.number())).toBe("number");
      });

      it("returns 'boolean' for boolean schema", () => {
        expect(getSchemaType(v.boolean())).toBe("boolean");
      });

      it("returns 'array' for array schema", () => {
        expect(getSchemaType(v.array(v.string()))).toBe("array");
      });

      it("returns 'object' for object schema", () => {
        expect(getSchemaType(v.object({}))).toBe("object");
      });

      it("returns 'optional' for optional schema", () => {
        expect(getSchemaType(v.optional(v.string()))).toBe("optional");
      });
    });
  });
});
