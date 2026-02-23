import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { getSchemaInfo } from "./get.ts";

describe("getSchemaInfo", () => {
  test("Schema with title", () => {
    const schema = v.pipe(v.string(), v.title("User Email"));

    const info = getSchemaInfo(schema);

    expect(info.title).toBe("User Email");
    expect(info.description).toBeUndefined();
    expect(info.examples).toEqual([]);
    expect(info.metadata).toEqual({});
  });

  test("Schema with description", () => {
    const schema = v.pipe(v.number(), v.description("Enter your age"));

    const info = getSchemaInfo(schema);

    expect(info.title).toBeUndefined();
    expect(info.description).toBe("Enter your age");
  });

  test("Schema with examples", () => {
    const schema = v.pipe(v.string(), v.examples(["example1", "example2", "example3"]));

    const info = getSchemaInfo(schema);

    expect(info.examples).toEqual(["example1", "example2", "example3"]);
  });

  test("Schema with metadata", () => {
    const schema = v.pipe(
      v.string(),
      v.metadata({
        label: "Username",
        placeholder: "Enter username",
        customProp: "custom value",
      })
    );

    const info = getSchemaInfo(schema);

    expect(info.metadata.label).toBe("Username");
    expect(info.metadata.placeholder).toBe("Enter username");
    expect(info.metadata.customProp).toBe("custom value");
  });

  test("Schema with all info", () => {
    const schema = v.pipe(
      v.string(),
      v.title("Email Address"),
      v.description("Your primary email"),
      v.examples(["user@example.com", "admin@example.com"]),
      v.metadata({
        placeholder: "user@example.com",
        icon: "email",
      })
    );

    const info = getSchemaInfo(schema);

    expect(info.title).toBe("Email Address");
    expect(info.description).toBe("Your primary email");
    expect(info.examples).toEqual(["user@example.com", "admin@example.com"]);
    expect(info.metadata.placeholder).toBe("user@example.com");
    expect(info.metadata.icon).toBe("email");
  });

  test("Schema without any info", () => {
    const schema = v.string();
    const info = getSchemaInfo(schema);

    expect(info.title).toBeUndefined();
    expect(info.description).toBeUndefined();
    expect(info.examples).toEqual([]);
    expect(info.metadata).toEqual({});
  });

  test("Multiple metadata actions merge", () => {
    const schema = v.pipe(
      v.string(),
      v.metadata({ first: "value1" }),
      v.metadata({ second: "value2" })
    );

    const info = getSchemaInfo(schema);

    expect(info.metadata.first).toBe("value1");
    expect(info.metadata.second).toBe("value2");
  });
});
