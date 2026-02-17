import { describe, test, expect, expectTypeOf } from "vitest";
import * as v from "valibot";

import { inferLabel, inferDescription, inferPlaceholder } from "./infer-field-info.ts";

// ---- inferLabel ----

describe("inferLabel", () => {
  test("schema with v.title() returns the title string", () => {
    const schema = v.pipe(v.string(), v.title("Email Address"));
    expect(inferLabel(schema)).toBe("Email Address");
  });

  test("schema without title returns undefined", () => {
    const schema = v.pipe(v.string(), v.minLength(3));
    expect(inferLabel(schema)).toBeUndefined();
  });

  test("plain non-piped schema returns undefined", () => {
    expect(inferLabel(v.string())).toBeUndefined();
    expect(inferLabel(v.number())).toBeUndefined();
    expect(inferLabel(v.boolean())).toBeUndefined();
  });

  test("optional(pipe(..., v.title())) returns inner title", () => {
    const schema = v.optional(v.pipe(v.string(), v.title("First Name")));
    expect(inferLabel(schema)).toBe("First Name");
  });

  test("nullable(pipe(..., v.title())) returns inner title", () => {
    const schema = v.nullable(v.pipe(v.string(), v.title("Last Name")));
    expect(inferLabel(schema)).toBe("Last Name");
  });

  test("nullish(pipe(..., v.title())) returns inner title", () => {
    const schema = v.nullish(v.pipe(v.number(), v.title("Age")));
    expect(inferLabel(schema)).toBe("Age");
  });

  test("title alongside other pipe actions", () => {
    const schema = v.pipe(
      v.string(),
      v.title("Website URL"),
      v.url(),
      v.maxLength(255),
    );
    expect(inferLabel(schema)).toBe("Website URL");
  });

  test("number schema with title", () => {
    const schema = v.pipe(v.number(), v.title("Score"), v.minValue(0), v.maxValue(100));
    expect(inferLabel(schema)).toBe("Score");
  });

  test("return type is string | undefined", () => {
    const schema = v.pipe(v.string(), v.title("Name"));
    expectTypeOf(inferLabel(schema)).toEqualTypeOf<string | undefined>();
  });
});

// ---- inferDescription ----

describe("inferDescription", () => {
  test("schema with v.description() returns the description string", () => {
    const schema = v.pipe(v.string(), v.description("Your primary email address"));
    expect(inferDescription(schema)).toBe("Your primary email address");
  });

  test("schema without description returns undefined", () => {
    const schema = v.pipe(v.string(), v.minLength(3));
    expect(inferDescription(schema)).toBeUndefined();
  });

  test("plain non-piped schema returns undefined", () => {
    expect(inferDescription(v.string())).toBeUndefined();
    expect(inferDescription(v.number())).toBeUndefined();
  });

  test("optional(pipe(..., v.description())) returns inner description", () => {
    const schema = v.optional(
      v.pipe(v.string(), v.description("Enter your full name")),
    );
    expect(inferDescription(schema)).toBe("Enter your full name");
  });

  test("nullable(pipe(..., v.description())) returns inner description", () => {
    const schema = v.nullable(
      v.pipe(v.number(), v.description("Age in years")),
    );
    expect(inferDescription(schema)).toBe("Age in years");
  });

  test("nullish(pipe(..., v.description())) returns inner description", () => {
    const schema = v.nullish(
      v.pipe(v.string(), v.description("Optional bio")),
    );
    expect(inferDescription(schema)).toBe("Optional bio");
  });

  test("description alongside other pipe actions", () => {
    const schema = v.pipe(
      v.string(),
      v.email(),
      v.description("Must be a valid corporate email"),
      v.maxLength(255),
    );
    expect(inferDescription(schema)).toBe("Must be a valid corporate email");
  });

  test("return type is string | undefined", () => {
    const schema = v.pipe(v.string(), v.description("Help text"));
    expectTypeOf(inferDescription(schema)).toEqualTypeOf<string | undefined>();
  });
});

// ---- inferPlaceholder ----

