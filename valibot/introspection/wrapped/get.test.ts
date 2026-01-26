import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { getUnwrappedSchema } from "./get.ts";

describe("getUnwrappedSchema", () => {
  test("Unwrap Optional Schema", () => {
    const schema = v.optional(v.string(), "defaultValue");
    const result = getUnwrappedSchema(schema);

    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
    expect(result.defaultValue).toBe("defaultValue");
    expect(result.schema.type).toBe("string");
  });

  test("Unwrap Nullable Schema", () => {
    const schema = v.nullable(v.number());
    const result = getUnwrappedSchema(schema);

    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(true);
    expect(result.defaultValue).toBeUndefined();
    expect(result.schema.type).toBe("number");
  });

  test("Unwrap Nullish Schema", () => {
    const schema = v.nullish(v.boolean(), true);
    const result = getUnwrappedSchema(schema);

    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
    expect(result.defaultValue).toBe(true);
    expect(result.schema.type).toBe("boolean");
  });

  test("Non-wrapped Schema", () => {
    const schema = v.date();
    const result = getUnwrappedSchema(schema);

    expect(result.wasWrapped).toBe(false);
    expect(result.schema.type).toBe("date");
  });

  test("Multiple Wrappers", () => {
    const schema = v.optional(
      v.nullable(v.string(), "nullableDefault"),
      "optionalDefault",
    );
    const result = getUnwrappedSchema(schema);

    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
    expect(result.defaultValue).toBe("optionalDefault");
    expect(result.schema.type).toBe("string");
  });

  test("NonOptional overrides Optional", () => {
    const schema = v.nonOptional(v.optional(v.string()));
    const result = getUnwrappedSchema(schema);

    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(true); // nonOptional overrides optional
    expect(result.nullable).toBe(false);
    expect(result.schema.type).toBe("string");
  });

  test("NonNullable overrides Nullable", () => {
    const schema = v.nonNullable(v.nullable(v.number()));
    const result = getUnwrappedSchema(schema);

    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false); // nonNullable overrides nullable
    expect(result.schema.type).toBe("number");
  });

  test("Complex nested wrappers", () => {
    const schema = v.nullish(
      v.nonNullable(v.nullable(v.optional(v.boolean()))),
      false,
    );
    const result = getUnwrappedSchema(schema);

    expect(result.wasWrapped).toBe(true);
    // nullish (outermost) sets both required=false and nullable=true
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
    expect(result.defaultValue).toBe(false);
    expect(result.schema.type).toBe("boolean");
  });

  test("Triple wrapped with defaults at each level", () => {
    const schema = v.optional(
      v.nullable(v.optional(v.string(), "innerDefault"), "middleDefault"),
      "outerDefault",
    );
    const result = getUnwrappedSchema(schema);

    expect(result.wasWrapped).toBe(true);
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
    // Default should be from outermost wrapper
    expect(result.defaultValue).toBe("outerDefault");
    expect(result.schema.type).toBe("string");
  });
});
