import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { hasPipe } from "./is.ts";

describe("hasPipe", () => {
  test("Schema with pipe", () => {
    const schema = v.pipe(v.string(), v.email());

    expect(hasPipe(schema)).toBe(true);
  });

  test("Schema without pipe", () => {
    const schema = v.string();

    expect(hasPipe(schema)).toBe(false);
  });

  test("Number schema with validations", () => {
    const schema = v.pipe(v.number(), v.minValue(0), v.maxValue(100));

    expect(hasPipe(schema)).toBe(true);
  });
});
