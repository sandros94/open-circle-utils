import { assertEquals } from "@std/assert";
import * as v from "valibot";

import { isArraySchema, isTupleSchema, isTupleWithRestSchema } from "./is.ts";

Deno.test("isArraySchema - Array schemas", () => {
  const schema = v.array(v.string());

  assertEquals(isArraySchema(schema), true);
});

Deno.test("isArraySchema - Non-array schemas", () => {
  assertEquals(isArraySchema(v.string()), false);
  assertEquals(isArraySchema(v.number()), false);
  assertEquals(isArraySchema(v.object({ name: v.string() })), false);
  assertEquals(isArraySchema(v.tuple([v.string(), v.number()])), false);
});

Deno.test("isTupleSchema - Tuple schemas", () => {
  const schema = v.tuple([v.string(), v.number()]);

  assertEquals(isTupleSchema(schema), true);
});

Deno.test("isTupleSchema - Loose tuple schemas", () => {
  const schema = v.looseTuple([v.string(), v.number()]);

  assertEquals(isTupleSchema(schema), true);
});

Deno.test("isTupleSchema - Strict tuple schemas", () => {
  const schema = v.strictTuple([v.string(), v.number()]);

  assertEquals(isTupleSchema(schema), true);
});

Deno.test("isTupleSchema - Tuple with rest schemas", () => {
  const schema = v.tupleWithRest([v.string(), v.number()], v.boolean());

  assertEquals(isTupleSchema(schema), true);
});

Deno.test("isTupleSchema - Non-tuple schemas", () => {
  assertEquals(isTupleSchema(v.string()), false);
  assertEquals(isTupleSchema(v.array(v.string())), false);
  assertEquals(isTupleSchema(v.object({ name: v.string() })), false);
});

Deno.test("isTupleWithRestSchema - Tuple with rest schemas", () => {
  const schema = v.tupleWithRest([v.string(), v.number()], v.boolean());

  assertEquals(isTupleWithRestSchema(schema), true);
});

Deno.test("isTupleWithRestSchema - Non-tuple with rest schemas", () => {
  assertEquals(isTupleWithRestSchema(v.tuple([v.string()])), false);
  assertEquals(isTupleWithRestSchema(v.looseTuple([v.string()])), false);
  assertEquals(isTupleWithRestSchema(v.strictTuple([v.string()])), false);
  assertEquals(isTupleWithRestSchema(v.array(v.string())), false);
});
