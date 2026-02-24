import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  getObjectEntries,
  getObjectEntry,
  getObjectRest,
  getObjectFields,
  getObjectField,
} from "./get.ts";

describe("getObjectEntries", () => {
  it("returns entries as [key, value] tuples for object schema", () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    const entries = getObjectEntries(schema);
    expect(entries).not.toBeNull();
    expect(Array.isArray(entries)).toBe(true);
    const nameEntry = entries!.find(([key]) => key === "name");
    expect(nameEntry).toBeDefined();
    expect(nameEntry![1].type).toBe("string");
  });

  it("returns null for non-object schema", () => {
    expect(getObjectEntries(v.string())).toBeNull();
  });

  it("works with looseObject", () => {
    const entries = getObjectEntries(v.looseObject({ x: v.boolean() }));
    expect(entries).not.toBeNull();
    const xEntry = entries!.find(([key]) => key === "x");
    expect(xEntry![1].type).toBe("boolean");
  });
});

describe("getObjectEntry", () => {
  it("returns specific entry", () => {
    const schema = v.object({ name: v.string() });
    const entry = getObjectEntry(schema, "name");
    expect(entry).not.toBeNull();
    expect(entry!.type).toBe("string");
  });

  it("returns null for missing key", () => {
    const schema = v.object({ name: v.string() });
    expect(getObjectEntry(schema, "missing")).toBeNull();
  });
});

describe("getObjectRest", () => {
  it("returns rest for objectWithRest", () => {
    const schema = v.objectWithRest({ name: v.string() }, v.number());
    const rest = getObjectRest(schema);
    expect(rest).not.toBeNull();
    expect(rest!.type).toBe("number");
  });

  it("returns null for regular object", () => {
    expect(getObjectRest(v.object({ name: v.string() }))).toBeNull();
  });
});

describe("getObjectFields / getObjectField", () => {
  it("getObjectFields returns {key, schema} array", () => {
    const schema = v.object({
      name: v.string(),
      age: v.optional(v.number()),
    });
    const fields = getObjectFields(schema);
    expect(fields).not.toBeNull();
    expect(Array.isArray(fields)).toBe(true);
    const nameField = fields!.find((f) => f.key === "name");
    expect(nameField).toBeDefined();
    expect(nameField!.schema.type).toBe("string");
  });

  it("getObjectField returns single field", () => {
    const schema = v.object({ email: v.pipe(v.string(), v.email()) });
    const field = getObjectField(schema, "email");
    expect(field).not.toBeNull();
    expect(field!.key).toBe("email");
    expect(field!.schema.type).toBe("string");
  });
});
