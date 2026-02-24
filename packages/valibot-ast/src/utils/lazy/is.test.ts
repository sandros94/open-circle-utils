import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { isLazySchema } from "./is.ts";

describe("lazy", () => {
  describe("is", () => {
    describe("isLazySchema", () => {
      it("returns true for lazy schema", () => {
        const schema = v.lazy(() => v.string());
        expect(isLazySchema(schema)).toBe(true);
      });

      it("returns true for self-referential lazy schema", () => {
        const nodeSchema: v.GenericSchema = v.lazy(() =>
          v.object({ children: v.array(nodeSchema) })
        );
        expect(isLazySchema(nodeSchema)).toBe(true);
      });

      it("returns false for non-lazy schema", () => {
        expect(isLazySchema(v.string())).toBe(false);
      });

      it("returns false for optional schema", () => {
        expect(isLazySchema(v.optional(v.string()))).toBe(false);
      });
    });
  });
});
