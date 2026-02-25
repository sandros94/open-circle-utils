import { describe, test, expect } from "vitest";
import { coerceValue } from "./coerce-value.ts";
import type { LeafFormFieldConfig } from "./types.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function leaf(
  nodeType: string,
  opts: { required?: boolean; nullable?: boolean } = {}
): LeafFormFieldConfig {
  return {
    kind: "leaf",
    key: "field",
    path: ["field"],
    required: opts.required ?? true,
    nullable: opts.nullable ?? false,
    inputType: "text",
    nodeType,
  };
}

// ─── Pass-through (non-string raw values) ─────────────────────────────────────

describe("coerceValue", () => {
  describe("non-string pass-through", () => {
    test("boolean true passes through", () => {
      expect(coerceValue(leaf("boolean"), true)).toBe(true);
    });

    test("boolean false passes through", () => {
      expect(coerceValue(leaf("boolean"), false)).toBe(false);
    });

    test("File object passes through", () => {
      const file = new File([""], "test.txt");
      expect(coerceValue(leaf("file"), file)).toBe(file);
    });

    test("null passes through", () => {
      expect(coerceValue(leaf("number"), null)).toBeNull();
    });

    test("undefined passes through", () => {
      expect(coerceValue(leaf("number"), undefined)).toBeUndefined();
    });

    test("number value passes through", () => {
      expect(coerceValue(leaf("number"), 42)).toBe(42);
    });
  });

  // ─── Fallback semantics (empty string) ────────────────────────────────────────

  describe("fallback for empty string", () => {
    test("required + non-nullable → undefined (validation catches it)", () => {
      expect(coerceValue(leaf("number", { required: true, nullable: false }), "")).toBeUndefined();
    });

    test("required + nullable → null", () => {
      expect(coerceValue(leaf("number", { required: true, nullable: true }), "")).toBeNull();
    });

    test("optional (required=false) + non-nullable → undefined", () => {
      expect(coerceValue(leaf("number", { required: false, nullable: false }), "")).toBeUndefined();
    });

    test("optional (required=false) + nullable → undefined (not-provided wins over null)", () => {
      expect(coerceValue(leaf("number", { required: false, nullable: true }), "")).toBeUndefined();
    });
  });

  // ─── Number coercion ─────────────────────────────────────────────────────────

  describe("number", () => {
    test("integer string → number", () => {
      expect(coerceValue(leaf("number"), "42")).toBe(42);
    });

    test("float string → number", () => {
      expect(coerceValue(leaf("number"), "3.14")).toBe(3.14);
    });

    test("negative string → number", () => {
      expect(coerceValue(leaf("number"), "-7")).toBe(-7);
    });

    test("zero string → 0", () => {
      expect(coerceValue(leaf("number"), "0")).toBe(0);
    });

    test("non-numeric string → undefined (required)", () => {
      expect(coerceValue(leaf("number", { required: true }), "abc")).toBeUndefined();
    });

    test("non-numeric string → undefined (optional)", () => {
      expect(coerceValue(leaf("number", { required: false }), "abc")).toBeUndefined();
    });

    test("non-numeric string → null (required + nullable)", () => {
      expect(coerceValue(leaf("number", { required: true, nullable: true }), "abc")).toBeNull();
    });

    test("empty string + required → undefined", () => {
      expect(coerceValue(leaf("number", { required: true }), "")).toBeUndefined();
    });

    test("empty string + required + nullable → null", () => {
      expect(coerceValue(leaf("number", { required: true, nullable: true }), "")).toBeNull();
    });

    test("empty string + optional → undefined", () => {
      expect(coerceValue(leaf("number", { required: false }), "")).toBeUndefined();
    });
  });

  // ─── Bigint coercion ─────────────────────────────────────────────────────────

  describe("bigint", () => {
    test("integer string → bigint", () => {
      expect(coerceValue(leaf("bigint"), "42")).toBe(42n);
    });

    test("empty string → undefined", () => {
      expect(coerceValue(leaf("bigint", { required: true }), "")).toBeUndefined();
    });

    test("empty string + nullable → null", () => {
      expect(coerceValue(leaf("bigint", { required: true, nullable: true }), "")).toBeNull();
    });

    test("float string (invalid bigint) → undefined", () => {
      expect(coerceValue(leaf("bigint"), "3.14")).toBeUndefined();
    });

    test("non-numeric string → undefined", () => {
      expect(coerceValue(leaf("bigint"), "abc")).toBeUndefined();
    });
  });

  // ─── Boolean coercion ─────────────────────────────────────────────────────────

  describe("boolean", () => {
    test('"true" → true', () => {
      expect(coerceValue(leaf("boolean"), "true")).toBe(true);
    });

    test('"on" → true (checkbox)', () => {
      expect(coerceValue(leaf("boolean"), "on")).toBe(true);
    });

    test('"1" → true', () => {
      expect(coerceValue(leaf("boolean"), "1")).toBe(true);
    });

    test('"false" → false', () => {
      expect(coerceValue(leaf("boolean"), "false")).toBe(false);
    });

    test('"off" → false', () => {
      expect(coerceValue(leaf("boolean"), "off")).toBe(false);
    });

    test('"0" → false', () => {
      expect(coerceValue(leaf("boolean"), "0")).toBe(false);
    });

    test("empty string → false", () => {
      expect(coerceValue(leaf("boolean"), "")).toBe(false);
    });
  });

  // ─── Date coercion ────────────────────────────────────────────────────────────

  describe("date", () => {
    test("ISO date string → Date instance", () => {
      const result = coerceValue(leaf("date"), "2024-06-15");
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).toISOString()).toContain("2024-06-15");
    });

    test("ISO datetime string → Date instance", () => {
      const result = coerceValue(leaf("date"), "2024-06-15T12:00:00Z");
      expect(result).toBeInstanceOf(Date);
    });

    test("empty string → undefined (required)", () => {
      expect(coerceValue(leaf("date", { required: true }), "")).toBeUndefined();
    });

    test("empty string → null (required + nullable)", () => {
      expect(coerceValue(leaf("date", { required: true, nullable: true }), "")).toBeNull();
    });

    test("empty string → undefined (optional)", () => {
      expect(coerceValue(leaf("date", { required: false }), "")).toBeUndefined();
    });

    test("invalid date string → undefined", () => {
      expect(coerceValue(leaf("date", { required: true }), "not-a-date")).toBeUndefined();
    });

    test("invalid date string → null (required + nullable)", () => {
      expect(
        coerceValue(leaf("date", { required: true, nullable: true }), "not-a-date")
      ).toBeNull();
    });
  });

  // ─── Options-based coercion (enum/picklist/union-of-literals) ───────────────

  describe("options-based coercion", () => {
    test("numeric picklist option → coerces string to matching number", () => {
      const field = {
        ...leaf("picklist"),
        inputType: "select",
        options: [
          { value: 1, label: "1" },
          { value: 2, label: "2" },
          { value: 3, label: "3" },
        ],
      };
      expect(coerceValue(field, "2")).toBe(2);
    });

    test("boolean option → coerces string to matching boolean", () => {
      const field = {
        ...leaf("union"),
        inputType: "select",
        options: [
          { value: true, label: "Yes" },
          { value: false, label: "No" },
        ],
      };
      expect(coerceValue(field, "true")).toBe(true);
      expect(coerceValue(field, "false")).toBe(false);
    });

    test("string option → returns string as-is", () => {
      const field = {
        ...leaf("picklist"),
        inputType: "select",
        options: [
          { value: "react", label: "React" },
          { value: "vue", label: "Vue" },
        ],
      };
      expect(coerceValue(field, "vue")).toBe("vue");
    });

    test("empty string with options → returns fallback", () => {
      const field = {
        ...leaf("picklist", { required: true, nullable: true }),
        inputType: "select",
        options: [
          { value: 1, label: "1" },
        ],
      };
      expect(coerceValue(field, "")).toBeNull();
    });

    test("unmatched option → returns raw string", () => {
      const field = {
        ...leaf("picklist"),
        inputType: "select",
        options: [
          { value: 1, label: "1" },
        ],
      };
      expect(coerceValue(field, "unknown")).toBe("unknown");
    });
  });

  // ─── String / default pass-through ───────────────────────────────────────────

  describe("string and unknown nodeTypes", () => {
    test("string node → raw value returned as-is", () => {
      expect(coerceValue(leaf("string"), "hello")).toBe("hello");
    });

    test("string node, empty string → '' (not coerced)", () => {
      expect(coerceValue(leaf("string"), "")).toBe("");
    });

    test("unknown nodeType → raw value returned as-is", () => {
      expect(coerceValue(leaf("custom_type"), "whatever")).toBe("whatever");
    });
  });
});
