import { describe, test, expect } from "vitest";
import * as v from "valibot";
import type { WrappedASTNode } from "../../types/index.ts";
import { schemaToAST } from "../../to-ast.ts";
import { getWrappedASTNode } from "./get-ast.ts";

function ast(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return schemaToAST(schema).document.schema;
}

// ─── Non-wrapped nodes ────────────────────────────────────────────────────────

describe("getWrappedASTNode — non-wrapped node", () => {
  test("string: required=true, nullable=false, no default", () => {
    const result = getWrappedASTNode(ast(v.string()));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
    expect("default" in result).toBe(false);
  });

  test("number: required=true, nullable=false", () => {
    const result = getWrappedASTNode(ast(v.number()));
    expect(result.node.type).toBe("number");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });

  test("object: required=true, nullable=false", () => {
    const result = getWrappedASTNode(ast(v.object({ a: v.string() })));
    expect(result.node.type).toBe("object");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });
});

// ─── Single wrapper layer (from Valibot schemas) ──────────────────────────────

describe("getWrappedASTNode — single wrapper layer", () => {
  test("optional → required=false, nullable=false", () => {
    const result = getWrappedASTNode(ast(v.optional(v.string())));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
  });

  test("exact_optional → required=false, nullable=false", () => {
    const result = getWrappedASTNode(ast(v.exactOptional(v.string())));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
  });

  test("undefinedable → required=false, nullable=false", () => {
    const result = getWrappedASTNode(ast(v.undefinedable(v.string())));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
  });

  test("nullable → required=true, nullable=true", () => {
    const result = getWrappedASTNode(ast(v.nullable(v.string())));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(true);
  });

  test("nullish → required=false, nullable=true", () => {
    const result = getWrappedASTNode(ast(v.nullish(v.string())));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
  });

  test("non_optional → required=true", () => {
    const result = getWrappedASTNode(ast(v.nonOptional(v.optional(v.string()))));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });

  test("non_nullable → nullable=false", () => {
    const result = getWrappedASTNode(ast(v.nonNullable(v.nullable(v.string()))));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });

  test("non_nullish → required=true, nullable=false", () => {
    const result = getWrappedASTNode(ast(v.nonNullish(v.nullish(v.string()))));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });
});

// ─── Nested wrapper layers (manually-constructed AST) ────────────────────────

describe("getWrappedASTNode — nested wrappers (manual AST)", () => {
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
    const result = getWrappedASTNode(node);
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
    const result = getWrappedASTNode(node);
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
    const result = getWrappedASTNode(node);
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(true);
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
    const result = getWrappedASTNode(node);
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
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
    const result = getWrappedASTNode(node);
    expect(result.node.type).toBe("object");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
  });
});

// ─── Default values ───────────────────────────────────────────────────────────

describe("getWrappedASTNode — default values", () => {
  test("optional with string default", () => {
    const result = getWrappedASTNode(ast(v.optional(v.string(), "hello")));
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect("default" in result).toBe(true);
    expect(result.default).toBe("hello");
  });

  test("optional with number default", () => {
    const result = getWrappedASTNode(ast(v.optional(v.number(), 42)));
    expect(result.default).toBe(42);
  });

  test("nullable with null default", () => {
    const result = getWrappedASTNode(ast(v.nullable(v.string(), null)));
    expect(result.default).toBe(null);
  });

  test("nullish with undefined default — no default captured", () => {
    const result = getWrappedASTNode(ast(v.nullish(v.string())));
    expect("default" in result).toBe(false);
  });

  test("non-wrapped node has no default", () => {
    const result = getWrappedASTNode(ast(v.string()));
    expect("default" in result).toBe(false);
  });

  test("manual outer wrapper default is captured", () => {
    const node: WrappedASTNode = {
      kind: "schema",
      type: "optional",
      default: "outer-default",
      wrapped: { kind: "schema", type: "string" },
    };
    const result = getWrappedASTNode(node);
    expect(result.default).toBe("outer-default");
  });
});

// ─── Innermost node correctness ───────────────────────────────────────────────

describe("getWrappedASTNode — innermost node correctness", () => {
  test("array inside optional", () => {
    const result = getWrappedASTNode(ast(v.optional(v.array(v.string()))));
    expect(result.node.type).toBe("array");
    expect(result.required).toBe(false);
  });

  test("tuple inside nullable", () => {
    const result = getWrappedASTNode(ast(v.nullable(v.tuple([v.string()]))));
    expect(result.node.type).toBe("tuple");
    expect(result.nullable).toBe(true);
  });

  test("returns exact same object reference for non-wrapped node", () => {
    const node = ast(v.string());
    const result = getWrappedASTNode(node);
    expect(result.node).toBe(node);
  });
});

// ─── Lock flags ───────────────────────────────────────────────────────────────

describe("getWrappedASTNode — lock flags (manual AST)", () => {
  test("non_optional(nullish(string)) → requiredLocked blocks nullish from overriding required", () => {
    const node: WrappedASTNode = {
      kind: "schema",
      type: "non_optional",
      wrapped: {
        kind: "schema",
        type: "nullish",
        wrapped: { kind: "schema", type: "string" },
      },
    };
    const result = getWrappedASTNode(node);
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(true);
  });

  test("non_nullable(nullish(string)) → nullableLocked blocks nullish from overriding nullable", () => {
    const node: WrappedASTNode = {
      kind: "schema",
      type: "non_nullable",
      wrapped: {
        kind: "schema",
        type: "nullish",
        wrapped: { kind: "schema", type: "string" },
      },
    };
    const result = getWrappedASTNode(node);
    expect(result.node.type).toBe("string");
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
  });
});
