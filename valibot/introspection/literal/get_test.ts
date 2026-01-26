import { assertEquals } from "@std/assert";
import { literal, string } from "valibot";
import { getLiteralValue } from "./get.ts";

Deno.test("getLiteralValue - string literal", () => {
  const schema = literal("test");
  assertEquals(getLiteralValue(schema), "test");
});

Deno.test("getLiteralValue - number literal", () => {
  const schema = literal(123);
  assertEquals(getLiteralValue(schema), 123);
});

Deno.test("getLiteralValue - boolean literal", () => {
  const schema = literal(true);
  assertEquals(getLiteralValue(schema), true);
});

Deno.test("getLiteralValue - not a literal schema", () => {
  assertEquals(getLiteralValue(string()), null);
});
