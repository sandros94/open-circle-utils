import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { inferInputConstraints } from "./infer-input-constraints.ts";

function ast(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return schemaToAST(schema).document.schema;
}

describe("inferInputConstraints", () => {
  describe("required", () => {
    test("required field → required: true", () => {
      const result = inferInputConstraints(ast(v.string()));
      expect(result.required).toBe(true);
    });

    test("optional field → no 'required' key in output", () => {
      const result = inferInputConstraints(ast(v.optional(v.string())));
      expect("required" in result).toBe(false);
    });

    test("nullish field → no 'required' key (nullish implies optional)", () => {
      const result = inferInputConstraints(ast(v.nullish(v.string())));
      expect("required" in result).toBe(false);
    });

    test("nullable field (not optional) → required: true", () => {
      // nullable means null is allowed but the field is still required
      const result = inferInputConstraints(ast(v.nullable(v.string())));
      expect(result.required).toBe(true);
    });

    test("caller-provided required=false overrides wrapper", () => {
      const result = inferInputConstraints(ast(v.string()), { required: false });
      expect("required" in result).toBe(false);
    });

    test("caller-provided required=true on optional field", () => {
      const result = inferInputConstraints(ast(v.optional(v.string())), {
        required: true,
      });
      expect(result.required).toBe(true);
    });
  });

  describe("length constraints", () => {
    test("minLength from min_length", () => {
      const result = inferInputConstraints(ast(v.pipe(v.string(), v.minLength(3))));
      expect(result.minLength).toBe(3);
    });

    test("maxLength from max_length", () => {
      const result = inferInputConstraints(ast(v.pipe(v.string(), v.maxLength(100))));
      expect(result.maxLength).toBe(100);
    });

    test("both from length (exact)", () => {
      const result = inferInputConstraints(ast(v.pipe(v.string(), v.length(10))));
      expect(result.minLength).toBe(10);
      expect(result.maxLength).toBe(10);
    });

    test("minLength=1 from nonEmpty", () => {
      const result = inferInputConstraints(ast(v.pipe(v.string(), v.nonEmpty())));
      expect(result.minLength).toBe(1);
      expect(result.maxLength).toBeUndefined();
    });

    test("minLength and maxLength combined", () => {
      const result = inferInputConstraints(
        ast(v.pipe(v.string(), v.minLength(2), v.maxLength(50)))
      );
      expect(result.minLength).toBe(2);
      expect(result.maxLength).toBe(50);
    });
  });

  describe("value constraints (numbers)", () => {
    test("min from minValue", () => {
      const result = inferInputConstraints(ast(v.pipe(v.number(), v.minValue(0))));
      expect(result.min).toBe(0);
    });

    test("max from maxValue", () => {
      const result = inferInputConstraints(ast(v.pipe(v.number(), v.maxValue(100))));
      expect(result.max).toBe(100);
    });

    test("min and max combined", () => {
      const result = inferInputConstraints(ast(v.pipe(v.number(), v.minValue(1), v.maxValue(10))));
      expect(result.min).toBe(1);
      expect(result.max).toBe(10);
    });

    test("negative values", () => {
      const result = inferInputConstraints(
        ast(v.pipe(v.number(), v.minValue(-100), v.maxValue(-1)))
      );
      expect(result.min).toBe(-100);
      expect(result.max).toBe(-1);
    });
  });

  describe("step", () => {
    test("step from multipleOf", () => {
      const result = inferInputConstraints(ast(v.pipe(v.number(), v.multipleOf(5))));
      expect(result.step).toBe(5);
    });

    test("step=1 from integer", () => {
      const result = inferInputConstraints(ast(v.pipe(v.number(), v.integer())));
      expect(result.step).toBe(1);
    });

    test("multipleOf takes priority over integer", () => {
      const result = inferInputConstraints(ast(v.pipe(v.number(), v.integer(), v.multipleOf(2))));
      expect(result.step).toBe(2);
    });
  });

  describe("pattern (regex)", () => {
    test("pattern from regex", () => {
      const result = inferInputConstraints(ast(v.pipe(v.string(), v.regex(/^[A-Z]{3}$/))));
      expect(result.pattern).toBe("^[A-Z]{3}$");
    });

    test("complex regex", () => {
      const result = inferInputConstraints(ast(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))));
      expect(result.pattern).toBe("^\\d{4}-\\d{2}-\\d{2}$");
    });
  });

  describe("accept (MIME types)", () => {
    test("single MIME type", () => {
      const result = inferInputConstraints(ast(v.pipe(v.file(), v.mimeType(["image/png"]))));
      expect(result.accept).toBe("image/png");
    });

    test("multiple MIME types → comma-joined", () => {
      const result = inferInputConstraints(
        ast(v.pipe(v.file(), v.mimeType(["image/png", "image/jpeg", "image/webp"])))
      );
      expect(result.accept).toBe("image/png,image/jpeg,image/webp");
    });
  });

  describe("no constraints", () => {
    test("plain string → empty constraints (except possibly required)", () => {
      const result = inferInputConstraints(ast(v.string()));
      expect(result.minLength).toBeUndefined();
      expect(result.maxLength).toBeUndefined();
      expect(result.min).toBeUndefined();
      expect(result.max).toBeUndefined();
      expect(result.step).toBeUndefined();
      expect(result.pattern).toBeUndefined();
      expect(result.accept).toBeUndefined();
    });
  });

  describe("wrapper transparency", () => {
    test("constraints are extracted from inner node when wrapped", () => {
      const result = inferInputConstraints(
        ast(v.optional(v.pipe(v.string(), v.minLength(5), v.maxLength(50))))
      );
      expect("required" in result).toBe(false);
      expect(result.minLength).toBe(5);
      expect(result.maxLength).toBe(50);
    });
  });

  describe("Date min/max", () => {
    test("minValue with Date → ISO date string", () => {
      const result = inferInputConstraints(
        ast(v.pipe(v.date(), v.minValue(new Date("2024-01-01"))))
      );
      expect(result.min).toBe("2024-01-01");
    });

    test("maxValue with Date → ISO date string", () => {
      const result = inferInputConstraints(
        ast(v.pipe(v.date(), v.maxValue(new Date("2024-12-31"))))
      );
      expect(result.max).toBe("2024-12-31");
    });
  });

  describe("regex as RegExp instance", () => {
    test("regex requirement as actual RegExp instance → pattern from .source", () => {
      const node = {
        kind: "schema" as const,
        type: "string" as const,
        pipe: [
          {
            kind: "validation" as const,
            type: "regex" as const,
            requirement: /^[A-Z]+$/,
          },
        ],
      };
      const result = inferInputConstraints(node as any);
      expect(result.pattern).toBe("^[A-Z]+$");
    });
  });

  describe("regex as plain object", () => {
    test("regex requirement stored as { source, flags } object → pattern extracted from source", () => {
      // AST may serialise RegExp as a plain object { source, flags } instead of a RegExp instance
      const node = {
        kind: "schema" as const,
        type: "string" as const,
        pipe: [
          {
            kind: "validation" as const,
            type: "regex" as const,
            requirement: { source: "^[A-Z]+$", flags: "" },
          },
        ],
      };
      const result = inferInputConstraints(node as any);
      expect(result.pattern).toBe("^[A-Z]+$");
    });
  });

  describe("accept non-array mime type", () => {
    test("mime_type requirement as plain string → String(req) branch", () => {
      // Normally MIME types are arrays, but the code handles non-arrays with String(req)
      const node = {
        kind: "schema" as const,
        type: "file" as const,
        pipe: [
          {
            kind: "validation" as const,
            type: "mime_type" as const,
            requirement: "image/png",
          },
        ],
      };
      const result = inferInputConstraints(node as any);
      expect(result.accept).toBe("image/png");
    });
  });
});
