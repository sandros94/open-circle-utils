import { describe, test, expect } from "vitest";
import * as v from "valibot";

import {
  getEnumOptions,
  getPicklistOptions,
  getUnionOptions,
  getVariantOptions,
  getVariantKey,
} from "./get.ts";

enum TestEnum {
  A = "a",
  B = "b",
  C = "c",
}

describe("getEnumOptions", () => {
  test("Get enum object", () => {
    const schema = v.enum_(TestEnum);
    const options = getEnumOptions(schema);

    expect(options !== null).toBe(true);
    expect(options).toBe(TestEnum);
  });

  test("Non-enum schema returns null", () => {
    const schema = v.string();
    const options = getEnumOptions(schema);

    expect(options).toBe(null);
  });
});

describe("getPicklistOptions", () => {
  test("Get picklist options", () => {
    const schema = v.picklist(["a", "b", "c"]);
    const options = getPicklistOptions(schema);

    expect(options !== null).toBe(true);
    expect(options).toEqual(["a", "b", "c"]);
  });

  test("Non-picklist schema returns null", () => {
    const schema = v.string();
    const options = getPicklistOptions(schema);

    expect(options).toBe(null);
  });
});

describe("getUnionOptions", () => {
  test("Get union options", () => {
    const stringSchema = v.string();
    const numberSchema = v.number();
    const schema = v.union([stringSchema, numberSchema]);
    const options = getUnionOptions(schema);

    expect(options !== null).toBe(true);
    expect(options.length).toBe(2);
    expect(options[0].type).toBe("string");
    expect(options[1].type).toBe("number");
  });

  test("Non-union schema returns null", () => {
    const schema = v.string();
    const options = getUnionOptions(schema);

    expect(options).toBe(null);
  });
});

describe("getVariantOptions", () => {
  test("Get variant options", () => {
    const schema = v.variant("type", [
      v.object({ type: v.literal("a"), value: v.string() }),
      v.object({ type: v.literal("b"), value: v.number() }),
    ]);
    const options = getVariantOptions(schema);

    expect(options !== null).toBe(true);
    expect(options.length).toBe(2);
  });

  test("Non-variant schema returns null", () => {
    const schema = v.string();
    const options = getVariantOptions(schema);

    expect(options).toBe(null);
  });
});

describe("getVariantKey", () => {
  test("Get discriminator key", () => {
    const schema = v.variant("type", [
      v.object({ type: v.literal("a"), value: v.string() }),
      v.object({ type: v.literal("b"), value: v.number() }),
    ]);
    const key = getVariantKey(schema);

    expect(key !== null).toBe(true);
    expect(key).toBe("type");
  });

  test("Non-variant schema returns null", () => {
    const schema = v.string();
    const key = getVariantKey(schema);

    expect(key).toBe(null);
  });
});
