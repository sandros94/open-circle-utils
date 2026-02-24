import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { getWrappedSchema } from "./get.ts";

describe("wrapped", () => {
  describe("get", () => {
    describe("getWrappedSchema", () => {
      describe("non-wrapped schemas", () => {
        it("returns wasWrapped=false for plain string schema", () => {
          const result = getWrappedSchema(v.string());
          expect(result.wasWrapped).toBe(false);
          expect(result.schema.type).toBe("string");
        });

        it("returns wasWrapped=false for plain object schema", () => {
          const result = getWrappedSchema(v.object({}));
          expect(result.wasWrapped).toBe(false);
          expect(result.schema.type).toBe("object");
        });

        it("returns wasWrapped=false for array schema", () => {
          const result = getWrappedSchema(v.array(v.string()));
          expect(result.wasWrapped).toBe(false);
          expect(result.schema.type).toBe("array");
        });
      });

      describe("optional wrapper", () => {
        it("unwraps optional and sets required=false, nullable=false", () => {
          const result = getWrappedSchema(v.optional(v.string()));
          expect(result.wasWrapped).toBe(true);
          if (result.wasWrapped) {
            expect(result.schema.type).toBe("string");
            expect(result.required).toBe(false);
            expect(result.nullable).toBe(false);
          }
        });

        it("unwraps optional with default value", () => {
          const result = getWrappedSchema(v.optional(v.string(), "fallback"));
          expect(result.wasWrapped).toBe(true);
          if (result.wasWrapped) {
            expect(result.defaultValue).toBe("fallback");
          }
        });
      });

      describe("nullable wrapper", () => {
        it("unwraps nullable and sets required=true, nullable=true", () => {
          const result = getWrappedSchema(v.nullable(v.string()));
          expect(result.wasWrapped).toBe(true);
          if (result.wasWrapped) {
            expect(result.schema.type).toBe("string");
            expect(result.required).toBe(true);
            expect(result.nullable).toBe(true);
          }
        });
      });

      describe("nullish wrapper", () => {
        it("unwraps nullish and sets required=false, nullable=true", () => {
          const result = getWrappedSchema(v.nullish(v.string()));
          expect(result.wasWrapped).toBe(true);
          if (result.wasWrapped) {
            expect(result.schema.type).toBe("string");
            expect(result.required).toBe(false);
            expect(result.nullable).toBe(true);
          }
        });
      });

      describe("nonOptional wrapper", () => {
        it("unwraps nonOptional wrapping optional, sets required=true", () => {
          const result = getWrappedSchema(v.nonOptional(v.optional(v.string())));
          expect(result.wasWrapped).toBe(true);
          if (result.wasWrapped) {
            expect(result.schema.type).toBe("string");
            expect(result.required).toBe(true);
          }
        });
      });

      describe("nonNullable wrapper", () => {
        it("unwraps nonNullable wrapping nullable, sets nullable=false", () => {
          const result = getWrappedSchema(v.nonNullable(v.nullable(v.string())));
          expect(result.wasWrapped).toBe(true);
          if (result.wasWrapped) {
            expect(result.schema.type).toBe("string");
            expect(result.nullable).toBe(false);
          }
        });
      });

      describe("nonNullish wrapper", () => {
        it("unwraps nonNullish wrapping nullish, sets nullable=false", () => {
          const result = getWrappedSchema(v.nonNullish(v.nullish(v.string())));
          expect(result.wasWrapped).toBe(true);
          if (result.wasWrapped) {
            expect(result.schema.type).toBe("string");
            expect(result.nullable).toBe(false);
          }
        });
      });

      describe("exactOptional wrapper", () => {
        it("unwraps exactOptional and sets required=false", () => {
          const result = getWrappedSchema(v.exactOptional(v.string()));
          expect(result.wasWrapped).toBe(true);
          if (result.wasWrapped) {
            expect(result.schema.type).toBe("string");
            expect(result.required).toBe(false);
          }
        });
      });

      describe("undefinedable wrapper", () => {
        it("unwraps undefinedable and sets required=false", () => {
          const result = getWrappedSchema(v.undefinedable(v.string()));
          expect(result.wasWrapped).toBe(true);
          if (result.wasWrapped) {
            expect(result.schema.type).toBe("string");
            expect(result.required).toBe(false);
          }
        });
      });

      describe("outermost-wins semantics", () => {
        it("outer optional overrides inner nonOptional: required=false", () => {
          const result = getWrappedSchema(v.optional(v.nonOptional(v.string())));
          if (result.wasWrapped) {
            expect(result.required).toBe(false);
          }
        });

        it("outer nonOptional overrides inner optional: required=true", () => {
          const result = getWrappedSchema(v.nonOptional(v.optional(v.string())));
          if (result.wasWrapped) {
            expect(result.required).toBe(true);
          }
        });

        it("deeply nested wrappers unwrap to inner schema with outermost flags", () => {
          const result = getWrappedSchema(v.optional(v.nullable(v.string())));
          expect(result.wasWrapped).toBe(true);
          if (result.wasWrapped) {
            expect(result.schema.type).toBe("string");
            expect(result.required).toBe(false);
            expect(result.nullable).toBe(true);
          }
        });

        it("triple-nested: outer optional wins over inner nonOptional", () => {
          const result = getWrappedSchema(v.optional(v.nonOptional(v.optional(v.string()))));
          if (result.wasWrapped) {
            expect(result.required).toBe(false);
          }
        });

        it("outer nullable wins over inner nonNullable: nullable=true", () => {
          // Hits false branch of `if (nullable === undefined)` in non_nullable case
          const result = getWrappedSchema(v.nullable(v.nonNullable(v.nullable(v.string()))));
          if (result.wasWrapped) {
            expect(result.nullable).toBe(true);
          }
        });

        it("outer optional with inner nullish: required already set when nullish is processed", () => {
          // Hits false branch of `if (required === undefined)` in nullish case
          const result = getWrappedSchema(v.optional(v.nullish(v.string())));
          if (result.wasWrapped) {
            expect(result.required).toBe(false);
            expect(result.nullable).toBe(true);
          }
        });
      });
    });
  });
});
