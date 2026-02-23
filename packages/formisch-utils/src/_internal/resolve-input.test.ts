import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import {
  isValibotSchema,
  isASTDocument,
  isASTNode,
  resolveInput,
} from "./resolve-input.ts";

describe("isValibotSchema", () => {
  test("returns true for a Valibot schema", () => {
    expect(isValibotSchema(v.string())).toBe(true);
    expect(isValibotSchema(v.object({ a: v.number() }))).toBe(true);
    expect(isValibotSchema(v.optional(v.boolean()))).toBe(true);
  });

  test("returns false for a plain object", () => {
    expect(isValibotSchema({ type: "string" })).toBe(false);
  });

  test("returns false for an ASTNode", () => {
    const node = schemaToAST(v.string()).schema;
    expect(isValibotSchema(node)).toBe(false);
  });

  test("returns false for an ASTDocument", () => {
    const doc = schemaToAST(v.string());
    expect(isValibotSchema(doc)).toBe(false);
  });

  test("returns false for primitives", () => {
    expect(isValibotSchema(null)).toBe(false);
    expect(isValibotSchema(undefined)).toBe(false);
    expect(isValibotSchema(42)).toBe(false);
    expect(isValibotSchema("string")).toBe(false);
  });
});

describe("isASTDocument", () => {
  test("returns true for an ASTDocument", () => {
    const doc = schemaToAST(v.string());
    expect(isASTDocument(doc)).toBe(true);
  });

  test("returns false for an ASTNode", () => {
    const node = schemaToAST(v.string()).schema;
    expect(isASTDocument(node)).toBe(false);
  });

  test("returns false for a Valibot schema", () => {
    expect(isASTDocument(v.string())).toBe(false);
  });

  test("returns false for primitives and null", () => {
    expect(isASTDocument(null)).toBe(false);
    expect(isASTDocument(undefined)).toBe(false);
  });
});

describe("isASTNode", () => {
  test("returns true for a schema ASTNode", () => {
    const node = schemaToAST(v.string()).schema;
    expect(isASTNode(node)).toBe(true);
  });

  test("returns true for a validation ASTNode in a pipe", () => {
    const doc = schemaToAST(v.pipe(v.string(), v.email()));
    const pipe = (doc.schema as any).pipe as unknown[];
    expect(isASTNode(pipe[0])).toBe(true);
  });

  test("returns false for an ASTDocument", () => {
    const doc = schemaToAST(v.string());
    expect(isASTNode(doc)).toBe(false);
  });

  test("returns false for a Valibot schema", () => {
    expect(isASTNode(v.string())).toBe(false);
  });

  test("returns false for primitives and null", () => {
    expect(isASTNode(null)).toBe(false);
    expect(isASTNode(42)).toBe(false);
  });
});

describe("resolveInput", () => {
  test("Valibot schema → correct AST node type", () => {
    const node = resolveInput(v.string());
    expect(node.kind).toBe("schema");
    expect(node.type).toBe("string");
  });

  test("ASTDocument → extracts .schema", () => {
    const doc = schemaToAST(v.number());
    const node = resolveInput(doc);
    expect(node.kind).toBe("schema");
    expect(node.type).toBe("number");
  });

  test("ASTNode → returned as-is", () => {
    const original = schemaToAST(v.boolean()).schema;
    const node = resolveInput(original);
    expect(node).toBe(original);
  });

  test("resolves nested schema correctly", () => {
    const node = resolveInput(v.object({ name: v.string() }));
    expect(node.type).toBe("object");
    expect((node as any).entries).toHaveProperty("name");
  });
});
