import { describe, it, expect, assertType, expectTypeOf } from "vitest";
import * as v from "valibot";

import {
  inferInputConstraints,
  type InferInputConstraintsResult,
} from "./infer-input-constraints.js";

// ---------------------------------------------------------------------------
// Group 1: required flag from schema wrapping
// ---------------------------------------------------------------------------
describe("required flag from schema wrapping", () => {
  it("plain string() → required: true", () => {
    const result = inferInputConstraints(v.string());
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });

  it("optional(string()) → required: false", () => {
    const result = inferInputConstraints(v.optional(v.string()));
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
  });

  it("nullable(string()) → required: true (nullable ≠ optional)", () => {
    const result = inferInputConstraints(v.nullable(v.string()));
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(true);
  });

  it("nullish(string()) → required: false", () => {
    const result = inferInputConstraints(v.nullish(v.string()));
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
  });

  it("nonOptional(optional(string())) → required: true", () => {
    const result = inferInputConstraints(v.nonOptional(v.optional(v.string())));
    expect(result.required).toBe(true);
    expect(result.nullable).toBe(false);
  });

  it("undefinedable(string()) → required: false", () => {
    const result = inferInputConstraints(v.undefinedable(v.string()));
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
  });

  it("exactOptional(string()) → required: false", () => {
    const result = inferInputConstraints(v.exactOptional(v.string()));
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
  });

  it("optional wrapping non-string → required: false", () => {
    const result = inferInputConstraints(v.optional(v.number()));
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
    const resultBoolean = inferInputConstraints(v.optional(v.boolean()));
    expect(resultBoolean.required).toBe(false);
    expect(resultBoolean.nullable).toBe(false);
    const resultDate = inferInputConstraints(v.optional(v.date()));
    expect(resultDate.required).toBe(false);
    expect(resultDate.nullable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Group 2: String constraints
// ---------------------------------------------------------------------------
describe("string constraints", () => {
  it("minLength(3) → minLength: 3", () => {
    const result = inferInputConstraints(v.pipe(v.string(), v.minLength(3)));
    expect(result.minLength).toBe(3);
    expect(result.maxLength).toBeUndefined();
  });

  it("maxLength(100) → maxLength: 100", () => {
    const result = inferInputConstraints(v.pipe(v.string(), v.maxLength(100)));
    expect(result.maxLength).toBe(100);
    expect(result.minLength).toBeUndefined();
  });

  it("minLength(3) + maxLength(50) → both", () => {
    const result = inferInputConstraints(
      v.pipe(v.string(), v.minLength(3), v.maxLength(50)),
    );
    expect(result.minLength).toBe(3);
    expect(result.maxLength).toBe(50);
  });

  it("length(5) → both minLength: 5 and maxLength: 5", () => {
    const result = inferInputConstraints(v.pipe(v.string(), v.length(5)));
    expect(result.minLength).toBe(5);
    expect(result.maxLength).toBe(5);
  });

  it("length(5) then minLength(2) → minLength: 5, maxLength: 5 (exact length wins)", () => {
    const result = inferInputConstraints(
      v.pipe(v.string(), v.length(5), v.minLength(2)),
    );
    expect(result.minLength).toBe(5);
    expect(result.maxLength).toBe(5);
  });

  it("length(5) then maxLength(3) → minLength: 5, maxLength: 5 (exact length wins)", () => {
    const result = inferInputConstraints(
      v.pipe(v.string(), v.maxLength(3), v.length(5)),
    );
    expect(result.minLength).toBe(5);
    expect(result.maxLength).toBe(5);
  });

  it("nonEmpty() → minLength: 1", () => {
    const result = inferInputConstraints(v.pipe(v.string(), v.nonEmpty()));
    expect(result.minLength).toBe(1);
  });

  it("nonEmpty() + minLength(3) → minLength: 3 (explicit wins)", () => {
    const result = inferInputConstraints(
      v.pipe(v.string(), v.nonEmpty(), v.minLength(3)),
    );
    expect(result.minLength).toBe(3);
  });

  it("minLength(3) + nonEmpty() → minLength: 3 (non_empty is fallback only)", () => {
    const result = inferInputConstraints(
      v.pipe(v.string(), v.minLength(3), v.nonEmpty()),
    );
    expect(result.minLength).toBe(3);
  });

  it("regex → pattern from .source", () => {
    const result = inferInputConstraints(
      v.pipe(v.string(), v.regex(/^[a-z]+$/)),
    );
    expect(result.pattern).toBe("^[a-z]+$");
  });

  it("last regex wins with multiple regex actions", () => {
    const result = inferInputConstraints(
      v.pipe(v.string(), v.regex(/^abc/), v.regex(/xyz$/)),
    );
    expect(result.pattern).toBe("xyz$");
  });

  it("email + minLength/maxLength → minLength and maxLength (no pattern)", () => {
    const result = inferInputConstraints(
      v.pipe(v.string(), v.email(), v.minLength(5), v.maxLength(255)),
    );
    expect(result.minLength).toBe(5);
    expect(result.maxLength).toBe(255);
    expect(result.pattern).toBeUndefined();
  });

  it("plain string() → no string constraints", () => {
    const result = inferInputConstraints(v.string());
    expect(result.minLength).toBeUndefined();
    expect(result.maxLength).toBeUndefined();
    expect(result.pattern).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Group 3: Number constraints
// ---------------------------------------------------------------------------
describe("number constraints", () => {
  it("minValue(0) → min: 0", () => {
    const result = inferInputConstraints(v.pipe(v.number(), v.minValue(0)));
    expect(result.min).toBe(0);
    expect(result.max).toBeUndefined();
  });

  it("maxValue(100) → max: 100", () => {
    const result = inferInputConstraints(v.pipe(v.number(), v.maxValue(100)));
    expect(result.max).toBe(100);
    expect(result.min).toBeUndefined();
  });

  it("minValue(0) + maxValue(100) → min: 0, max: 100", () => {
    const result = inferInputConstraints(
      v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
    );
    expect(result.min).toBe(0);
    expect(result.max).toBe(100);
  });

  it("value(42) → both min: 42 and max: 42", () => {
    const result = inferInputConstraints(v.pipe(v.number(), v.value(42)));
    expect(result.min).toBe(42);
    expect(result.max).toBe(42);
  });

  it("value(5) then minValue(1) → min: 5, max: 5 (exact value wins)", () => {
    const result = inferInputConstraints(
      v.pipe(v.number(), v.value(5), v.minValue(1)),
    );
    expect(result.min).toBe(5);
    expect(result.max).toBe(5);
  });

  it("multipleOf(5) → step: 5", () => {
    const result = inferInputConstraints(v.pipe(v.number(), v.multipleOf(5)));
    expect(result.step).toBe(5);
  });

  it("multipleOf(0.01) → step: 0.01", () => {
    const result = inferInputConstraints(
      v.pipe(v.number(), v.multipleOf(0.01)),
    );
    expect(result.step).toBe(0.01);
  });

  it("integer() → step: 1", () => {
    const result = inferInputConstraints(v.pipe(v.number(), v.integer()));
    expect(result.step).toBe(1);
  });

  it("multipleOf(3) wins over integer() (multipleOf after integer)", () => {
    const result = inferInputConstraints(
      v.pipe(v.number(), v.integer(), v.multipleOf(3)),
    );
    expect(result.step).toBe(3);
  });

  it("multipleOf(7) wins over integer() (integer after multipleOf)", () => {
    const result = inferInputConstraints(
      v.pipe(v.number(), v.multipleOf(7), v.integer()),
    );
    expect(result.step).toBe(7);
  });

  it("bigint schema with minValue(0n) → min: 0n", () => {
    const result = inferInputConstraints(v.pipe(v.bigint(), v.minValue(0n)));
    expect(result.min).toBe(0n);
  });

  it("bigint schema with maxValue(100n) → max: 100n", () => {
    const result = inferInputConstraints(v.pipe(v.bigint(), v.maxValue(100n)));
    expect(result.max).toBe(100n);
  });

  it("bigint schema with multipleOf(3n) → step: 3n", () => {
    const result = inferInputConstraints(v.pipe(v.bigint(), v.multipleOf(3n)));
    expect(result.step).toBe(3n);
  });

  it("plain number() → no numeric constraints", () => {
    const result = inferInputConstraints(v.number());
    expect(result.min).toBeUndefined();
    expect(result.max).toBeUndefined();
    expect(result.step).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Group 4: Date constraints
// ---------------------------------------------------------------------------
describe("date constraints", () => {
  it("minValue(Date) → min as ISO date string 'YYYY-MM-DD'", () => {
    const d = new Date("2024-01-15");
    const result = inferInputConstraints(v.pipe(v.date(), v.minValue(d)));
    expect(result.min).toBe("2024-01-15");
  });

  it("maxValue(Date) → max as ISO date string", () => {
    const d = new Date("2024-12-31");
    const result = inferInputConstraints(v.pipe(v.date(), v.maxValue(d)));
    expect(result.max).toBe("2024-12-31");
  });

  it("minValue + maxValue → both as ISO date strings", () => {
    const result = inferInputConstraints(
      v.pipe(
        v.date(),
        v.minValue(new Date("2024-01-01")),
        v.maxValue(new Date("2024-12-31")),
      ),
    );
    expect(result.min).toBe("2024-01-01");
    expect(result.max).toBe("2024-12-31");
  });

  it("value(Date) → both min and max as same ISO date string", () => {
    const d = new Date("2024-06-15");
    const result = inferInputConstraints(v.pipe(v.date(), v.value(d)));
    expect(result.min).toBe("2024-06-15");
    expect(result.max).toBe("2024-06-15");
  });

  it("plain date() → no date constraints", () => {
    const result = inferInputConstraints(v.date());
    expect(result.min).toBeUndefined();
    expect(result.max).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Group 5: File/Blob constraints
// ---------------------------------------------------------------------------
describe("file/blob constraints", () => {
  it("file() with mimeType(['image/jpeg', 'image/png']) → accept: 'image/jpeg, image/png'", () => {
    const result = inferInputConstraints(
      v.pipe(v.file(), v.mimeType(["image/jpeg", "image/png"])),
    );
    expect(result.accept).toBe("image/jpeg, image/png");
  });

  it("file() with single mimeType → accept as single string", () => {
    const result = inferInputConstraints(
      v.pipe(v.file(), v.mimeType(["application/pdf"])),
    );
    expect(result.accept).toBe("application/pdf");
  });

  it("blob() with mimeType → accept", () => {
    const result = inferInputConstraints(
      v.pipe(v.blob(), v.mimeType(["application/pdf", "text/plain"])),
    );
    expect(result.accept).toBe("application/pdf, text/plain");
  });

  it("last mimeType wins with multiple mimeType actions", () => {
    const result = inferInputConstraints(
      v.pipe(
        v.file(),
        v.mimeType(["image/jpeg"]),
        v.mimeType(["image/png", "image/webp"]),
      ),
    );
    expect(result.accept).toBe("image/png, image/webp");
  });

  it("plain file() → no accept", () => {
    const result = inferInputConstraints(v.file());
    expect(result.accept).toBeUndefined();
  });

  it("plain blob() → no accept", () => {
    const result = inferInputConstraints(v.blob());
    expect(result.accept).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Group 6: Wrapped schemas with constraints
// ---------------------------------------------------------------------------
describe("wrapped schemas with constraints", () => {
  it("optional(pipe(string, minLength(1))) → { required: false, minLength: 1 }", () => {
    const result = inferInputConstraints(
      v.optional(v.pipe(v.string(), v.minLength(1))),
    );
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(false);
    expect(result.minLength).toBe(1);
  });

  it("nullable(pipe(number, minValue(0))) → { required: true, min: 0 }", () => {
    const result = inferInputConstraints(
      v.nullable(v.pipe(v.number(), v.minValue(0))),
    );
    expect(result.required).toBe(true);
    expect(result.min).toBe(0);
  });

  it("nullish(pipe(string, maxLength(50))) → { required: false, maxLength: 50 }", () => {
    const result = inferInputConstraints(
      v.nullish(v.pipe(v.string(), v.maxLength(50))),
    );
    expect(result.required).toBe(false);
    expect(result.nullable).toBe(true);
    expect(result.maxLength).toBe(50);
  });

  it("optional(pipe(file, mimeType(...))) → required: false + accept", () => {
    const result = inferInputConstraints(
      v.optional(v.pipe(v.file(), v.mimeType(["image/jpeg"]))),
    );
    expect(result.required).toBe(false);
    expect(result.accept).toBe("image/jpeg");
  });

  it("nonOptional(optional(pipe(string, minLength(5)))) → required: true, minLength: 5", () => {
    const result = inferInputConstraints(
      v.nonOptional(v.optional(v.pipe(v.string(), v.minLength(5)))),
    );
    expect(result.required).toBe(true);
    expect(result.minLength).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Group 7: Schemas without pipe — no constraints, only requirement
// ---------------------------------------------------------------------------
describe("schemas without pipe", () => {
  it("string() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.string());
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("number() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.number());
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("bigint() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.bigint());
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("date() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.date());
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("file() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.file());
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("blob() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.blob());
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("boolean() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.boolean());
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });
});

// ---------------------------------------------------------------------------
// Group 8: Non-scalar schemas → no constraints, only requirement
// ---------------------------------------------------------------------------
describe("non-scalar schemas return no constraints", () => {
  it("object() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.object({ name: v.string() }));
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("array() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.array(v.string()));
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("union() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.union([v.string(), v.number()]));
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("picklist() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.picklist(["a", "b"]));
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("literal() → { required: true, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.literal("hello"));
    expect(result).toEqual({
      required: true,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("optional(object()) → { required: false, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(
      v.optional(v.object({ x: v.string() })),
    );
    expect(result).toEqual({
      required: false,
      nullable: false,
      defaultValue: undefined,
    });
  });

  it("optional(picklist()) → { required: false, nullable: false, defaultValue: undefined }", () => {
    const result = inferInputConstraints(v.optional(v.picklist(["a", "b"])));
    expect(result).toEqual({
      required: false,
      nullable: false,
      defaultValue: undefined,
    });
  });
});

// ---------------------------------------------------------------------------
// Group 9: customConstraints option
// ---------------------------------------------------------------------------
describe("customConstraints option", () => {
  it("merges custom constraints on top of inferred", () => {
    const result = inferInputConstraints(v.pipe(v.string(), v.minLength(3)), {
      customConstraints: () => ({ maxLength: 50 }),
    });
    expect(result.minLength).toBe(3);
    expect(result.maxLength).toBe(50);
  });

  it("custom constraints override inferred values", () => {
    const result = inferInputConstraints(v.pipe(v.string(), v.minLength(3)), {
      customConstraints: () => ({ minLength: 1 }),
    });
    expect(result.minLength).toBe(1);
  });

  it("customConstraints returning undefined → no override", () => {
    const result = inferInputConstraints(v.pipe(v.string(), v.minLength(3)), {
      customConstraints: () => undefined,
    });
    expect(result.minLength).toBe(3);
  });

  it("receives the unwrapped schema (not the optional wrapper)", () => {
    let received: unknown = null;
    const schema = v.optional(v.pipe(v.string(), v.minLength(1)));
    inferInputConstraints(schema, {
      customConstraints: (s) => {
        received = s;
        return undefined;
      },
    });
    // Should receive the pipe(string, minLength(1)) schema, not the optional wrapper
    expect(received).toBe(schema.wrapped);
  });

  it("can set multiple: true via customConstraints", () => {
    const result = inferInputConstraints(
      v.pipe(v.file(), v.mimeType(["image/jpeg"])),
      { customConstraints: () => ({ multiple: true }) },
    );
    expect(result.multiple).toBe(true);
    expect(result.accept).toBe("image/jpeg");
  });

  it("customConstraints can override required", () => {
    const result = inferInputConstraints(v.string(), {
      customConstraints: () => ({ required: false }),
    });
    expect(result.required).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Group 10: Priority and override behavior
// ---------------------------------------------------------------------------
describe("priority and override behavior", () => {
  it("multipleOf wins over integer (multipleOf after integer)", () => {
    const result = inferInputConstraints(
      v.pipe(v.number(), v.integer(), v.multipleOf(5)),
    );
    expect(result.step).toBe(5);
  });

  it("multipleOf wins over integer (integer after multipleOf)", () => {
    const result = inferInputConstraints(
      v.pipe(v.number(), v.multipleOf(5), v.integer()),
    );
    expect(result.step).toBe(5);
  });

  it("last minLength wins with multiple min_length actions", () => {
    const result = inferInputConstraints(
      v.pipe(v.string(), v.minLength(2), v.minLength(5)),
    );
    expect(result.minLength).toBe(5);
  });

  it("last maxValue wins with multiple max_value actions", () => {
    const result = inferInputConstraints(
      v.pipe(v.number(), v.maxValue(100), v.maxValue(50)),
    );
    expect(result.max).toBe(50);
  });

  it("customConstraints overrides all inferred values", () => {
    const result = inferInputConstraints(
      v.pipe(v.string(), v.minLength(3), v.maxLength(50), v.regex(/abc/)),
      {
        customConstraints: () => ({
          minLength: 0,
          pattern: undefined,
        }),
      },
    );
    expect(result.minLength).toBe(0);
    expect(result.pattern).toBeUndefined();
    expect(result.maxLength).toBe(50); // not overridden
  });
});

// ---------------------------------------------------------------------------
// Group 11: Real-world usage
// ---------------------------------------------------------------------------
describe("real-world usage", () => {
  it("login form schema — infer constraints for all fields", () => {
    const LoginSchema = v.object({
      email: v.pipe(v.string(), v.email(), v.maxLength(255)),
      password: v.pipe(v.string(), v.minLength(8), v.maxLength(128)),
      rememberMe: v.optional(v.boolean()),
    });

    const emailConstraints = inferInputConstraints(LoginSchema.entries.email);
    expect(emailConstraints).toMatchObject({ required: true, maxLength: 255 });
    expect(emailConstraints.minLength).toBeUndefined();

    const passwordConstraints = inferInputConstraints(
      LoginSchema.entries.password,
    );
    expect(passwordConstraints).toMatchObject({
      required: true,
      minLength: 8,
      maxLength: 128,
    });

    const rememberMeConstraints = inferInputConstraints(
      LoginSchema.entries.rememberMe,
    );
    expect(rememberMeConstraints.required).toBe(false);
  });

  it("registration form with file upload", () => {
    const RegistrationSchema = v.object({
      username: v.pipe(v.string(), v.minLength(3), v.maxLength(20)),
      birthDate: v.pipe(
        v.date(),
        v.minValue(new Date("1900-01-01")),
        v.maxValue(new Date("2006-01-01")),
      ),
      age: v.pipe(v.number(), v.minValue(0), v.maxValue(120), v.integer()),
      avatar: v.optional(
        v.pipe(v.file(), v.mimeType(["image/jpeg", "image/png", "image/webp"])),
      ),
    });

    expect(
      inferInputConstraints(RegistrationSchema.entries.username),
    ).toMatchObject({ required: true, minLength: 3, maxLength: 20 });

    expect(
      inferInputConstraints(RegistrationSchema.entries.birthDate),
    ).toMatchObject({
      required: true,
      min: "1900-01-01",
      max: "2006-01-01",
    });

    expect(inferInputConstraints(RegistrationSchema.entries.age)).toMatchObject(
      { required: true, min: 0, max: 120, step: 1 },
    );

    const avatarConstraints = inferInputConstraints(
      RegistrationSchema.entries.avatar,
    );
    expect(avatarConstraints.required).toBe(false);
    expect(avatarConstraints.accept).toBe("image/jpeg, image/png, image/webp");
  });

  it("search form with optional regex-validated field", () => {
    const SearchSchema = v.object({
      query: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
      zipCode: v.optional(v.pipe(v.string(), v.regex(/^\d{5}$/))),
      maxPrice: v.optional(
        v.pipe(v.number(), v.minValue(0), v.multipleOf(0.01)),
      ),
    });

    expect(inferInputConstraints(SearchSchema.entries.query)).toMatchObject({
      required: true,
      minLength: 1,
      maxLength: 200,
    });

    const zipConstraints = inferInputConstraints(SearchSchema.entries.zipCode);
    expect(zipConstraints.required).toBe(false);
    expect(zipConstraints.pattern).toBe("^\\d{5}$");

    const maxPriceConstraints = inferInputConstraints(
      SearchSchema.entries.maxPrice,
    );
    expect(maxPriceConstraints.required).toBe(false);
    expect(maxPriceConstraints.min).toBe(0);
    expect(maxPriceConstraints.step).toBe(0.01);
  });
});

// ---------------------------------------------------------------------------
// Group 12: Type-level assertions
// ---------------------------------------------------------------------------
describe("type-level inference", () => {
  it("plain string() → required is literal true", () => {
    const result = inferInputConstraints(v.string());
    expectTypeOf(result.required).toEqualTypeOf<true>();
    expectTypeOf(result.nullable).toEqualTypeOf<false>();
  });

  it("optional(string()) → required is literal false", () => {
    const result = inferInputConstraints(v.optional(v.string()));
    expectTypeOf(result.required).toEqualTypeOf<false>();
    expectTypeOf(result.nullable).toEqualTypeOf<false>();
  });

  it("nullable(string()) → required is literal true", () => {
    const result = inferInputConstraints(v.nullable(v.string()));
    expectTypeOf(result.required).toEqualTypeOf<true>();
    expectTypeOf(result.nullable).toEqualTypeOf<true>();
  });

  it("nullish(string()) → required is literal false", () => {
    const result = inferInputConstraints(v.nullish(v.string()));
    expectTypeOf(result.required).toEqualTypeOf<false>();
    expectTypeOf(result.nullable).toEqualTypeOf<true>();
  });

  it("nonOptional(optional(string())) → required is literal true", () => {
    const result = inferInputConstraints(v.nonOptional(v.optional(v.string())));
    expectTypeOf(result.required).toEqualTypeOf<true>();
    expectTypeOf(result.nullable).toEqualTypeOf<false>();
  });

  it("InferInputConstraintsResult utility type — required narrows correctly", () => {
    const _optStr = v.optional(v.string());
    assertType<InferInputConstraintsResult<typeof _optStr>>({
      required: false as const,
      nullable: false as const,
      defaultValue: undefined,
    });

    const _str = v.string();
    assertType<InferInputConstraintsResult<typeof _str>>({
      required: true as const,
      nullable: false as const,
      defaultValue: undefined,
    });

    const _nullableStr = v.nullable(v.string());
    assertType<InferInputConstraintsResult<typeof _nullableStr>>({
      required: true as const,
      nullable: true as const,
      defaultValue: undefined,
    });
  });

  it("InferInputConstraintsResult utility type — optional fields accepted", () => {
    const _str = v.pipe(v.string(), v.minLength(3));
    assertType<InferInputConstraintsResult<typeof _str>>({
      required: true as const,
      nullable: false as const,
      defaultValue: undefined,
      minLength: 3,
      maxLength: 50,
    });
  });
});
