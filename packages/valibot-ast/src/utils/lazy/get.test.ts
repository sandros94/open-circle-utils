import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { getLazyGetter } from "./get.ts";

describe("lazy", () => {
  describe("get", () => {
    describe("getLazyGetter", () => {
      it("returns the getter function for a lazy schema", () => {
        const getter = () => v.string();
        const schema = v.lazy(getter);
        const result = getLazyGetter(schema);
        expect(result).not.toBeNull();
        expect(typeof result).toBe("function");
        expect(result!().type).toBe("string");
      });

      it("returns null for non-lazy schema", () => {
        expect(getLazyGetter(v.string())).toBeNull();
      });

      it("returns null for array schema", () => {
        expect(getLazyGetter(v.array(v.string()))).toBeNull();
      });
    });
  });
});
