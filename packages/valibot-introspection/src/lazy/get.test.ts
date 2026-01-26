import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { getLazyGetter } from "./get.ts";
import { isLazySchema } from "./is.ts";

describe("getLazyGetter", () => {
  test("basic usage", () => {
    const lazySchema = v.lazy(() => v.string());
    const getter = getLazyGetter(lazySchema);

    expect(getter !== null).toBe(true);
    expect(typeof getter).toBe("function");
  });

  test("returns correct schema", () => {
    const lazySchema = v.lazy(() => v.string());
    const getter = getLazyGetter(lazySchema);

    if (getter) {
      const resolved = getter();
      expect(resolved.type).toBe("string");
    }
  });

  test("circular reference", () => {
    const NodeSchema: v.ObjectSchema<v.ObjectEntries, undefined> = v.object({
      value: v.string(),
      child: v.lazy(() => NodeSchema),
    });

    const childSchema = NodeSchema.entries.child;
    expect(isLazySchema(childSchema)).toBe(true);

    const getter = getLazyGetter(childSchema);
    expect(getter !== null).toBe(true);
  });

  test("not a lazy schema", () => {
    expect(getLazyGetter(v.string())).toBe(null);
  });
});
