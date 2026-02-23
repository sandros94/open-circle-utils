import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { inferInputConstraints } from "./infer-input-constraints.ts";

function ast(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return schemaToAST(schema).schema;
}

describe("inferInputConstraints — required", () => {
  test("required field → no 'required' key in output", () => {
    const result = inferInputConstraints(ast(v.string()));
    expect("required" in result).toBe(false);
  });

  test("optional field → required: false", () => {
    const result = inferInputConstraints(ast(v.optional(v.string())));
    expect(result.required).toBe(false);
  });

  test("nullish field → required: false (nullish implies optional)", () => {
    const result = inferInputConstraints(ast(v.nullish(v.string())));
    expect(result.required).toBe(false);
  });

  test("nullable field (not optional) → no 'required' key", () => {
    // nullable means null is allowed but the field is still required
    const result = inferInputConstraints(ast(v.nullable(v.string())));
    expect("required" in result).toBe(false);
  });

  test("caller-provided required=false overrides wrapper", () => {
    const result = inferInputConstraints(ast(v.string()), { required: false });
    expect(result.required).toBe(false);
  });

  test("caller-provided required=true on optional field", () => {
    const result = inferInputConstraints(ast(v.optional(v.string())), {
      required: true,
    });
    // caller override: no required: false in output
    expect("required" in result).toBe(false);
  });
});

describe("inferInputConstraints — length constraints", () => {
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
    const result = inferInputConstraints(ast(v.pipe(v.string(), v.minLength(2), v.maxLength(50))));
    expect(result.minLength).toBe(2);
    expect(result.maxLength).toBe(50);
  });
});

describe("inferInputConstraints — value constraints (numbers)", () => {
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
    const result = inferInputConstraints(ast(v.pipe(v.number(), v.minValue(-100), v.maxValue(-1))));
    expect(result.min).toBe(-100);
    expect(result.max).toBe(-1);
  });
});

describe("inferInputConstraints — step", () => {
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

describe("inferInputConstraints — pattern (regex)", () => {
  test("pattern from regex", () => {
    const result = inferInputConstraints(ast(v.pipe(v.string(), v.regex(/^[A-Z]{3}$/))));
    expect(result.pattern).toBe("^[A-Z]{3}$");
  });

  test("complex regex", () => {
    const result = inferInputConstraints(ast(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))));
    expect(result.pattern).toBe("^\\d{4}-\\d{2}-\\d{2}$");
  });
});

describe("inferInputConstraints — accept (MIME types)", () => {
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

describe("inferInputConstraints — no constraints", () => {
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

describe("inferInputConstraints — wrapper transparency", () => {
  test("constraints are extracted from inner node when wrapped", () => {
    const result = inferInputConstraints(
      ast(v.optional(v.pipe(v.string(), v.minLength(5), v.maxLength(50))))
    );
    expect(result.required).toBe(false);
    expect(result.minLength).toBe(5);
    expect(result.maxLength).toBe(50);
  });
});
