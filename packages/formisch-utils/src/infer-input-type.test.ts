import { describe, it, expect, assertType, expectTypeOf } from "vitest";
import * as v from "valibot";

import {
  inferInputType,
  type InferInputTypeResult,
} from "./infer-input-type.js";

// ---------------------------------------------------------------------------
// Group 1: String base type — no pipe or non-format pipe → 'text'
// ---------------------------------------------------------------------------
describe("string schema without format validator", () => {
  it("plain string schema → 'text'", () => {
    expect(inferInputType(v.string())).toBe("text");
  });

  it("string with length constraint → 'text'", () => {
    expect(inferInputType(v.pipe(v.string(), v.minLength(1)))).toBe("text");
  });

  it("string with max length constraint → 'text'", () => {
    expect(inferInputType(v.pipe(v.string(), v.maxLength(255)))).toBe("text");
  });

  it("string with transformation only → 'text'", () => {
    expect(inferInputType(v.pipe(v.string(), v.trim()))).toBe("text");
  });

  it("string with multiple non-format actions → 'text'", () => {
    expect(
      inferInputType(
        v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
      ),
    ).toBe("text");
  });
});

// ---------------------------------------------------------------------------
// Group 2: String with format validators → specific input types
// ---------------------------------------------------------------------------
describe("string schema with format validators", () => {
  it("email validator → 'email'", () => {
    expect(inferInputType(v.pipe(v.string(), v.email()))).toBe("email");
  });

  it("url validator → 'url'", () => {
    expect(inferInputType(v.pipe(v.string(), v.url()))).toBe("url");
  });

  it("isoDate validator → 'date'", () => {
    expect(inferInputType(v.pipe(v.string(), v.isoDate()))).toBe("date");
  });

  it("isoDateTime validator → 'datetime-local'", () => {
    expect(inferInputType(v.pipe(v.string(), v.isoDateTime()))).toBe(
      "datetime-local",
    );
  });

  it("isoTimestamp validator → 'datetime-local'", () => {
    expect(inferInputType(v.pipe(v.string(), v.isoTimestamp()))).toBe(
      "datetime-local",
    );
  });

  it("isoTime validator → 'time'", () => {
    expect(inferInputType(v.pipe(v.string(), v.isoTime()))).toBe("time");
  });

  it("isoWeek validator → 'week'", () => {
    expect(inferInputType(v.pipe(v.string(), v.isoWeek()))).toBe("week");
  });

  it("hexColor validator → 'color'", () => {
    expect(inferInputType(v.pipe(v.string(), v.hexColor()))).toBe("color");
  });

  it("email with additional constraints → 'email'", () => {
    expect(
      inferInputType(
        v.pipe(v.string(), v.email(), v.minLength(5), v.maxLength(100)),
      ),
    ).toBe("email");
  });
});

// ---------------------------------------------------------------------------
// Group 3: Priority conflicts — highest-priority format validator wins
// ---------------------------------------------------------------------------
describe("pipe format validator priority", () => {
  it("email wins over url regardless of pipe order (email first)", () => {
    expect(inferInputType(v.pipe(v.string(), v.email(), v.url()))).toBe(
      "email",
    );
  });

  it("email wins over url regardless of pipe order (url first)", () => {
    expect(inferInputType(v.pipe(v.string(), v.url(), v.email()))).toBe(
      "email",
    );
  });

  it("datetime-local wins over date (iso_date_time + iso_date)", () => {
    expect(
      inferInputType(v.pipe(v.string(), v.isoDateTime(), v.isoDate())),
    ).toBe("datetime-local");
  });

  it("datetime-local wins over date (iso_timestamp + iso_date)", () => {
    expect(
      inferInputType(v.pipe(v.string(), v.isoTimestamp(), v.isoDate())),
    ).toBe("datetime-local");
  });
});

// ---------------------------------------------------------------------------
// Group 4: Non-string primitive schemas
// ---------------------------------------------------------------------------
describe("primitive schemas", () => {
  it("number → 'number'", () => {
    expect(inferInputType(v.number())).toBe("number");
  });

  it("bigint → 'number'", () => {
    expect(inferInputType(v.bigint())).toBe("number");
  });

  it("number with pipe → 'number'", () => {
    expect(
      inferInputType(v.pipe(v.number(), v.minValue(0), v.maxValue(100))),
    ).toBe("number");
  });

  it("boolean → 'checkbox'", () => {
    expect(inferInputType(v.boolean())).toBe("checkbox");
  });

  it("date → 'date'", () => {
    expect(inferInputType(v.date())).toBe("date");
  });

  it("file → 'file'", () => {
    expect(inferInputType(v.file())).toBe("file");
  });

  it("blob → 'file'", () => {
    expect(inferInputType(v.blob())).toBe("file");
  });
});

