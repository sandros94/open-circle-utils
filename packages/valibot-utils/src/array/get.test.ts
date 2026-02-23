import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { getArrayItem, getTupleItems, getTupleRest } from "./get.ts";

describe("getArrayItem", () => {
  test("Get item schema", () => {
    const schema = v.array(v.string());
    const item = getArrayItem(schema);

    expect(item !== null).toBe(true);
    expect(item.type).toBe("string");
  });

  test("Complex item schema", () => {
    const schema = v.array(v.object({ name: v.string(), age: v.number() }));
    const item = getArrayItem(schema);

    expect(item !== null).toBe(true);
    expect(item.type).toBe("object");
  });

  test("Non-array schema returns null", () => {
    const schema = v.string();
    const item = getArrayItem(schema);

    expect(item).toBe(null);
  });
});

describe("getTupleItems", () => {
  test("Get tuple items", () => {
    const schema = v.tuple([v.string(), v.number(), v.boolean()]);
    const items = getTupleItems(schema);

    expect(items !== null).toBe(true);
    expect(items.length).toBe(3);
    expect(items[0].type).toBe("string");
    expect(items[1].type).toBe("number");
    expect(items[2].type).toBe("boolean");
  });

  test("Get loose tuple items", () => {
    const schema = v.looseTuple([v.string(), v.number()]);
    const items = getTupleItems(schema);

    expect(items !== null).toBe(true);
    expect(items.length).toBe(2);
    expect(items[0].type).toBe("string");
    expect(items[1].type).toBe("number");
  });

  test("Get strict tuple items", () => {
    const schema = v.strictTuple([v.string(), v.number()]);
    const items = getTupleItems(schema);

    expect(items !== null).toBe(true);
    expect(items.length).toBe(2);
    expect(items[0].type).toBe("string");
    expect(items[1].type).toBe("number");
  });

  test("Get tuple with rest items", () => {
    const schema = v.tupleWithRest([v.string(), v.number()], v.boolean());
    const items = getTupleItems(schema);

    expect(items !== null).toBe(true);
    expect(items.length).toBe(2);
    expect(items[0].type).toBe("string");
    expect(items[1].type).toBe("number");
  });

  test("Empty tuple", () => {
    const schema = v.tuple([]);
    const items = getTupleItems(schema);

    expect(items !== null).toBe(true);
    expect(items.length).toBe(0);
  });

  test("Non-tuple schema returns null", () => {
    const schema = v.array(v.string());
    const items = getTupleItems(schema);

    expect(items).toBe(null);
  });
});

describe("getTupleRest", () => {
  test("Tuple with rest schema", () => {
    const schema = v.tupleWithRest([v.string(), v.number()], v.boolean());
    const rest = getTupleRest(schema);

    expect(rest !== null).toBe(true);
    expect(rest.type).toBe("boolean");
  });

  test("Tuple with rest and complex schema", () => {
    const schema = v.tupleWithRest([v.string(), v.number()], v.object({ id: v.number() }));
    const rest = getTupleRest(schema);

    expect(rest !== null).toBe(true);
    expect(rest.type).toBe("object");
  });

  test("Regular tuple without rest schema", () => {
    const schema = v.tuple([v.string(), v.number()]);
    const rest = getTupleRest(schema);

    expect(rest).toBe(null);
  });

  test("Loose tuple without rest schema", () => {
    const schema = v.looseTuple([v.string(), v.number()]);
    const rest = getTupleRest(schema);

    expect(rest).toBe(null);
  });

  test("Strict tuple without rest schema", () => {
    const schema = v.strictTuple([v.string(), v.number()]);
    const rest = getTupleRest(schema);

    expect(rest).toBe(null);
  });

  test("Non-tuple schema returns null", () => {
    const schema = v.array(v.string());
    const rest = getTupleRest(schema);

    expect(rest).toBe(null);
  });
});
