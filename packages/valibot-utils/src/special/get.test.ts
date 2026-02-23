import { describe, test, expect } from "vitest";
import * as v from "valibot";

import {
  getIntersectOptions,
  getInstanceClass,
  getMapKey,
  getMapValue,
  getSetItem,
} from "./get.ts";

describe("getIntersectOptions", () => {
  test("Returns options for intersect schema", () => {
    const schema1 = v.object({ name: v.string() });
    const schema2 = v.object({ age: v.number() });
    const schema = v.intersect([schema1, schema2]);

    const options = getIntersectOptions(schema);
    expect(options).not.toBeNull();
    expect(Array.isArray(options)).toBe(true);
    expect(options?.length).toBe(2);
  });

  test("Not an intersect schema returns null", () => {
    expect(getIntersectOptions(v.string())).toBeNull();
  });
});

describe("getInstanceClass", () => {
  test("Returns class for instance schema", () => {
    class MyClass {}
    const schema = v.instance(MyClass);

    const cls = getInstanceClass(schema);
    expect(cls).toBe(MyClass);
  });

  test("Not an instance schema returns null", () => {
    expect(getInstanceClass(v.string())).toBeNull();
  });
});

describe("getMapKey", () => {
  test("Returns key schema for map", () => {
    const schema = v.map(v.string(), v.number());
    const key = getMapKey(schema);

    expect(key).not.toBeNull();
    expect(key?.type).toBe("string");
  });

  test("Not a map schema returns null", () => {
    expect(getMapKey(v.string())).toBeNull();
  });
});

describe("getMapValue", () => {
  test("Returns value schema for map", () => {
    const schema = v.map(v.string(), v.number());
    const value = getMapValue(schema);

    expect(value).not.toBeNull();
    expect(value?.type).toBe("number");
  });

  test("Not a map schema returns null", () => {
    expect(getMapValue(v.string())).toBeNull();
  });
});

describe("getSetItem", () => {
  test("Returns item schema for set", () => {
    const schema = v.set(v.string());
    const item = getSetItem(schema);

    expect(item).not.toBeNull();
    expect(item?.type).toBe("string");
  });

  test("Not a set schema returns null", () => {
    expect(getSetItem(v.string())).toBeNull();
  });
});
