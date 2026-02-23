import { describe, test, expect } from "vitest";
import * as v from "valibot";

import {
  getPipeItems,
  getPipeActions,
  findPipeItems,
  getTransformationActions,
  getValidationActions,
  getLengthActions,
  getValueActions,
  getSizeActions,
  getBytesActions,
} from "./get.ts";

describe("getPipeItems", () => {
  test("Schema with pipe", () => {
    const schema = v.pipe(v.string(), v.email());
    const pipe = getPipeItems(schema);

    expect(pipe).not.toBeNull();
    expect(Array.isArray(pipe)).toBe(true);
  });

  test("Schema without pipe", () => {
    const schema = v.string();
    const pipe = getPipeItems(schema);

    expect(pipe).toBeNull();
  });
});

describe("getPipeActions", () => {
  test("Get all actions", () => {
    const schema = v.pipe(v.string(), v.email(), v.minLength(5), v.maxLength(100));
    const actions = getPipeActions(schema);

    expect(actions).not.toBeNull();
    expect(actions!.length).toBe(3);
    expect(actions!.some((a) => a.type === "email")).toBe(true);
    expect(actions!.some((a) => a.type === "min_length")).toBe(true);
    expect(actions!.some((a) => a.type === "max_length")).toBe(true);
  });

  test("Return null for no pipe", () => {
    const schema = v.string();
    const actions = getPipeActions(schema);

    expect(actions).toBeNull();
  });
});

describe("findPipeItems", () => {
  test("Find by kind", () => {
    const schema = v.pipe(v.string(), v.email(), v.minLength(5), v.toLowerCase());
    const items = findPipeItems(schema, { kind: ["validation"] });

    expect(items).not.toBeNull();
    expect(items!.length).toBe(2);
    expect(items!.every((i) => i.kind === "validation")).toBe(true);
  });

  test("Find by type", () => {
    const schema = v.pipe(v.string(), v.email(), v.minLength(5), v.toLowerCase());
    const items = findPipeItems(schema, { type: ["email"] });

    expect(items).not.toBeNull();
    expect(items!.length).toBe(1);
    expect(items![0].type).toBe("email");
  });

  test("Find by kind and type", () => {
    const schema = v.pipe(v.string(), v.email(), v.minLength(5), v.toLowerCase());
    const items = findPipeItems(schema, {
      kind: ["validation"],
      type: ["min_length"],
    });

    expect(items).not.toBeNull();
    expect(items!.length).toBe(1);
    expect(items![0].type).toBe("min_length");
  });

  test("No pipe returns null", () => {
    const schema = v.string();
    const items = findPipeItems(schema, { kind: ["validation"] });

    expect(items).toBeNull();
  });
});

describe("getTransformationActions", () => {
  test("Get transformation actions", () => {
    const schema = v.pipe(v.string(), v.trim(), v.toUpperCase(), v.minLength(5));
    const actions = getTransformationActions(schema);

    expect(actions).not.toBeNull();
    expect(actions!.length).toBe(2);
    expect(actions!.some((a) => a.type === "trim")).toBe(true);
    expect(actions!.some((a) => a.type === "to_upper_case")).toBe(true);
  });

  test("Get tranformation with requiredment", () => {
    const schema = v.pipe(v.number(), v.toMinValue(10));
    const actions = getTransformationActions(schema);

    expect(actions).not.toBeNull();
    expect(actions!.length).toBe(1);
    expect(actions![0].type).toBe("to_min_value");
    expect(actions![0].requirement).toBe(10);
  });

  test("No pipe returns null", () => {
    const schema = v.string();
    const actions = getTransformationActions(schema);

    expect(actions).toBeNull();
  });
});

