import { assertEquals } from "@std/assert";
import { intersect, instance, map, set, string, number, object } from "valibot";
import {
  getIntersectOptions,
  getInstanceClass,
  getMapKey,
  getMapValue,
  getSetItem,
} from "./get.ts";

Deno.test("getIntersectOptions", () => {
  const schema1 = object({ name: string() });
  const schema2 = object({ age: number() });
  const schema = intersect([schema1, schema2]);

  const options = getIntersectOptions(schema);
  assertEquals(options !== null, true);
  assertEquals(Array.isArray(options), true);
  assertEquals(options?.length, 2);
});

Deno.test("getInstanceClass", () => {
  class MyClass {}
  const schema = instance(MyClass);

  const cls = getInstanceClass(schema);
  assertEquals(cls, MyClass);
});

Deno.test("getMapKey", () => {
  const schema = map(string(), number());
  const key = getMapKey(schema);

  assertEquals(key !== null, true);
  assertEquals(key.type, "string");
});

Deno.test("getMapValue", () => {
  const schema = map(string(), number());
  const value = getMapValue(schema);

  assertEquals(value !== null, true);
  assertEquals(value.type, "number");
});

Deno.test("getSetItem", () => {
  const schema = set(string());
  const item = getSetItem(schema);

  assertEquals(item !== null, true);
  assertEquals(item.type, "string");
});

Deno.test("getIntersectOptions - not an intersect schema", () => {
  assertEquals(getIntersectOptions(string()), null);
});

Deno.test("getInstanceClass - not an instance schema", () => {
  assertEquals(getInstanceClass(string()), null);
});

Deno.test("getMapKey - not a map schema", () => {
  assertEquals(getMapKey(string()), null);
});

Deno.test("getMapValue - not a map schema", () => {
  assertEquals(getMapValue(string()), null);
});

Deno.test("getSetItem - not a set schema", () => {
  assertEquals(getSetItem(string()), null);
});