describe("inferPlaceholder", () => {
  test("schema with v.metadata({ placeholder: '...' }) returns the placeholder string", () => {
    const schema = v.pipe(
      v.string(),
      v.metadata({ placeholder: "Enter your name" }),
    );
    expect(inferPlaceholder(schema)).toBe("Enter your name");
  });

  test("single string example returns it", () => {
    const schema = v.pipe(v.string(), v.examples(["user@example.com"]));
    expect(inferPlaceholder(schema)).toBe("user@example.com");
  });

  test("multiple examples returns the first one", () => {
    const schema = v.pipe(
      v.string(),
      v.examples(["first@example.com", "second@example.com", "third@example.com"]),
    );
    expect(inferPlaceholder(schema)).toBe("first@example.com");
  });

  test("number example is converted to string", () => {
    const schema = v.pipe(v.number(), v.examples([42, 100, 255]));
    expect(inferPlaceholder(schema)).toBe("42");
  });

  test("no examples returns undefined", () => {
    expect(inferPlaceholder(v.string())).toBeUndefined();
    expect(inferPlaceholder(v.pipe(v.string(), v.minLength(3)))).toBeUndefined();
  });

  test("optional(pipe(..., v.examples())) returns first example", () => {
    const schema = v.optional(
      v.pipe(v.string(), v.examples(["Jane Doe", "John Smith"])),
    );
    expect(inferPlaceholder(schema)).toBe("Jane Doe");
  });

  test("nullable(pipe(..., v.examples())) returns first example", () => {
    const schema = v.nullable(
      v.pipe(v.string(), v.examples(["placeholder text"])),
    );
    expect(inferPlaceholder(schema)).toBe("placeholder text");
  });

  test("nullish(pipe(..., v.examples())) returns first example", () => {
    const schema = v.nullish(
      v.pipe(v.number(), v.examples([0])),
    );
    expect(inferPlaceholder(schema)).toBe("0");
  });

  test("return type is string | undefined", () => {
    const schema = v.pipe(v.string(), v.examples(["example"]));
    expectTypeOf(inferPlaceholder(schema)).toEqualTypeOf<string | undefined>();
  });
});

// ---- Combined metadata ----

describe("combined metadata on the same schema", () => {
  test("all three functions work independently on a fully annotated schema", () => {
    const schema = v.pipe(
      v.string(),
      v.title("Email Address"),
      v.description("Your primary contact email"),
      v.examples(["user@example.com", "admin@example.com"]),
      v.email(),
      v.maxLength(255),
    );

    expect(inferLabel(schema)).toBe("Email Address");
    expect(inferDescription(schema)).toBe("Your primary contact email");
    expect(inferPlaceholder(schema)).toBe("user@example.com");
  });

  test("wrapped schema with all annotations", () => {
    const schema = v.optional(
      v.pipe(
        v.string(),
        v.title("Display Name"),
        v.description("How others see you"),
        v.examples(["Jane Doe"]),
        v.metadata({ placeholder: "Enter your display name" }),
        v.minLength(2),
        v.maxLength(50),
      ),
    );

    expect(inferLabel(schema)).toBe("Display Name");
    expect(inferDescription(schema)).toBe("How others see you");
    expect(inferPlaceholder(schema)).toBe("Enter your display name");
  });

  test("schema with title and description but no examples", () => {
    const schema = v.pipe(
      v.number(),
      v.title("Score"),
      v.description("Your current score"),
      v.minValue(0),
      v.maxValue(100),
    );

    expect(inferLabel(schema)).toBe("Score");
    expect(inferDescription(schema)).toBe("Your current score");
    expect(inferPlaceholder(schema)).toBeUndefined();
  });

  test("schema with examples but no title or description", () => {
    const schema = v.pipe(v.string(), v.examples(["Sample text"]));

    expect(inferLabel(schema)).toBeUndefined();
    expect(inferDescription(schema)).toBeUndefined();
    expect(inferPlaceholder(schema)).toBe("Sample text");
  });

  test("real-world login form field schemas", () => {
    const email = v.pipe(
      v.string(),
      v.title("Email"),
      v.description("The email address associated with your account"),
      v.examples(["you@example.com"]),
      v.email(),
    );
    const password = v.pipe(
      v.string(),
      v.title("Password"),
      v.description("At least 8 characters"),
      v.minLength(8),
    );
    const rememberMe = v.optional(
      v.pipe(v.boolean(), v.title("Remember me")),
    );

    expect(inferLabel(email)).toBe("Email");
    expect(inferDescription(email)).toBe("The email address associated with your account");
    expect(inferPlaceholder(email)).toBe("you@example.com");

    expect(inferLabel(password)).toBe("Password");
    expect(inferDescription(password)).toBe("At least 8 characters");
    expect(inferPlaceholder(password)).toBeUndefined();

    expect(inferLabel(rememberMe)).toBe("Remember me");
    expect(inferDescription(rememberMe)).toBeUndefined();
    expect(inferPlaceholder(rememberMe)).toBeUndefined();
  });
});
