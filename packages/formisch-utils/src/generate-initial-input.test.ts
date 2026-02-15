import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { generateInitialInput } from "./generate-initial-input";

describe("generateInitialInput", () => {
  describe("primitive types", () => {
    it("should generate empty string for string schema", () => {
      const schema = v.string();
      const result = generateInitialInput(schema);
      expect(result).toBe("");
    });

    it("should generate 0 for number schema", () => {
      const schema = v.number();
      const result = generateInitialInput(schema);
      expect(result).toBe(0);
    });

    it("should generate 0 for bigint schema", () => {
      const schema = v.bigint();
      const result = generateInitialInput(schema);
      expect(result).toBe(0);
    });

    it("should generate false for boolean schema", () => {
      const schema = v.boolean();
      const result = generateInitialInput(schema);
      expect(result).toBe(false);
    });

    it("should generate Date for date schema", () => {
      const schema = v.date();
      const result = generateInitialInput(schema);
      expect(result).toBeInstanceOf(Date);
    });

    it("should generate null for null schema", () => {
      const schema = v.null_();
      const result = generateInitialInput(schema);
      expect(result).toBe(null);
    });

    it("should generate undefined for undefined schema", () => {
      const schema = v.undefined_();
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });

    it("should generate undefined for void schema", () => {
      const schema = v.void_();
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });

    it("should generate undefined for any schema", () => {
      const schema = v.any();
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });

    it("should generate undefined for unknown schema", () => {
      const schema = v.unknown();
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });
  });

  describe("literal schemas", () => {
    it("should generate literal string value", () => {
      const schema = v.literal("success");
      const result = generateInitialInput(schema);
      expect(result).toBe("success");
    });

    it("should generate literal number value", () => {
      const schema = v.literal(42);
      const result = generateInitialInput(schema);
      expect(result).toBe(42);
    });

    it("should generate literal boolean value", () => {
      const schema = v.literal(true);
      const result = generateInitialInput(schema);
      expect(result).toBe(true);
    });
  });

  describe("picklist schemas", () => {
    it("should generate first option from picklist", () => {
      const schema = v.picklist(["red", "green", "blue"]);
      const result = generateInitialInput(schema);
      expect(result).toBe("red");
    });

    it("should handle empty picklist", () => {
      const schema = v.picklist([]);
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });
  });

  describe("enum schemas", () => {
    it("should generate first value from enum", () => {
      enum Status {
        Active = "active",
        Inactive = "inactive",
        Pending = "pending",
      }
      const schema = v.enum_(Status);
      const result = generateInitialInput(schema);
      expect(result).toBe("active");
    });
  });

  describe("object schemas", () => {
    it("should generate object with all fields", () => {
      const schema = v.object({
        name: v.string(),
        age: v.number(),
        active: v.boolean(),
      });
      const result = generateInitialInput(schema);
      expect(result).toEqual({
        name: "",
        age: 0,
        active: false,
      });
    });

    it("should generate nested objects", () => {
      const schema = v.object({
        user: v.object({
          name: v.string(),
          email: v.string(),
        }),
        settings: v.object({
          theme: v.literal("dark"),
          notifications: v.boolean(),
        }),
      });
      const result = generateInitialInput(schema);
      expect(result).toEqual({
        user: {
          name: "",
          email: "",
        },
        settings: {
          theme: "dark",
          notifications: false,
        },
      });
    });

    it("should handle empty object schema", () => {
      const schema = v.object({});
      const result = generateInitialInput(schema);
      expect(result).toEqual({});
    });

    it("should handle object with piped schemas", () => {
      const schema = v.object({
        email: v.pipe(v.string(), v.email()),
        password: v.pipe(v.string(), v.minLength(8)),
      });
      const result = generateInitialInput(schema);
      expect(result).toEqual({
        email: "",
        password: "",
      });
    });
  });

  describe("array schemas", () => {
    it("should generate empty array by default", () => {
      const schema = v.array(v.string());
      const result = generateInitialInput(schema);
      expect(result).toEqual([]);
    });

    it("should generate undefined for optional array", () => {
      const schema = v.optional(v.array(v.number()));
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });

    it("should handle arrays of objects", () => {
      const schema = v.array(
        v.object({
          name: v.string(),
          value: v.number(),
        }),
      );
      const result = generateInitialInput(schema);
      expect(result).toEqual([]);
    });
  });

  describe("tuple schemas", () => {
    it("should generate tuple with correct values", () => {
      const schema = v.tuple([v.string(), v.number(), v.boolean()]);
      const result = generateInitialInput(schema);
      expect(result).toEqual(["", 0, false]);
    });

    it("should generate undefined for optional tuple", () => {
      const schema = v.optional(v.tuple([v.string(), v.number()]));
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });

    it("should handle tuple with rest", () => {
      const schema = v.tupleWithRest([v.string(), v.number()], v.boolean());
      const result = generateInitialInput(schema);
      expect(result).toEqual(["", 0]);
    });
  });

  describe("record schemas", () => {
    it("should generate empty object for record by default", () => {
      const schema = v.record(v.string(), v.number());
      const result = generateInitialInput(schema);
      expect(result).toEqual({});
    });

    it("should generate undefined for optional record", () => {
      const schema = v.optional(v.record(v.string(), v.string()));
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });
  });

  describe("wrapped schemas", () => {
    it("should return undefined for optional schema", () => {
      const schema = v.optional(v.string());
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });

    it("should use default value when provided", () => {
      const schema = v.optional(v.string(), "default-value");
      const result = generateInitialInput(schema);
      expect(result).toBe("default-value");
    });

    it("should return null for nullable schema", () => {
      const schema = v.nullable(v.number());
      const result = generateInitialInput(schema);
      expect(result).toBe(null);
    });

    it("should return undefined for nullish schema", () => {
      const schema = v.nullish(v.boolean());
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });

    it("should handle deeply nested wrapped schemas", () => {
      const schema = v.optional(v.nullable(v.string()));
      const result = generateInitialInput(schema);
      // optional (required: false) takes precedence, so result is undefined
      expect(result).toBe(undefined);
    });

    it("should return value for nonOptional wrapped schema", () => {
      const schema = v.nonOptional(v.optional(v.string()));
      const result = generateInitialInput(schema);
      expect(result).toBe("");
    });
  });

  describe("union schemas", () => {
    it("should use first option from union", () => {
      const schema = v.union([v.string(), v.number()]);
      const result = generateInitialInput(schema);
      expect(result).toBe("");
    });

    it("should handle union with objects", () => {
      const schema = v.union([
        v.object({ type: v.literal("a"), value: v.string() }),
        v.object({ type: v.literal("b"), value: v.number() }),
      ]);
      const result = generateInitialInput(schema);
      expect(result).toEqual({ type: "a", value: "" });
    });
  });

  describe("variant schemas", () => {
    it("should use first option from variant", () => {
      const schema = v.variant("type", [
        v.object({ type: v.literal("text"), content: v.string() }),
        v.object({ type: v.literal("number"), content: v.number() }),
      ]);
      const result = generateInitialInput(schema);
      expect(result).toEqual({ type: "text", content: "" });
    });
  });

  describe("lazy schemas", () => {
    it("should evaluate lazy schema and generate initial values", () => {
      const schema = v.lazy(() =>
        v.object({
          name: v.string(),
          age: v.number(),
        }),
      );
      const result = generateInitialInput(schema);
      expect(result).toEqual({ name: "", age: 0 });
    });

    it("should handle nested lazy schemas", () => {
      const schema = v.object({
        user: v.lazy(() =>
          v.object({
            email: v.string(),
            active: v.boolean(),
          }),
        ),
      });
      const result = generateInitialInput(schema);
      expect(result).toEqual({
        user: { email: "", active: false },
      });
    });
  });

  describe("intersect schemas", () => {
    it("should merge initial values from intersected object schemas", () => {
      const schema = v.intersect([
        v.object({ name: v.string() }),
        v.object({ age: v.number() }),
      ]);
      const result = generateInitialInput(schema);
      expect(result).toEqual({ name: "", age: 0 });
    });

    it("should handle intersect with multiple object schemas", () => {
      const schema = v.intersect([
        v.object({ firstName: v.string(), lastName: v.string() }),
        v.object({ email: v.string() }),
        v.object({ age: v.number(), active: v.boolean() }),
      ]);
      const result = generateInitialInput(schema);
      expect(result).toEqual({
        firstName: "",
        lastName: "",
        email: "",
        age: 0,
        active: false,
      });
    });

    it("should return empty object for empty intersect", () => {
      const schema = v.intersect([]);
      const result = generateInitialInput(schema);
      expect(result).toEqual({});
    });
  });

  describe("complex real-world schemas", () => {
    it("should handle login form schema", () => {
      const LoginSchema = v.object({
        email: v.pipe(v.string(), v.email()),
        password: v.pipe(v.string(), v.minLength(8)),
        rememberMe: v.optional(v.boolean()),
      });

      const result = generateInitialInput(LoginSchema);
      expect(result).toEqual({
        email: "",
        password: "",
        rememberMe: undefined,
      });
    });

    it("should handle user profile schema", () => {
      const UserProfileSchema = v.object({
        personalInfo: v.object({
          firstName: v.string(),
          lastName: v.string(),
          age: v.optional(v.number()),
        }),
        contact: v.object({
          email: v.pipe(v.string(), v.email()),
          phone: v.optional(v.string()),
        }),
        preferences: v.object({
          theme: v.picklist(["light", "dark", "auto"]),
          notifications: v.boolean(),
        }),
        tags: v.array(v.string()),
      });

      const result = generateInitialInput(UserProfileSchema);
      expect(result).toEqual({
        personalInfo: {
          firstName: "",
          lastName: "",
          age: undefined,
        },
        contact: {
          email: "",
          phone: undefined,
        },
        preferences: {
          theme: "light",
          notifications: false,
        },
        tags: [],
      });
    });

    it("should handle todo form schema", () => {
      const TodoFormSchema = v.object({
        heading: v.string(),
        todos: v.pipe(
          v.array(
            v.object({
              label: v.pipe(v.string(), v.nonEmpty()),
              deadline: v.pipe(v.string(), v.nonEmpty()),
            }),
          ),
          v.nonEmpty(),
          v.maxLength(4),
        ),
      });

      const result = generateInitialInput(TodoFormSchema);
      expect(result).toEqual({
        heading: "",
        todos: [],
      });
    });
  });

  describe("additional schema types", () => {
    it("should generate File for file schema", () => {
      const schema = v.file();
      const result = generateInitialInput(schema);
      expect(result).toBeInstanceOf(File);
    });

    it("should generate Blob for blob schema", () => {
      const schema = v.blob();
      const result = generateInitialInput(schema);
      expect(result).toBeInstanceOf(Blob);
    });

    it("should generate NaN for nan schema", () => {
      const schema = v.nan();
      const result = generateInitialInput(schema);
      expect(result).toBeNaN();
    });

    it("should generate Symbol for symbol schema", () => {
      const schema = v.symbol();
      const result = generateInitialInput(schema);
      expect(typeof result).toBe("symbol");
    });

    it("should generate Map for map schema", () => {
      const schema = v.map(v.string(), v.number());
      const result = generateInitialInput(schema);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it("should generate Set for set schema", () => {
      const schema = v.set(v.string());
      const result = generateInitialInput(schema);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it("should generate undefined for never schema", () => {
      const schema = v.never();
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });

    it("should generate undefined for function schema", () => {
      const schema = v.function();
      const result = generateInitialInput(schema);
      expect(result).toBe(undefined);
    });
  });

  describe("customGenerator", () => {
    it("should use customGenerator for unknown schema types", () => {
      const customGenerator = (schema: any) => {
        if (schema.type === "custom") {
          return "custom-default";
        }
        return undefined;
      };

      const schema = v.custom<string>((input) => typeof input === "string");
      const result = generateInitialInput(schema, { customGenerator });
      expect(result).toBe("custom-default");
    });

    it("should throw error for unknown schema type without customGenerator", () => {
      const schema = v.custom<string>((input) => typeof input === "string");
      expect(() => generateInitialInput(schema)).toThrow(
        'Unable to generate initial value for schema type "custom"',
      );
    });

    it("should use customGenerator as fallback for deeply nested custom schemas", () => {
      const customGenerator = () => "fallback-value";

      const schema = v.object({
        name: v.string(),
        customField: v.custom<number>((input) => typeof input === "number"),
      });

      const result = generateInitialInput(schema, { customGenerator });
      expect(result).toEqual({
        name: "",
        customField: "fallback-value",
      });
    });
  });
});
