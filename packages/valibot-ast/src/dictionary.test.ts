import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { createDictionary, findKeyByValue } from "./dictionary.ts";

describe("createDictionary", () => {
  it("creates a Map from entries", () => {
    const fn = () => "hello";
    const dict = createDictionary({ myFn: fn });
    expect(dict).toBeInstanceOf(Map);
    expect(dict.get("myFn")).toBe(fn);
  });

  it("handles all DictionaryValue types", () => {
    const transform = (x: string) => x.toUpperCase();
    const getter = () => v.string();
    class MyClass {}
    const dict = createDictionary({ transform, getter, MyClass });
    expect(dict.size).toBe(3);
    expect(dict.get("transform")).toBe(transform);
    expect(dict.get("getter")).toBe(getter);
    expect(dict.get("MyClass")).toBe(MyClass);
  });

  it("returns empty Map for empty entries", () => {
    const dict = createDictionary({});
    expect(dict.size).toBe(0);
  });
});

describe("findKeyByValue", () => {
  it("finds key by reference equality", () => {
    const fn = () => {};
    const map = new Map([
      ["a", fn],
      ["b", () => {}],
    ]);
    expect(findKeyByValue(map, fn)).toBe("a");
  });

  it("returns undefined for unknown value", () => {
    const map = new Map([["a", () => {}]]);
    expect(findKeyByValue(map, () => {})).toBeUndefined();
  });

  it("returns first matching key", () => {
    const fn = () => {};
    const map = new Map([
      ["first", fn],
      ["second", fn],
    ]);
    expect(findKeyByValue(map, fn)).toBe("first");
  });
});
