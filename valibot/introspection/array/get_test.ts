import { assertEquals } from "@std/assert";
import * as v from "valibot";

import { getArrayItem, getTupleItems, getTupleRest } from "./get.ts";

Deno.test("getArrayItem - Get item schema", () => {
  const schema = v.array(v.string());
  const item = getArrayItem(schema);

  assertEquals(item !== null, true);
  assertEquals(item.type, "string");
});

Deno.test("getArrayItem - Complex item schema", () => {
  const schema = v.array(v.object({ name: v.string(), age: v.number() }));
  const item = getArrayItem(schema);

  assertEquals(item !== null, true);
  assertEquals(item.type, "object");
});

Deno.test("getArrayItem - Non-array schema returns null", () => {
  const schema = v.string();
  const item = getArrayItem(schema);

  assertEquals(item, null);
});

Deno.test("getTupleItems - Get tuple items", () => {
  const schema = v.tuple([v.string(), v.number(), v.boolean()]);
  const items = getTupleItems(schema);

  assertEquals(items !== null, true);
  assertEquals(items.length, 3);
  assertEquals(items[0].type, "string");
  assertEquals(items[1].type, "number");
  assertEquals(items[2].type, "boolean");
});

Deno.test("getTupleItems - Get loose tuple items", () => {
  const schema = v.looseTuple([v.string(), v.number()]);
  const items = getTupleItems(schema);

  assertEquals(items !== null, true);
  assertEquals(items.length, 2);
  assertEquals(items[0].type, "string");
  assertEquals(items[1].type, "number");
});

Deno.test("getTupleItems - Get strict tuple items", () => {
  const schema = v.strictTuple([v.string(), v.number()]);
  const items = getTupleItems(schema);

  assertEquals(items !== null, true);
  assertEquals(items.length, 2);
  assertEquals(items[0].type, "string");
  assertEquals(items[1].type, "number");
});

Deno.test("getTupleItems - Get tuple with rest items", () => {
  const schema = v.tupleWithRest([v.string(), v.number()], v.boolean());
  const items = getTupleItems(schema);

  assertEquals(items !== null, true);
  assertEquals(items.length, 2);
  assertEquals(items[0].type, "string");
  assertEquals(items[1].type, "number");
});

Deno.test("getTupleItems - Empty tuple", () => {
  const schema = v.tuple([]);
  const items = getTupleItems(schema);

  assertEquals(items !== null, true);
  assertEquals(items.length, 0);
});

Deno.test("getTupleItems - Non-tuple schema returns null", () => {
  const schema = v.array(v.string());
  const items = getTupleItems(schema);

  assertEquals(items, null);
});

Deno.test("getTupleRest - Tuple with rest schema", () => {
  const schema = v.tupleWithRest([v.string(), v.number()], v.boolean());
  const rest = getTupleRest(schema);

  assertEquals(rest !== null, true);
  assertEquals(rest.type, "boolean");
});

Deno.test("getTupleRest - Tuple with rest and complex schema", () => {
  const schema = v.tupleWithRest(
    [v.string(), v.number()],
    v.object({ id: v.number() }),
  );
  const rest = getTupleRest(schema);

  assertEquals(rest !== null, true);
  assertEquals(rest.type, "object");
});

Deno.test("getTupleRest - Regular tuple without rest schema", () => {
  const schema = v.tuple([v.string(), v.number()]);
  const rest = getTupleRest(schema);

  assertEquals(rest, null);
});

Deno.test("getTupleRest - Loose tuple without rest schema", () => {
  const schema = v.looseTuple([v.string(), v.number()]);
  const rest = getTupleRest(schema);

  assertEquals(rest, null);
});

Deno.test("getTupleRest - Strict tuple without rest schema", () => {
  const schema = v.strictTuple([v.string(), v.number()]);
  const rest = getTupleRest(schema);

  assertEquals(rest, null);
});

Deno.test("getTupleRest - Non-tuple schema returns null", () => {
  const schema = v.array(v.string());
  const rest = getTupleRest(schema);

  assertEquals(rest, null);
});
