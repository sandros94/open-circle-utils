import { describe, test, expect } from "vitest";
import * as v from "valibot";

import {
  getObjectEntries,
  getObjectEntry,
  getObjectFields,
  getObjectField,
  getObjectRest,
} from "./get.ts";

describe("getObjectEntries", () => {
  test("With optional and nullable fields", () => {
    const schema = v.object({
      required: v.string(),
      optional: v.optional(v.string()),
      nullable: v.nullable(v.number()),
    });

    const entries = getObjectEntries(schema);
    expect(entries?.length).toBe(3);

    const optionalEntry = entries?.find((e) => e[0] === "optional");
    expect(optionalEntry?.[1].type).toBe("optional");

    const nullableEntry = entries?.find((e) => e[0] === "nullable");
    expect(nullableEntry?.[1].type).toBe("nullable");
  });

  test("Non-object schema returns null", () => {
    const schema = v.string();
    const result = getObjectEntries(schema);
    expect(result).toBeNull();
  });
});

describe("getObjectEntry", () => {
  test("Get specific entry", () => {
    const schema = v.object({
      name: v.string(),
      age: v.number(),
    });

    const nameSchema = getObjectEntry(schema, "name");
    expect(nameSchema?.type).toBe("string");

    const ageSchema = getObjectEntry(schema, "age");
    expect(ageSchema?.type).toBe("number");
  });

  test("Non-existent key returns null", () => {
    const schema = v.object({
      name: v.string(),
    });

    const result = getObjectEntry(schema, "nonExistent");
    expect(result).toBeNull();
  });

  test("Non-object schema returns null", () => {
    const schema = v.string();
    const result = getObjectEntry(schema, "anything");
    expect(result).toBeNull();
  });
});

describe("getObjectFields", () => {
  test("With optional and nullable fields", () => {
    const schema = v.object({
      required: v.string(),
      optional: v.optional(v.string()),
      nullable: v.nullable(v.number()),
    });

    const entries = getObjectFields(schema);
    expect(entries.length).toBe(3);

    const optionalEntry = entries.find((e) => e.key === "optional");
    expect(optionalEntry?.schema.type).toBe("optional");

    const nullableEntry = entries.find((e) => e.key === "nullable");
    expect(nullableEntry?.schema.type).toBe("nullable");
  });

  test("Non-object schema returns null", () => {
    const schema = v.array(v.string());
    const result = getObjectFields(schema);
    expect(result).toBeNull();
  });
});

describe("getObjectField", () => {
  test("Get specific entry", () => {
    const schema = v.object({
      name: v.string(),
      age: v.number(),
    });

    const nameField = getObjectField(schema, "name");
    expect(nameField).not.toBeNull();
    expect(nameField?.key).toBe("name");
    expect(nameField?.schema.type).toBe("string");

    const ageField = getObjectField(schema, "age");
    expect(ageField).not.toBeNull();
    expect(ageField?.key).toBe("age");
    expect(ageField?.schema.type).toBe("number");
  });

  test("Non-existent key returns null", () => {
    const schema = v.object({
      name: v.string(),
    });

    const result = getObjectField(schema, "nonExistent");
    expect(result).toBeNull();
  });

  test("Non-object schema returns null", () => {
    const schema = v.string();
    const result = getObjectField(schema, "anything");
    expect(result).toBeNull();
  });
});

describe("getObjectRest", () => {
  test("Object with rest schema", () => {
    const schema = v.objectWithRest({ name: v.string() }, v.boolean());
    const rest = getObjectRest(schema);

    expect(rest).not.toBeNull();
    expect(rest?.type).toBe("boolean");
  });

  test("Object with rest and complex schema", () => {
    const schema = v.objectWithRest({ name: v.string() }, v.object({ id: v.number() }));
    const rest = getObjectRest(schema);

    expect(rest).not.toBeNull();
    expect(rest?.type).toBe("object");
  });

  test("Regular object without rest schema", () => {
    const schema = v.object({ name: v.string() });
    const rest = getObjectRest(schema);

    expect(rest).toBeNull();
  });

  test("Loose object without rest schema", () => {
    const schema = v.looseObject({ name: v.string() });
    const rest = getObjectRest(schema);

    expect(rest).toBeNull();
  });

  test("Strict object without rest schema", () => {
    const schema = v.strictObject({ name: v.string() });
    const rest = getObjectRest(schema);

    expect(rest).toBeNull();
  });

  test("Non-object schema returns null", () => {
    const schema = v.array(v.string());
    const rest = getObjectRest(schema);

    expect(rest).toBeNull();
  });
});
