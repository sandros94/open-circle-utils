import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { isRecordSchema } from "./is.ts";

describe("isRecordSchema", () => {
  test("Record schemas", () => {
    const schema = v.record(v.string(), v.number());

    expect(isRecordSchema(schema)).toBe(true);
  });

  test("Non-record schemas", () => {
    expect(isRecordSchema(v.string())).toBe(false);
    expect(isRecordSchema(v.number())).toBe(false);
    expect(isRecordSchema(v.object({ name: v.string() }))).toBe(false);
    expect(isRecordSchema(v.array(v.string()))).toBe(false);
  });
});
