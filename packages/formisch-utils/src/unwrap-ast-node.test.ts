import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import type { WrappedASTNode } from "valibot-ast";
import { unwrapASTNode } from "./unwrap-ast-node.ts";

function ast(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return schemaToAST(schema).schema;
}

// ─── Non-wrapped nodes ────────────────────────────────────────────────────────

describe("unwrapASTNode — non-wrapped node", () => {
  test("string: required=true, nullable=false, no default", () => {
    const result = unwrapASTNode(ast(v.string()));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
    expect("default" in result).toBe(false);
  });

  test("number: required=true, nullable=false", () => {
    const result = unwrapASTNode(ast(v.number()));
    expect(result.node.type).toBe("number");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });

  test("object: required=true, nullable=false", () => {
    const result = unwrapASTNode(ast(v.object({ a: v.string() })));
    expect(result.node.type).toBe("object");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });
});

// ─── Single wrapper layer (from Valibot schemas) ──────────────────────────────
//
// Note: schemaToAST() (from valibot-ast) uses valibot-introspection's
// getWrappedSchema() which fully collapses all wrapper layers, so the AST
// always has ONE wrapper type wrapping the innermost schema. These tests
// reflect the single-wrapper AST that Valibot schemas actually produce.

describe("unwrapASTNode — single wrapper layer", () => {
  test("optional → required=false, nullable=false", () => {
    const result = unwrapASTNode(ast(v.optional(v.string())));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
  });

  test("exact_optional → required=false, nullable=false", () => {
    const result = unwrapASTNode(ast(v.exactOptional(v.string())));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
  });

  test("undefinedable → required=false, nullable=false", () => {
    const result = unwrapASTNode(ast(v.undefinedable(v.string())));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
  });

  test("nullable → required=true, nullable=true", () => {
    const result = unwrapASTNode(ast(v.nullable(v.string())));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(true);
  });

  test("nullish → required=false, nullable=true", () => {
    const result = unwrapASTNode(ast(v.nullish(v.string())));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
  });

  test("non_optional → required=true", () => {
    // v.nonOptional wraps an optional, AST collapses to non_optional(string)
    const result = unwrapASTNode(ast(v.nonOptional(v.optional(v.string()))));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });

  test("non_nullable → nullable=false", () => {
    const result = unwrapASTNode(ast(v.nonNullable(v.nullable(v.string()))));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });

  test("non_nullish → required=true, nullable=false", () => {
    const result = unwrapASTNode(ast(v.nonNullish(v.nullish(v.string()))));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });
});

// ─── Nested wrapper layers (manually-constructed AST) ────────────────────────
//
// Since schemaToAST collapses wrappers, we construct nested WrappedASTNode
// objects directly to test unwrapASTNode's multi-layer peeling logic.

describe("unwrapASTNode — nested wrappers (manual AST)", () => {
  const stringNode = { kind: "schema", type: "string" } as const;

  test("optional(nullable(string)) → required=false, nullable=true", () => {
    const node: WrappedASTNode = {
      kind: "schema",
      type: "optional",
      wrapped: {
        kind: "schema",
        type: "nullable",
        wrapped: stringNode,
      },
    };
    const result = unwrapASTNode(node);
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
  });

  test("nullable(optional(string)) → required=false, nullable=true", () => {
    const node: WrappedASTNode = {
      kind: "schema",
      type: "nullable",
      wrapped: {
        kind: "schema",
        type: "optional",
        wrapped: stringNode,
      },
    };
    const result = unwrapASTNode(node);
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
  });

  test("non_optional(optional(nullable(string))) → required=true, nullable=true", () => {
    const node: WrappedASTNode = {
      kind: "schema",
      type: "non_optional",
      wrapped: {
        kind: "schema",
        type: "optional",
        wrapped: {
          kind: "schema",
          type: "nullable",
          wrapped: stringNode,
        },
      },
    };
    const result = unwrapASTNode(node);
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true); // non_optional overrides optional
    expect(result.nullable).toBe(true); // nullable from inner layer
  });

  test("non_nullable(nullable(optional(string))) → nullable=false, required=false", () => {
    const node: WrappedASTNode = {
      kind: "schema",
      type: "non_nullable",
      wrapped: {
        kind: "schema",
        type: "nullable",
        wrapped: {
          kind: "schema",
          type: "optional",
          wrapped: stringNode,
        },
      },
    };
    const result = unwrapASTNode(node);
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false); // optional from inner layer
    expect(result.nullable).toBe(false); // non_nullable overrides nullable
  });

  test("deeply nested object is fully unwrapped", () => {
    const objectNode = { kind: "schema", type: "object", entries: {} } as const;
    const node: WrappedASTNode = {
      kind: "schema",
      type: "optional",
      wrapped: {
        kind: "schema",
        type: "nullable",
        wrapped: objectNode,
      },
    };
    const result = unwrapASTNode(node);
    expect(result.node.type).toBe("object");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
  });
});

// ─── Default values ───────────────────────────────────────────────────────────

describe("unwrapASTNode — default values", () => {
  test("optional with string default", () => {
    const result = unwrapASTNode(ast(v.optional(v.string(), "hello")));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect("default" in result).toBe(true);
    expect(result.default).toBe("hello");
  });

  test("optional with number default", () => {
    const result = unwrapASTNode(ast(v.optional(v.number(), 42)));
    expect(result.default).toBe(42);
  });

  test("nullable with null default", () => {
    const result = unwrapASTNode(ast(v.nullable(v.string(), null)));
    expect(result.default).toBe(null);
  });

  test("nullish with undefined default — no default captured", () => {
    // v.nullish() without a default produces no default in the AST
    const result = unwrapASTNode(ast(v.nullish(v.string())));
    expect("default" in result).toBe(false);
  });

  test("non-wrapped node has no default", () => {
    const result = unwrapASTNode(ast(v.string()));
    expect("default" in result).toBe(false);
  });

  test("manual outer wrapper default is captured", () => {
    const node: WrappedASTNode = {
      kind: "schema",
      type: "optional",
      default: "outer-default",
      wrapped: { kind: "schema", type: "string" },
    };
    const result = unwrapASTNode(node);
    expect(result.default).toBe("outer-default");
  });
});

// ─── Innermost node correctness ───────────────────────────────────────────────

describe("unwrapASTNode — innermost node correctness", () => {
  test("array inside optional", () => {
    const result = unwrapASTNode(ast(v.optional(v.array(v.string()))));
    expect(result.node.type).toBe("array");
    expect(result.required).toBe(false);
  });

  test("tuple inside nullable", () => {
    const result = unwrapASTNode(ast(v.nullable(v.tuple([v.string()]))));
    expect(result.node.type).toBe("tuple");
    expect(result.nullable).toBe(true);
  });

  test("returns exact same object reference for non-wrapped node", () => {
    const node = ast(v.string());
    const result = unwrapASTNode(node);
    expect(result.node).toBe(node);
  });
});
