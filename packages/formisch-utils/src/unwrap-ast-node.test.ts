import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { unwrapASTNode } from "./unwrap-ast-node.ts";

/**
 * Smoke tests for the re-exported `unwrapASTNode`.
 * Comprehensive tests live in `valibot-ast/src/utils/wrapped/get-ast.test.ts`.
 */

function ast(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return schemaToAST(schema).document.schema;
}

describe("unwrapASTNode (re-export smoke test)", () => {
  test("unwraps optional wrapper", () => {
    const result = unwrapASTNode(ast(v.optional(v.string(), "hello")));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
    expect(result.default).toBe("hello");
  });

  test("non-wrapped node passes through", () => {
    const result = unwrapASTNode(ast(v.number()));
    expect(result.node.type).toBe("number");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
    expect("default" in result).toBe(false);
  });
});
