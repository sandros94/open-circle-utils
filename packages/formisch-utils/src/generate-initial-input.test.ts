import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { generateInitialInput } from "./generate-initial-input.ts";

describe("generateInitialInput — Valibot schema overload", () => {
  test("simple object schema", () => {
    const schema = v.object({
      name: v.string(),
      age: v.number(),
      active: v.boolean(),
    });
    const result = generateInitialInput(schema);
    expect(result).toEqual({ name: "", age: 0, active: false });
  });

  test("schema with optional field", () => {
    const schema = v.object({
      email: v.string(),
      phone: v.optional(v.string()),
    });
    const result = generateInitialInput(schema);
    expect(result).toEqual({ email: "", phone: undefined });
  });

  test("schema with default value", () => {
    const schema = v.object({
      role: v.optional(v.string(), "user"),
    });
    const result = generateInitialInput(schema);
    expect(result).toEqual({ role: "user" });
  });

  test("nested schema", () => {
    const schema = v.object({
      user: v.object({
        name: v.string(),
        age: v.number(),
      }),
    });
    const result = generateInitialInput(schema);
    expect(result).toEqual({ user: { name: "", age: 0 } });
  });

  test("array schema", () => {
    const schema = v.array(v.string());
    const result = generateInitialInput(schema);
    expect(result).toEqual([]);
  });

  test("plain string schema", () => {
    const schema = v.string();
    const result = generateInitialInput(schema);
    expect(result).toBe("");
  });
});

describe("generateInitialInput — ASTDocument overload", () => {
  test("simple object from ASTDocument", () => {
    const schema = v.object({ name: v.string(), count: v.number() });
    const doc = schemaToAST(schema);
    const result = generateInitialInput(doc);
    expect(result).toEqual({ name: "", count: 0 });
  });

  test("with explicit type parameter", () => {
    type MyForm = { name: string; count: number };
    const schema = v.object({ name: v.string(), count: v.number() });
    const doc = schemaToAST(schema);
    const result = generateInitialInput<MyForm>(doc);
    expect(result).toEqual({ name: "", count: 0 });
  });
});

describe("generateInitialInput — ASTNode overload", () => {
  test("string ASTNode", () => {
    const node = schemaToAST(v.string()).schema;
    const result = generateInitialInput(node);
    expect(result).toBe("");
  });

  test("object ASTNode", () => {
    const node = schemaToAST(v.object({ x: v.number() })).schema;
    const result = generateInitialInput(node);
    expect(result).toEqual({ x: 0 });
  });

  test("with explicit type parameter", () => {
    const node = schemaToAST(v.number()).schema;
    const result = generateInitialInput<number>(node);
    expect(result).toBe(0);
  });
});
