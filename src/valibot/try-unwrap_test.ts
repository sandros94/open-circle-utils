import { assertEquals } from "@std/assert";
import * as v from "valibot";
import { tryUnwrap } from "./try-unwrap.ts";

Deno.test("tryUnwrap - Unwrap Optional Schema", () => {
  const schema = v.optional(v.string(), "defaultValue");
  const result = tryUnwrap(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, false);
  assertEquals(result.nullable, false);
  assertEquals(result.defaultValue, "defaultValue");
  assertEquals(result.schema.type, "string");
});

Deno.test("tryUnwrap - Unwrap Nullable Schema", () => {
  const schema = v.nullable(v.number());
  const result = tryUnwrap(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, true);
  assertEquals(result.nullable, true);
  assertEquals(result.defaultValue, undefined);
  assertEquals(result.schema.type, "number");
});

Deno.test("tryUnwrap - Unwrap Nullish Schema", () => {
  const schema = v.nullish(v.boolean(), true);
  const result = tryUnwrap(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, false);
  assertEquals(result.nullable, true);
  assertEquals(result.defaultValue, true);
  assertEquals(result.schema.type, "boolean");
});

Deno.test("tryUnwrap - Non-wrapped Schema", () => {
  const schema = v.date();
  const result = tryUnwrap(schema);

  assertEquals(result.wasWrapped, false);
  assertEquals(result.schema.type, "date");
});

Deno.test("tryUnwrap - Multiple Wrappers", () => {
  const schema = v.optional(v.nullable(v.string(), "nullableDefault"), "optionalDefault");
  const result = tryUnwrap(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, false);
  assertEquals(result.nullable, true);
  assertEquals(result.defaultValue, "optionalDefault");
  assertEquals(result.schema.type, "string");
});

Deno.test("tryUnwrap - NonOptional overrides Optional", () => {
  const schema = v.nonOptional(v.optional(v.string()));
  const result = tryUnwrap(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, true); // nonOptional overrides optional
  assertEquals(result.nullable, false);
  assertEquals(result.schema.type, "string");
});

Deno.test("tryUnwrap - NonNullable overrides Nullable", () => {
  const schema = v.nonNullable(v.nullable(v.number()));
  const result = tryUnwrap(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, true);
  assertEquals(result.nullable, false); // nonNullable overrides nullable
  assertEquals(result.schema.type, "number");
});

Deno.test("tryUnwrap - Complex nested wrappers", () => {
  const schema = v.nullish(v.nonNullable(v.nullable(v.optional(v.boolean()))), false);
  const result = tryUnwrap(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  // nullish (outermost) sets both required=false and nullable=true
  assertEquals(result.required, false);
  assertEquals(result.nullable, true);
  assertEquals(result.defaultValue, false);
  assertEquals(result.schema.type, "boolean");
});

Deno.test("tryUnwrap - Triple wrapped with defaults at each level", () => {
  const schema = v.optional(
    v.nullable(
      v.optional(v.string(), "innerDefault"),
      "middleDefault"
    ),
    "outerDefault"
  );
  const result = tryUnwrap(schema);

  assertEquals(result.wasWrapped, true);
  if (!result.wasWrapped) return;
  assertEquals(result.required, false);
  assertEquals(result.nullable, true);
  // Default should be from outermost wrapper
  assertEquals(result.defaultValue, "outerDefault");
  assertEquals(result.schema.type, "string");
});
