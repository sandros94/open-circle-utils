import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { inferMeta } from "./infer-meta.ts";

function ast(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return schemaToAST(schema).document.schema;
}

describe("inferMeta", () => {
  describe("label", () => {
    test("no metadata, no key → no label", () => {
      const result = inferMeta(ast(v.string()));
      expect(result.label).toBeUndefined();
    });

    test("no metadata, with key → titleCase(key)", () => {
      const result = inferMeta(ast(v.string()), "firstName");
      expect(result.label).toBe("First Name");
    });

    test("v.title() overrides key fallback", () => {
      const result = inferMeta(ast(v.pipe(v.string(), v.title("Email Address"))), "email");
      expect(result.label).toBe("Email Address");
    });

    test("v.title() without key", () => {
      const result = inferMeta(ast(v.pipe(v.string(), v.title("My Field"))));
      expect(result.label).toBe("My Field");
    });
  });

  describe("description", () => {
    test("no metadata → no description", () => {
      const result = inferMeta(ast(v.string()));
      expect(result.description).toBeUndefined();
    });

    test("v.description() extracts correctly", () => {
      const result = inferMeta(ast(v.pipe(v.string(), v.description("Enter your email address"))));
      expect(result.description).toBe("Enter your email address");
    });
  });

  describe("placeholder", () => {
    test("no metadata → no placeholder", () => {
      const result = inferMeta(ast(v.string()));
      expect(result.placeholder).toBeUndefined();
    });

    test("v.metadata({ placeholder }) extracts correctly", () => {
      const result = inferMeta(
        ast(v.pipe(v.string(), v.metadata({ placeholder: "e.g. john@example.com" })))
      );
      expect(result.placeholder).toBe("e.g. john@example.com");
    });

    test("v.examples() falls back to first example as placeholder", () => {
      const result = inferMeta(
        ast(v.pipe(v.string(), v.examples(["example@domain.com", "other@domain.com"])))
      );
      expect(result.placeholder).toBe("example@domain.com");
    });

    test("metadata.placeholder takes priority over examples", () => {
      const result = inferMeta(
        ast(
          v.pipe(
            v.string(),
            v.metadata({ placeholder: "from-metadata" }),
            v.examples(["from-examples"])
          )
        )
      );
      expect(result.placeholder).toBe("from-metadata");
    });

    test("non-string example is stringified", () => {
      const result = inferMeta(ast(v.pipe(v.number(), v.examples([42]))));
      expect(result.placeholder).toBe("42");
    });
  });

  describe("wrapped schemas", () => {
    test("title on inner schema (through optional wrapper)", () => {
      const result = inferMeta(
        ast(v.optional(v.pipe(v.string(), v.title("Inner Title")))),
        "myField"
      );
      // unwrapASTNode peels the optional, info is on the inner node
      expect(result.label).toBe("Inner Title");
    });

    test("key fallback through optional wrapper", () => {
      const result = inferMeta(ast(v.optional(v.string())), "myField");
      expect(result.label).toBe("My Field");
    });
  });

  describe("combined fields", () => {
    test("all three fields present", () => {
      const result = inferMeta(
        ast(
          v.pipe(
            v.string(),
            v.title("Full Name"),
            v.description("Your full legal name"),
            v.metadata({ placeholder: "John Doe" })
          )
        ),
        "fullName"
      );
      expect(result.label).toBe("Full Name");
      expect(result.description).toBe("Your full legal name");
      expect(result.placeholder).toBe("John Doe");
    });
  });

  describe("null/undefined example → no placeholder", () => {
    test("first example is null → placeholder stays undefined", () => {
      // Manually construct a node where info.examples[0] is null
      const node = {
        kind: "schema" as const,
        type: "string" as const,
        info: { examples: [null, "fallback"] },
      };
      const result = inferMeta(node as any);
      expect(result.placeholder).toBeUndefined();
    });

    test("first example is undefined → placeholder stays undefined", () => {
      const node = {
        kind: "schema" as const,
        type: "string" as const,
        info: { examples: [undefined, "fallback"] },
      };
      const result = inferMeta(node as any);
      expect(result.placeholder).toBeUndefined();
    });
  });
});
