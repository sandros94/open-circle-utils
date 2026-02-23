import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { getRecordKey, getRecordValue } from "./get.ts";

describe("getRecordKey", () => {
  test("Get key schema", () => {
    const schema = v.record(v.string(), v.number());
    const key = getRecordKey(schema);

    expect(key).not.toBeNull();
    expect(key!.type).toBe("string");
  });

  test("Complex key schema", () => {
    const schema = v.record(v.picklist(["a", "b", "c"]), v.number());
    const key = getRecordKey(schema);

    expect(key).not.toBeNull();
    expect(key!.type).toBe("picklist");
  });

  test("Non-record schema returns null", () => {
    const schema = v.string();
    const key = getRecordKey(schema);

    expect(key).toBeNull();
  });
});

describe("getRecordValue", () => {
  test("Get value schema", () => {
    const schema = v.record(v.string(), v.number());
    const value = getRecordValue(schema);

    expect(value).not.toBeNull();
    expect(value!.type).toBe("number");
  });

  test("Complex value schema", () => {
    const schema = v.record(v.string(), v.object({ name: v.string(), age: v.number() }));
    const value = getRecordValue(schema);

    expect(value).not.toBeNull();
    expect(value!.type).toBe("object");
  });

  test("Non-record schema returns null", () => {
    const schema = v.string();
    const value = getRecordValue(schema);

    expect(value).toBeNull();
  });
});
