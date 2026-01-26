import { assertEquals } from "@std/assert";
import * as v from "valibot";

import { hasPipe } from "./is.ts";

Deno.test("hasPipe - Schema with pipe", () => {
  const schema = v.pipe(v.string(), v.email());

  assertEquals(hasPipe(schema), true);
});

Deno.test("hasPipe - Schema without pipe", () => {
  const schema = v.string();

  assertEquals(hasPipe(schema), false);
});

Deno.test("hasPipe - Number schema with validations", () => {
  const schema = v.pipe(v.number(), v.minValue(0), v.maxValue(100));

  assertEquals(hasPipe(schema), true);
});