// ---------------------------------------------------------------------------
// Group 5: Wrapped schemas — wrapper is stripped, base type determines result
// ---------------------------------------------------------------------------
describe("wrapped schemas", () => {
  it("optional string → 'text'", () => {
    expect(inferInputType(v.optional(v.string()))).toBe("text");
  });

  it("optional email string → 'email'", () => {
    expect(inferInputType(v.optional(v.pipe(v.string(), v.email())))).toBe(
      "email",
    );
  });

  it("nullable number → 'number'", () => {
    expect(inferInputType(v.nullable(v.number()))).toBe("number");
  });

  it("nullish boolean → 'checkbox'", () => {
    expect(inferInputType(v.nullish(v.boolean()))).toBe("checkbox");
  });

  it("nonOptional wrapping optional email string → 'email'", () => {
    expect(
      inferInputType(v.nonOptional(v.optional(v.pipe(v.string(), v.email())))),
    ).toBe("email");
  });

  it("optional url string → 'url'", () => {
    expect(inferInputType(v.optional(v.pipe(v.string(), v.url())))).toBe("url");
  });

  it("optional date schema → 'date'", () => {
    expect(inferInputType(v.optional(v.date()))).toBe("date");
  });
});

// ---------------------------------------------------------------------------
// Group 6: Complex / structural schemas → undefined (not scalar inputs)
// ---------------------------------------------------------------------------
describe("structural schemas return undefined", () => {
  it("object schema → undefined", () => {
    expect(inferInputType(v.object({ name: v.string() }))).toBeUndefined();
  });

  it("array schema → undefined", () => {
    expect(inferInputType(v.array(v.string()))).toBeUndefined();
  });

  it("union schema → undefined", () => {
    expect(inferInputType(v.union([v.string(), v.number()]))).toBeUndefined();
  });

  it("variant schema → undefined", () => {
    expect(
      inferInputType(
        v.variant("type", [
          v.object({ type: v.literal("a"), value: v.string() }),
          v.object({ type: v.literal("b"), value: v.number() }),
        ]),
      ),
    ).toBeUndefined();
  });

  it("picklist schema → undefined (use <select>)", () => {
    expect(inferInputType(v.picklist(["a", "b", "c"]))).toBeUndefined();
  });

  it("enum schema → undefined (use <select>)", () => {
    enum Color {
      Red = "red",
      Green = "green",
    }
    expect(inferInputType(v.enum(Color))).toBeUndefined();
  });

  it("literal schema → undefined", () => {
    expect(inferInputType(v.literal("hello"))).toBeUndefined();
  });

  it("record schema → undefined", () => {
    expect(inferInputType(v.record(v.string(), v.number()))).toBeUndefined();
  });

  it("tuple schema → undefined", () => {
    expect(inferInputType(v.tuple([v.string(), v.number()]))).toBeUndefined();
  });

  it("intersect schema → undefined", () => {
    expect(
      inferInputType(
        v.intersect([v.object({ a: v.string() }), v.object({ b: v.number() })]),
      ),
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Group 7: Other non-input primitive schemas → undefined
// ---------------------------------------------------------------------------
describe("non-input primitive schemas return undefined", () => {
  it("null → undefined", () => {
    expect(inferInputType(v.null())).toBeUndefined();
  });

  it("undefined → undefined", () => {
    expect(inferInputType(v.undefined())).toBeUndefined();
  });

  it("any → undefined", () => {
    expect(inferInputType(v.any())).toBeUndefined();
  });

  it("unknown → undefined", () => {
    expect(inferInputType(v.unknown())).toBeUndefined();
  });

  it("never → undefined", () => {
    expect(inferInputType(v.never())).toBeUndefined();
  });

  it("symbol → undefined", () => {
    expect(inferInputType(v.symbol())).toBeUndefined();
  });

  it("nan → undefined", () => {
    expect(inferInputType(v.nan())).toBeUndefined();
  });

  it("void → undefined", () => {
    expect(inferInputType(v.void())).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Group 8: customInferrer option
// ---------------------------------------------------------------------------
describe("customInferrer option", () => {
  it("custom inferrer is called for unknown schema types", () => {
    const schema = v.any();
    const result = inferInputType(schema, {
      customInferrer: (s) => {
        if (s.type === "any") return "text";
        return undefined;
      },
    });
    expect(result).toBe("text");
  });

  it("custom inferrer returning undefined propagates as undefined", () => {
    const result = inferInputType(v.any(), {
      customInferrer: () => undefined,
    });
    expect(result).toBeUndefined();
  });

  it("custom inferrer is not called for natively handled types", () => {
    const called = { value: false };
    const result = inferInputType(v.pipe(v.string(), v.email()), {
      customInferrer: () => {
        called.value = true;
        return "text";
      },
    });
    expect(result).toBe("email");
    expect(called.value).toBe(false);
  });

  it("custom inferrer can override default undefined for picklist", () => {
    // Example: if the app wants to treat picklist as a 'text' input with datalist
    const result = inferInputType(v.picklist(["a", "b"]), {
      customInferrer: (s) => {
        if (s.type === "picklist") return "text";
        return undefined;
      },
    });
    expect(result).toBe("text");
  });

  it("custom inferrer receives unwrapped schema", () => {
    let receivedSchema: any = null;
    const schema = v.optional(v.literal("custom"));
    const result = inferInputType(schema, {
      customInferrer: (s) => {
        receivedSchema = s;
        return "text";
      },
    });
    expect(result).toBe("text");
    expect(receivedSchema).toEqual(schema.wrapped);
  });
});

// ---------------------------------------------------------------------------
// Group 9: Real-world usage — iterate object schema entries
// ---------------------------------------------------------------------------
describe("real-world usage", () => {
  it("login form schema — infer types for all fields", () => {
    const LoginSchema = v.object({
      email: v.pipe(v.string(), v.email()),
      password: v.pipe(v.string(), v.minLength(8)),
      rememberMe: v.optional(v.boolean()),
    });

    const inferred: Record<string, string | undefined> = {};
    for (const [key, fieldSchema] of Object.entries(LoginSchema.entries)) {
      inferred[key] = inferInputType(fieldSchema);
    }

    expect(inferred).toEqual({
      email: "email",
      password: "text",
      rememberMe: "checkbox",
    });
  });

  it("registration form schema — mixed field types", () => {
    const RegistrationSchema = v.object({
      username: v.pipe(v.string(), v.minLength(3), v.maxLength(20)),
      email: v.pipe(v.string(), v.email()),
      website: v.optional(v.pipe(v.string(), v.url())),
      age: v.number(),
      birthDate: v.pipe(v.string(), v.isoDate()),
      newsletter: v.boolean(),
      avatar: v.optional(v.file()),
      role: v.picklist(["admin", "user", "guest"]),
    });

    const inferred: Record<string, string | undefined> = {};
    for (const [key, fieldSchema] of Object.entries(
      RegistrationSchema.entries,
    )) {
      inferred[key] = inferInputType(fieldSchema);
    }

    expect(inferred).toEqual({
      username: "text",
      email: "email",
      website: "url",
      age: "number",
      birthDate: "date",
      newsletter: "checkbox",
      avatar: "file",
      role: undefined, // picklist → use <select>
    });
  });

  it("event form schema — datetime and time fields", () => {
    const EventSchema = v.object({
      title: v.string(),
      startAt: v.pipe(v.string(), v.isoDateTime()),
      endAt: v.pipe(v.string(), v.isoTimestamp()),
      startTime: v.pipe(v.string(), v.isoTime()),
      color: v.pipe(v.string(), v.hexColor()),
      week: v.pipe(v.string(), v.isoWeek()),
    });

    const inferred: Record<string, string | undefined> = {};
    for (const [key, fieldSchema] of Object.entries(EventSchema.entries)) {
      inferred[key] = inferInputType(fieldSchema);
    }

    expect(inferred).toEqual({
      title: "text",
      startAt: "datetime-local",
      endAt: "datetime-local",
      startTime: "time",
      color: "color",
      week: "week",
    });
  });
});

// ---------------------------------------------------------------------------
// Group 10: Type-level assertions — InferInputTypeResult narrows correctly
// ---------------------------------------------------------------------------
describe("type-level inference", () => {
  it("plain string → 'text'", () => {
    const result = inferInputType(v.string());
    expectTypeOf(result).toEqualTypeOf<"text">();
  });

  it("pipe(string, email()) → 'email'", () => {
    const result = inferInputType(v.pipe(v.string(), v.email()));
    expectTypeOf(result).toEqualTypeOf<"email">();
  });

  it("pipe(string, url()) → 'url'", () => {
    const result = inferInputType(v.pipe(v.string(), v.url()));
    expectTypeOf(result).toEqualTypeOf<"url">();
  });

  it("pipe(string, isoDateTime()) → 'datetime-local'", () => {
    const result = inferInputType(v.pipe(v.string(), v.isoDateTime()));
    expectTypeOf(result).toEqualTypeOf<"datetime-local">();
  });

  it("pipe(string, isoDate()) → 'date'", () => {
    const result = inferInputType(v.pipe(v.string(), v.isoDate()));
    expectTypeOf(result).toEqualTypeOf<"date">();
  });

  it("pipe(string, isoTime()) → 'time'", () => {
    const result = inferInputType(v.pipe(v.string(), v.isoTime()));
    expectTypeOf(result).toEqualTypeOf<"time">();
  });

  it("pipe(string, isoWeek()) → 'week'", () => {
    const result = inferInputType(v.pipe(v.string(), v.isoWeek()));
    expectTypeOf(result).toEqualTypeOf<"week">();
  });

  it("pipe(string, hexColor()) → 'color'", () => {
    const result = inferInputType(v.pipe(v.string(), v.hexColor()));
    expectTypeOf(result).toEqualTypeOf<"color">();
  });

  it("number() → 'number'", () => {
    const result = inferInputType(v.number());
    expectTypeOf(result).toEqualTypeOf<"number">();
  });

  it("bigint() → 'number'", () => {
    const result = inferInputType(v.bigint());
    expectTypeOf(result).toEqualTypeOf<"number">();
  });

  it("boolean() → 'checkbox'", () => {
    const result = inferInputType(v.boolean());
    expectTypeOf(result).toEqualTypeOf<"checkbox">();
  });

  it("date() → 'date'", () => {
    const result = inferInputType(v.date());
    expectTypeOf(result).toEqualTypeOf<"date">();
  });

  it("file() → 'file'", () => {
    const result = inferInputType(v.file());
    expectTypeOf(result).toEqualTypeOf<"file">();
  });

  it("blob() → 'file'", () => {
    const result = inferInputType(v.blob());
    expectTypeOf(result).toEqualTypeOf<"file">();
  });

  it("optional(string) → 'text'", () => {
    const result = inferInputType(v.optional(v.string()));
    expectTypeOf(result).toEqualTypeOf<"text">();
  });

  it("optional(pipe(string, email())) → 'email'", () => {
    const result = inferInputType(v.optional(v.pipe(v.string(), v.email())));
    expectTypeOf(result).toEqualTypeOf<"email">();
  });

  it("nullable(number()) → 'number'", () => {
    const result = inferInputType(v.nullable(v.number()));
    expectTypeOf(result).toEqualTypeOf<"number">();
  });

  it("nullish(boolean()) → 'checkbox'", () => {
    const result = inferInputType(v.nullish(v.boolean()));
    expectTypeOf(result).toEqualTypeOf<"checkbox">();
  });

  it("picklist → undefined", () => {
    const result = inferInputType(v.picklist(["a", "b"]));
    expectTypeOf(result).toEqualTypeOf<undefined>();
  });

  it("object → undefined", () => {
    const result = inferInputType(v.object({ name: v.string() }));
    expectTypeOf(result).toEqualTypeOf<undefined>();
  });

  it("array → undefined", () => {
    const result = inferInputType(v.array(v.string()));
    expectTypeOf(result).toEqualTypeOf<undefined>();
  });

  it("InferInputTypeResult utility type resolves correctly", () => {
    const _emailSchema = v.pipe(v.string(), v.email());
    assertType<InferInputTypeResult<typeof _emailSchema>>("email" as const);

    const _numSchema = v.optional(v.number());
    assertType<InferInputTypeResult<typeof _numSchema>>("number" as const);

    const _pickSchema = v.picklist(["a", "b"]);
    assertType<InferInputTypeResult<typeof _pickSchema>>(undefined);
  });

  // TCustomReturn propagation
  it("structural schema + customInferrer returning 'text' → 'text'", () => {
    const result = inferInputType(v.picklist(["a", "b"]), {
      customInferrer: () => "text" as const,
    });
    expectTypeOf(result).toEqualTypeOf<"text">();
  });

  it("native schema + customInferrer → base type wins (customInferrer never called)", () => {
    const result = inferInputType(v.number(), {
      customInferrer: () => "text" as const,
    });
    expectTypeOf(result).toEqualTypeOf<"number">();
  });

  it("structural schema + customInferrer returning undefined → undefined", () => {
    const result = inferInputType(v.picklist(["a", "b"]), {
      customInferrer: () => undefined,
    });
    expectTypeOf(result).toEqualTypeOf<undefined>();
  });

  it("structural schema + customInferrer returning 'text' | undefined → 'text' | undefined", () => {
    const result = inferInputType(v.picklist(["a", "b"]), {
      customInferrer: (s) =>
        s.type === "picklist" ? ("text" as const) : undefined,
    });
    expectTypeOf(result).toEqualTypeOf<"text" | undefined>();
  });

  it("InferInputTypeResult<picklist, 'text'> → 'text'", () => {
    const _pickSchema = v.picklist(["a", "b"]);
    assertType<InferInputTypeResult<typeof _pickSchema, "text">>(
      "text" as const,
    );
  });

  it("InferInputTypeResult<picklist, 'text' | undefined> → 'text' | undefined", () => {
    const _pickSchema = v.picklist(["a", "b"]);
    assertType<InferInputTypeResult<typeof _pickSchema, "text" | undefined>>(
      "text" as const,
    );
    assertType<InferInputTypeResult<typeof _pickSchema, "text" | undefined>>(
      undefined,
    );
  });
});