describe("getValidationActions", () => {
  test("Get validation actions", () => {
    const schema = v.pipe(v.string(), v.email(), v.minLength(5), v.trim());
    const actions = getValidationActions(schema);

    expect(actions).not.toBeNull();
    expect(actions!.length).toBe(2);
    expect(actions!.some((a) => a.type === "email")).toBe(true);
    expect(actions!.some((a) => a.type === "min_length")).toBe(true);
  });

  test("No pipe returns null", () => {
    const schema = v.string();
    const actions = getValidationActions(schema);

    expect(actions).toBeNull();
  });
});

describe("getLengthActions", () => {
  test("Get length constraint actions", () => {
    const schema1 = v.pipe(v.string(), v.minLength(5), v.maxLength(100), v.email());
    const schema2 = v.pipe(v.array(v.string()), v.length(10));

    const actions1 = getLengthActions(schema1);
    const actions2 = getLengthActions(schema2);

    expect(actions1).not.toBeNull();
    expect(actions1!.length).toBe(2);
    expect(actions1!.some((a) => a.type === "min_length")).toBe(true);
    expect(actions1!.some((a) => a.type === "max_length")).toBe(true);

    expect(actions2).not.toBeNull();
    expect(actions2!.length).toBe(1);
    expect(actions2![0].type).toBe("length");
  });

  test("No pipe returns null", () => {
    const schema = v.string();
    const actions = getLengthActions(schema);

    expect(actions).toBeNull();
  });
});

describe("getValueActions", () => {
  test("Get value constraint actions", () => {
    const schema1 = v.pipe(v.number(), v.integer(), v.minValue(5), v.maxValue(100));
    const schema2 = v.pipe(v.string(), v.value("fixedValue"));

    const actions1 = getValueActions(schema1);
    const actions2 = getValueActions(schema2);

    expect(actions1).not.toBeNull();
    expect(actions1!.length).toBe(2);
    expect(actions1!.some((a) => a.type === "min_value")).toBe(true);
    expect(actions1!.some((a) => a.type === "max_value")).toBe(true);

    expect(actions2).not.toBeNull();
    expect(actions2!.length).toBe(1);
    expect(actions2![0].type).toBe("value");
  });

  test("No pipe returns null", () => {
    const schema = v.string();
    const actions = getValueActions(schema);

    expect(actions).toBeNull();
  });
});

describe("getSizeActions", () => {
  test("Get size constraint actions", () => {
    const schema1 = v.pipe(v.set(v.string()), v.minSize(2), v.maxSize(10));
    const schema2 = v.pipe(v.map(v.string(), v.number()), v.size(5));

    const actions1 = getSizeActions(schema1);
    const actions2 = getSizeActions(schema2);

    expect(actions1).not.toBeNull();
    expect(actions1!.length).toBe(2);
    expect(actions1!.some((a) => a.type === "min_size")).toBe(true);
    expect(actions1!.some((a) => a.type === "max_size")).toBe(true);

    expect(actions2).not.toBeNull();
    expect(actions2!.length).toBe(1);
    expect(actions2![0].type).toBe("size");
  });

  test("No pipe returns null", () => {
    const schema = v.string();
    const actions = getSizeActions(schema);

    expect(actions).toBeNull();
  });
});

describe("getBytesActions", () => {
  test("Get bytes constraint actions", () => {
    const schema1 = v.pipe(v.string(), v.minBytes(10), v.maxBytes(100));
    const schema2 = v.pipe(v.string(), v.bytes(50));

    const actions1 = getBytesActions(schema1);
    const actions2 = getBytesActions(schema2);

    expect(actions1).not.toBeNull();
    expect(actions1!.length).toBe(2);
    expect(actions1!.some((a) => a.type === "min_bytes")).toBe(true);
    expect(actions1!.some((a) => a.type === "max_bytes")).toBe(true);

    expect(actions2).not.toBeNull();
    expect(actions2!.length).toBe(1);
    expect(actions2![0].type).toBe("bytes");
  });

  test("No pipe returns null", () => {
    const schema = v.string();
    const actions = getBytesActions(schema);

    expect(actions).toBeNull();
  });
});
