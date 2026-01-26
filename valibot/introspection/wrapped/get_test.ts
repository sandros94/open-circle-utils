import { assertEquals } from "@std/assert";
import * as v from "valibot";

import { getUnwrappedSchema } from "./get.ts";

Deno.test("getUnwrappedSchema - Unwrap Optional Schema", () => {
  const schema = v.optional(v.string(), "defaultValue");
  const result = getUnwrappedSchema(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, false);
  assertEquals(result.nullable, false);
  assertEquals(result.defaultValue, "defaultValue");
  assertEquals(result.schema.type, "string");
});

Deno.test("getUnwrappedSchema - Unwrap Nullable Schema", () => {
  const schema = v.nullable(v.number());
  const result = getUnwrappedSchema(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, true);
  assertEquals(result.nullable, true);
  assertEquals(result.defaultValue, undefined);
  assertEquals(result.schema.type, "number");
});

Deno.test("getUnwrappedSchema - Unwrap Nullish Schema", () => {
  const schema = v.nullish(v.boolean(), true);
  const result = getUnwrappedSchema(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, false);
  assertEquals(result.nullable, true);
  assertEquals(result.defaultValue, true);
  assertEquals(result.schema.type, "boolean");
});

Deno.test("getUnwrappedSchema - Non-wrapped Schema", () => {
  const schema = v.date();
  const result = getUnwrappedSchema(schema);

  assertEquals(result.wasWrapped, false);
  assertEquals(result.schema.type, "date");
});

Deno.test("getUnwrappedSchema - Multiple Wrappers", () => {
  const schema = v.optional(v.nullable(v.string(), "nullableDefault"), "optionalDefault");
  const result = getUnwrappedSchema(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, false);
  assertEquals(result.nullable, true);
  assertEquals(result.defaultValue, "optionalDefault");
  assertEquals(result.schema.type, "string");
});

Deno.test("getUnwrappedSchema - NonOptional overrides Optional", () => {
  const schema = v.nonOptional(v.optional(v.string()));
  const result = getUnwrappedSchema(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, true); // nonOptional overrides optional
  assertEquals(result.nullable, false);
  assertEquals(result.schema.type, "string");
});

Deno.test("getUnwrappedSchema - NonNullable overrides Nullable", () => {
  const schema = v.nonNullable(v.nullable(v.number()));
  const result = getUnwrappedSchema(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, true);
  assertEquals(result.nullable, false); // nonNullable overrides nullable
  assertEquals(result.schema.type, "number");
});

Deno.test("getUnwrappedSchema - Complex nested wrappers", () => {
  const schema = v.nullish(v.nonNullable(v.nullable(v.optional(v.boolean()))), false);
  const result = getUnwrappedSchema(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  // nullish (outermost) sets both required=false and nullable=true
  assertEquals(result.required, false);
  assertEquals(result.nullable, true);
  assertEquals(result.defaultValue, false);
  assertEquals(result.schema.type, "boolean");
});

Deno.test("getUnwrappedSchema - Triple wrapped with defaults at each level", () => {
  const schema = v.optional(
    v.nullable(
      v.optional(v.string(), "innerDefault"),
      "middleDefault"
    ),
    "outerDefault"
  );
  const result = getUnwrappedSchema(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, false);
  assertEquals(result.nullable, true);
  // Default should be from outermost wrapper
  assertEquals(result.defaultValue, "outerDefault");
  assertEquals(result.schema.type, "string");
});
