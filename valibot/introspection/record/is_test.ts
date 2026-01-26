import { assertEquals } from "@std/assert";
import * as v from "valibot";

import { isRecordSchema } from "./is.ts";

Deno.test("isRecordSchema - Record schemas", () => {
  const schema = v.record(v.string(), v.number());

  assertEquals(isRecordSchema(schema), true);
});

Deno.test("isRecordSchema - Non-record schemas", () => {
  assertEquals(isRecordSchema(v.string()), false);
  assertEquals(isRecordSchema(v.number()), false);
  assertEquals(isRecordSchema(v.object({ name: v.string() })), false);
  assertEquals(isRecordSchema(v.array(v.string())), false);
});
