import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { generateInitialInput } from "./generate-initial-input.ts";

describe("generateInitialInput", () => {
  describe("Valibot schema overload", () => {
    test("simple object schema", () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
        active: v.boolean(),
      });
      const result = generateInitialInput(schema);
      expect(result).toEqual({ name: "", age: undefined, active: false });
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
      expect(result).toEqual({ user: { name: "", age: undefined } });
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

  describe("SchemaToASTResult overload", () => {
    test("simple object from SchemaToASTResult", () => {
      const schema = v.object({ name: v.string(), count: v.number() });
      const astResult = schemaToAST(schema);
      const result = generateInitialInput(astResult);
      expect(result).toEqual({ name: "", count: undefined });
    });

    test("with explicit type parameter", () => {
      type MyForm = { name: string; count: number };
      const schema = v.object({ name: v.string(), count: v.number() });
      const astResult = schemaToAST(schema);
      const result = generateInitialInput<MyForm>(astResult);
      expect(result).toEqual({ name: "", count: undefined });
    });
  });

  describe("ASTDocument overload", () => {
    test("simple object from ASTDocument", () => {
      const schema = v.object({ name: v.string(), count: v.number() });
      const doc = schemaToAST(schema).document;
      const result = generateInitialInput(doc);
      expect(result).toEqual({ name: "", count: undefined });
    });
  });

  describe("ASTNode overload", () => {
    test("string ASTNode", () => {
      const node = schemaToAST(v.string()).document.schema;
      const result = generateInitialInput(node);
      expect(result).toBe("");
    });

    test("object ASTNode", () => {
      const node = schemaToAST(v.object({ x: v.number() })).document.schema;
      const result = generateInitialInput(node);
      expect(result).toEqual({ x: undefined });
    });

    test("with explicit type parameter", () => {
      const node = schemaToAST(v.number()).document.schema;
      const result = generateInitialInput<number>(node);
      expect(result).toBe(undefined);
    });
  });
});
