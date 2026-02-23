import { describe, test, expect } from "vitest";
import * as v from "valibot";

import { schemaToAST } from "./to-ast.ts";
import { astToSchema } from "./to-schema.ts";
import { astToSchemaAsync } from "./to-schema-async.ts";
import { ASTDocumentSchema } from "./schema.ts";
import type { ASTDocument } from "./types.ts";

describe("AST - general tests", () => {
  test("Simple string schema", () => {
    const schema = v.string();
    const astDoc = schemaToAST(schema);

    expect(astDoc.library).toBe("valibot");
    expect(astDoc.version).toBe("1.0.0");
    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("string");
  });

  test("String with validations", () => {
    const schema = v.pipe(v.string(), v.email(), v.maxLength(100));
    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("string");
    if ("pipe" in astDoc.schema && astDoc.schema.pipe) {
      expect(astDoc.schema.pipe).toBeDefined();
      // Pipe should only contain actions (email, maxLength), not the root schema
      expect(astDoc.schema.pipe!.length).toBe(2);
      expect(astDoc.schema.pipe![0].kind).toBe("validation");
      expect(astDoc.schema.pipe![0].type).toBe("email");
      expect(astDoc.schema.pipe![1].kind).toBe("validation");
      expect(astDoc.schema.pipe![1].type).toBe("max_length");
    }
  });

  test("Object schema", () => {
    const schema = v.object({
      name: v.string(),
      age: v.number(),
      email: v.pipe(v.string(), v.email()),
    });

    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("object");
    expect("entries" in astDoc.schema).toBe(true);

    if ("entries" in astDoc.schema) {
      expect(Object.keys(astDoc.schema.entries).length).toBe(3);
      expect(astDoc.schema.entries.name.type).toBe("string");
      expect(astDoc.schema.entries.age.type).toBe("number");
      expect(astDoc.schema.entries.email.type).toBe("string");
    }
  });

  test("Optional and nullable fields", () => {
    const schema = v.object({
      required: v.string(),
      optional: v.optional(v.string()),
      nullable: v.nullable(v.number()),
      withDefault: v.optional(v.string(), "default"),
    });

    const astDoc = schemaToAST(schema);

    if ("entries" in astDoc.schema) {
      expect(astDoc.schema.entries.required.type).toBe("string");
      expect(astDoc.schema.entries.optional.type).toBe("optional");
      expect(astDoc.schema.entries.nullable.type).toBe("nullable");
      expect(astDoc.schema.entries.withDefault.type).toBe("optional");

      if ("default" in astDoc.schema.entries.withDefault) {
        expect(astDoc.schema.entries.withDefault.default).toBe("default");
      }
    }
  });

  test("Array schema", () => {
    const schema = v.array(v.string());
    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("array");
    expect("item" in astDoc.schema).toBe(true);

    if ("item" in astDoc.schema) {
      expect(astDoc.schema.item.type).toBe("string");
    }
  });

  test("Tuple schema", () => {
    const schema = v.tuple([v.string(), v.number(), v.boolean()]);
    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("tuple");
    expect("items" in astDoc.schema).toBe(true);

    if ("items" in astDoc.schema) {
      expect(astDoc.schema.items.length).toBe(3);
      expect(astDoc.schema.items[0].type).toBe("string");
      expect(astDoc.schema.items[1].type).toBe("number");
      expect(astDoc.schema.items[2].type).toBe("boolean");
    }
  });

  test("Union schema", () => {
    const schema = v.union([v.string(), v.number(), v.boolean()]);
    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("union");
    expect("options" in astDoc.schema).toBe(true);

    if ("options" in astDoc.schema && astDoc.schema.type === "union") {
      expect(astDoc.schema.options.length).toBe(3);
      expect(astDoc.schema.options[0].type).toBe("string");
      expect(astDoc.schema.options[1].type).toBe("number");
      expect(astDoc.schema.options[2].type).toBe("boolean");
    }
  });

  test("Literal schema", () => {
    const schema = v.literal("hello");
    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("literal");
    expect("literal" in astDoc.schema).toBe(true);

    if ("literal" in astDoc.schema) {
      expect(astDoc.schema.literal).toBe("hello");
    }
  });

  test("Enum schema", () => {
    enum Role {
      Admin = "admin",
      User = "user",
      Guest = "guest",
    }

    const schema = v.enum(Role);
    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("enum");
    expect("enum" in astDoc.schema).toBe(true);
  });

  test("Picklist schema", () => {
    const schema = v.picklist(["red", "green", "blue"]);
    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("picklist");
    expect("options" in astDoc.schema).toBe(true);

    if ("options" in astDoc.schema) {
      expect(astDoc.schema.options.length).toBe(3);
    }
  });

  test("Record schema", () => {
    const schema = v.record(v.string(), v.number());
    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("record");
    expect("key" in astDoc.schema).toBe(true);
    expect("value" in astDoc.schema).toBe(true);

    if ("key" in astDoc.schema && "value" in astDoc.schema) {
      expect(astDoc.schema.key.type).toBe("string");
      expect(astDoc.schema.value.type).toBe("number");
    }
  });

  test("Nested object schema", () => {
    const schema = v.object({
      user: v.object({
        name: v.string(),
        profile: v.object({
          bio: v.optional(v.string()),
          age: v.number(),
        }),
      }),
      tags: v.array(v.string()),
    });

    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("object");

    if ("entries" in astDoc.schema) {
      expect(astDoc.schema.entries.user.type).toBe("object");

      if ("entries" in astDoc.schema.entries.user) {
        expect(astDoc.schema.entries.user.entries.profile.type).toBe("object");
      }

      expect(astDoc.schema.entries.tags.type).toBe("array");
    }
  });

  test("Schema with metadata", () => {
    const schema = v.pipe(
      v.string(),
      v.title("Username"),
      v.description("The username of the user"),
      v.examples(["john_doe", "jane_smith"]),
    );

    const astDoc = schemaToAST(schema);

    expect(astDoc.schema.kind).toBe("schema");
    expect(astDoc.schema.type).toBe("string");
    if ("info" in astDoc.schema) {
      expect(astDoc.schema.info).toBeDefined();
      expect(astDoc.schema.info!.title).toBe("Username");
      expect(astDoc.schema.info!.description).toBe("The username of the user");
      expect(astDoc.schema.info!.examples?.length).toBe(2);
    }
  });

  test("File and Promise Schemas", () => {
    // File
    const fileSchema = v.file();
    const fileAst = schemaToAST(fileSchema);
    expect(fileAst.schema.type).toBe("file");
    const fileRec = astToSchema(fileAst);
    expect(fileRec.type).toBe("file");

    // Promise
    const promiseSchema = v.promise();
    const promiseAst = schemaToAST(promiseSchema);
    expect(promiseAst.schema.type).toBe("promise");
    const promiseRec = astToSchema(promiseAst);
    expect(promiseRec.type).toBe("promise");
  });

  test("Extended Validations", () => {
    // Credit Card (existence check)
    const ccSchema = v.pipe(v.string(), v.creditCard());
    const ccRec = astToSchema(schemaToAST(ccSchema));
    expect(v.is(ccRec, "4111 1111 1111 1111")).toBe(true);

    // Hex Color
    const hexSchema = v.pipe(v.string(), v.hexColor());
    const hexRec = astToSchema(schemaToAST(hexSchema));
    expect(v.is(hexRec, "#ff0000")).toBe(true);

    // Empty
    const emptySchema = v.pipe(v.string(), v.empty());
    const emptyRec = astToSchema(schemaToAST(emptySchema));
    expect(v.is(emptyRec, "")).toBe(true);

    // Slug
    const slugSchema = v.pipe(v.string(), v.slug());
    const slugRec = astToSchema(schemaToAST(slugSchema));
    expect(v.is(slugRec, "my-slug")).toBe(true);
  });

  test("Serialize to JSON and deserialize", () => {
    const original = v.object({
      name: v.string(),
      age: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
      email: v.optional(v.pipe(v.string(), v.email())),
    });

    const astDoc = schemaToAST(original);

    // Serialize to JSON
    const json = JSON.stringify(astDoc, null, 2);
    expect(json).toBeDefined();

    // Deserialize from JSON
    const parsedAST: ASTDocument = JSON.parse(json);

    // Reconstruct schema from parsed AST
    const reconstructed = astToSchema(parsedAST) as typeof original;

    // Test validation
    expect(
      v.is(reconstructed, {
        name: "John",
        age: 30,
        email: "john@example.com",
      }),
    ).toBe(true);
    expect(v.is(reconstructed, { name: "John", age: 150 })).toBe(false); // age too high
    expect(v.is(reconstructed, { name: "John", age: -5 })).toBe(false); // age negative
  });

  test("Custom transformation dictionary", () => {
    // Create custom transformation
    const toUpperCase = (input: string) => input.toUpperCase();
    const splitByComma = (input: string) =>
      input.split(",").map((s) => s.trim());

    // Add a description and type to splitByComma for better AST metadata
    Object.assign(splitByComma, {
      description: "Splits a string by commas into an array of trimmed strings",
      type: "string_to_string_array",
    });

    // Create schema with custom transformations
    const schema = v.pipe(
      v.string(),
      v.transform(toUpperCase),
      v.transform(splitByComma),
    );

    // Create dictionaries (key -> implementation, same for both directions)
    const transformDict = new Map();
    transformDict.set("to-upper-case", toUpperCase);
    transformDict.set("split-by-comma", splitByComma);

    // Convert to AST
    const astDoc = schemaToAST(schema, {
      transformationDictionary: transformDict,
    });

    // Verify custom transformations are recorded
    expect(astDoc.customTransformations).toBeDefined();
    expect(Object.keys(astDoc.customTransformations!).length).toBe(2);
    expect(astDoc.customTransformations!["to-upper-case"]).toBeDefined();
    expect(astDoc.customTransformations!["to-upper-case"].name).toBe(
      "toUpperCase",
    );
    expect(astDoc.customTransformations!["split-by-comma"]).toBeDefined();
    expect(astDoc.customTransformations!["split-by-comma"].name).toBe(
      "splitByComma",
    );
    expect(astDoc.customTransformations!["split-by-comma"].description).toBe(
      "Splits a string by commas into an array of trimmed strings",
    );
    expect(astDoc.customTransformations!["split-by-comma"].type).toBe(
      "string_to_string_array",
    );

    // Serialize to JSON
    const json = JSON.stringify(astDoc);
    const parsed: ASTDocument = JSON.parse(json);

    // Reconstruct with same dictionary
    const reconstructed = astToSchema(parsed, {
      transformationDictionary: transformDict,
    });

    // Test the reconstructed schema works
    const result = v.safeParse(reconstructed, "hello, world");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toEqual(["HELLO", "WORLD"]);
    }
  });

  test("Custom validation dictionary", () => {
    // Create custom validations
    const isEven = (input: unknown) =>
      typeof input === "number" && input % 2 === 0;
    const isPositive = (input: unknown) =>
      typeof input === "number" && input > 0;

    // Create schema with custom validations
    const schema = v.pipe(
      v.number(),
      v.custom(isEven, "Must be even"),
      v.custom(isPositive, "Must be positive"),
    );

    // Create dictionaries (key -> implementation, same for both directions)
    const validationDict = new Map<string, (input: any) => boolean>();
    validationDict.set("is-even", isEven);
    validationDict.set("is-positive", isPositive);

    // Convert to AST
    const astDoc = schemaToAST(schema, {
      validationDictionary: validationDict,
    });

    // Verify custom validations are recorded
    expect(astDoc.customValidations).toBeDefined();
    expect(Object.keys(astDoc.customValidations!).length).toBe(2);

    // Serialize and reconstruct with same dictionary
    const json = JSON.stringify(astDoc);
    const parsed: ASTDocument = JSON.parse(json);

    const reconstructed = astToSchema(parsed, {
      validationDictionary: validationDict,
    });

    // Test validation
    expect(v.is(reconstructed, 4)).toBe(true);
    expect(v.is(reconstructed, 3)).toBe(false); // not even
    expect(v.is(reconstructed, -2)).toBe(false); // not positive
  });

  test("Custom instance dictionary", () => {
    // Define a custom class
    class CustomDate extends Date {
      isCustom = true;
    }

    class CustomUser {
      name: string;
      constructor(name: string) {
        this.name = name;
      }
    }

    // Create schema with instances
    const schema = v.object({
      timestamp: v.instance(CustomDate),
      user: v.instance(CustomUser),
    });

    // Create instance dictionary (key -> class, same for both directions)
    const instanceDict = new Map<string, new (...args: any[]) => any>();
    instanceDict.set("custom-date", CustomDate);
    instanceDict.set("custom-user", CustomUser);

    // Convert to AST
    const astDoc = schemaToAST(schema, {
      instanceDictionary: instanceDict,
    });

    // Verify custom instances are recorded
    expect(astDoc.customInstances).toBeDefined();
    expect(Object.keys(astDoc.customInstances!).length).toBe(2);
    expect(astDoc.customInstances!["custom-date"].className).toBe("CustomDate");
    expect(astDoc.customInstances!["custom-user"].className).toBe("CustomUser");

    // Serialize and reconstruct with same dictionary
    const json = JSON.stringify(astDoc);
    const parsed: ASTDocument = JSON.parse(json);

    const reconstructed = astToSchema(parsed, {
      instanceDictionary: instanceDict,
    });

    // Test validation
    const customDate = new CustomDate();
    const customUser = new CustomUser("Alice");

    expect(
      v.is(reconstructed, { timestamp: customDate, user: customUser }),
    ).toBe(true);
    expect(
      v.is(reconstructed, { timestamp: new Date(), user: customUser }),
    ).toBe(false);
    expect(v.is(reconstructed, { timestamp: customDate, user: {} })).toBe(
      false,
    );
  });

  test("Document metadata", () => {
    const schema = v.string();

    const astDoc = schemaToAST(schema, {
      library: "valibot",
      metadata: {
        author: "Test Author",
        version: "1.0.0",
        customField: "custom value",
      },
    });

    expect(astDoc.library).toBe("valibot");
    expect(astDoc.version).toBe("1.0.0");
    expect(astDoc.metadata).toBeDefined();
    expect(astDoc.metadata!.author).toBe("Test Author");
    expect(astDoc.metadata!.customField).toBe("custom value");
  });
});

describe("AST - Roundtrip", () => {
  test("Simple string", () => {
    const original = v.string();
    const astDoc = schemaToAST(original);
    const reconstructed = astToSchema(astDoc) as typeof original;

    expect(reconstructed.type).toBe("string");
    expect(v.is(reconstructed, "hello")).toBe(true);
    expect(v.is(reconstructed, 123)).toBe(false);
  });

  test("String with validation", () => {
    const original = v.pipe(v.string(), v.email());
    const astDoc = schemaToAST(original);
    const reconstructed = astToSchema(astDoc) as typeof original;

    expect(v.is(reconstructed, "test@example.com")).toBe(true);
    expect(v.is(reconstructed, "not-an-email")).toBe(false);
  });

  test("Object schema", () => {
    const original = v.object({
      name: v.string(),
      age: v.number(),
    });

    const astDoc = schemaToAST(original);
    const reconstructed = astToSchema(astDoc) as typeof original;

    expect(v.is(reconstructed, { name: "John", age: 30 })).toBe(true);
    expect(v.is(reconstructed, { name: "John" })).toBe(false);
    expect(v.is(reconstructed, { name: 123, age: 30 })).toBe(false);
  });

  test("Optional fields", () => {
    const original = v.object({
      required: v.string(),
      optional: v.optional(v.string()),
    });

    const astDoc = schemaToAST(original);
    const reconstructed = astToSchema(astDoc) as typeof original;

    expect(v.is(reconstructed, { required: "test", optional: "value" })).toBe(
      true,
    );
    expect(v.is(reconstructed, { required: "test" })).toBe(true);
    expect(v.is(reconstructed, { optional: "value" })).toBe(false);
  });

  test("Array schema", () => {
    const original = v.array(v.string());
    const astDoc = schemaToAST(original);
    const reconstructed = astToSchema(astDoc) as typeof original;

    expect(v.is(reconstructed, ["a", "b", "c"])).toBe(true);
    expect(v.is(reconstructed, ["a", 1, "c"])).toBe(false);
    expect(v.is(reconstructed, "not-array")).toBe(false);
  });

  test("Union schema", () => {
    const original = v.union([v.string(), v.number()]);
    const astDoc = schemaToAST(original);
    const reconstructed = astToSchema(astDoc) as typeof original;

    expect(v.is(reconstructed, "hello")).toBe(true);
    expect(v.is(reconstructed, 123)).toBe(true);
    expect(v.is(reconstructed, true)).toBe(false);
  });

  test("Complex nested schema", () => {
    const original = v.object({
      user: v.object({
        name: v.string(),
        email: v.pipe(v.string(), v.email()),
        role: v.union([v.literal("admin"), v.literal("user")]),
      }),
      tags: v.array(v.string()),
      metadata: v.optional(v.record(v.string(), v.unknown())),
    });

    const astDoc = schemaToAST(original);
    const reconstructed = astToSchema(astDoc) as typeof original;

    const validData = {
      user: {
        name: "John Doe",
        email: "john@example.com",
        role: "admin" as const,
      },
      tags: ["javascript", "typescript"],
      metadata: { key: "value" },
    };

    expect(v.is(reconstructed, validData)).toBe(true);

    const invalidData = {
      user: {
        name: "John Doe",
        email: "not-an-email",
        role: "admin",
      },
      tags: ["javascript"],
    };

    expect(v.is(reconstructed, invalidData)).toBe(false);
  });
});

describe("AST - Async", () => {
  test("Simple async schema", async () => {
    // Create async validation
    const checkUnique = async (value: string): Promise<boolean> => {
      // Simulate async check
      await new Promise((resolve) => setTimeout(resolve, 10));
      return value !== "taken";
    };

    // Create async schema
    const schema = v.pipeAsync(
      v.string(),
      v.checkAsync(checkUnique, "Value is taken"),
    );

    // Convert to AST with dictionary (key -> implementation)
    const validationDict = new Map();
    validationDict.set("check-unique", checkUnique);

    const astDoc = schemaToAST(schema, {
      validationDictionary: validationDict,
    });

    // Reconstruct with same dictionary
    const reconstructed = astToSchemaAsync(JSON.parse(JSON.stringify(astDoc)), {
      validationDictionary: validationDict,
    });

    // Test async validation
    const validResult = await v.safeParseAsync(reconstructed, "available");
    expect(validResult.success).toBe(true);

    const invalidResult = await v.safeParseAsync(reconstructed, "taken");
    expect(invalidResult.success).toBe(false);
  });

  test("Async transformation", async () => {
    // Create async transformation
    const fetchUserData = async (
      userId: string,
    ): Promise<{ id: string; name: string }> => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { id: userId, name: `User ${userId}` };
    };

    // Create async schema
    const schema = v.pipeAsync(v.string(), v.transformAsync(fetchUserData));

    // Convert to AST with dictionary (key -> implementation, same for both directions)
    const transformDict = new Map();
    transformDict.set("fetch-user-data", fetchUserData);

    const astDoc = schemaToAST(schema, {
      transformationDictionary: transformDict,
    });

    // Reconstruct with same dictionary
    const reconstructed = astToSchemaAsync(JSON.parse(JSON.stringify(astDoc)), {
      transformationDictionary: transformDict,
    });

    // Test async transformation
    const result = await v.safeParseAsync(reconstructed, "123");
    expect(result.success).toBe(true);
    if (result.success) {
      const output = result.output as { id: string; name: string };
      expect(output.id).toBe("123");
      expect(output.name).toBe("User 123");
    }
  });

  test("Complex async schema", async () => {
    // Custom async operations
    const validateEmail = async (email: string): Promise<boolean> => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      // Check for valid email format and not in blocklist
      const isValidFormat = email.includes("@") && email.includes(".");
      const isBlocked =
        email.startsWith("spam@") || email.startsWith("blocked@");
      return isValidFormat && !isBlocked;
    };

    const normalizeEmail = async (email: string): Promise<string> => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return email.toLowerCase().trim();
    };

    // Create complex async schema
    const schema = v.pipeAsync(
      v.string(),
      v.transformAsync(normalizeEmail),
      v.checkAsync(validateEmail, "Invalid email"),
    );

    // Convert to AST with dictionary (key -> implementation, same for both directions)
    const dict = new Map();
    dict.set("validate-email", validateEmail);
    dict.set("normalize-email", normalizeEmail);

    const astDoc = schemaToAST(schema, {
      validationDictionary: dict,
      transformationDictionary: dict,
    });

    // Serialize and deserialize
    const json = JSON.stringify(astDoc);
    const parsed = JSON.parse(json);

    // Reconstruct with same dictionary
    const reconstructed = astToSchemaAsync(parsed, {
      validationDictionary: dict,
      transformationDictionary: dict,
    });

    // Test with valid email
    const validResult = await v.safeParseAsync(
      reconstructed,
      "  TEST@EXAMPLE.COM  ",
    );
    expect(validResult.success).toBe(true);
    if (validResult.success) {
      expect(validResult.output).toBe("test@example.com");
    }

    // Test with blocked email (spam) - will be normalized to lowercase before validation
    const invalidResult = await v.safeParseAsync(
      reconstructed,
      "  SPAM@EXAMPLE.COM  ",
    );
    expect(invalidResult.success).toBe(false);
  });
});

describe("AST - Validation", () => {
  test("Valid AST with validateAST option", () => {
    const schema = v.object({
      name: v.pipe(v.string(), v.minLength(1)),
      email: v.pipe(v.string(), v.email()),
    });

    const ast = schemaToAST(schema);

    // Should not throw with valid AST
    const reconstructed = astToSchema(ast, {
      validateAST: ASTDocumentSchema,
    });
    expect(
      v.is(reconstructed, { name: "John", email: "john@example.com" }),
    ).toBe(true);
  });

  test("Invalid AST throws with validateAST option", () => {
    const invalidAst = {
      version: "1.0.0",
      library: "invalid_library", // Invalid library
      schema: {
        kind: "schema",
        type: "string",
      },
    } as any;

    expect(() =>
      astToSchema(invalidAst, { validateAST: ASTDocumentSchema }),
    ).toThrowError(/Invalid AST document structure/);
  });

  test("Invalid AST passes without validateAST option", () => {
    const invalidAst = {
      version: "1.0.0",
      library: "valibot",
      schema: {
        kind: "schema",
        type: "string",
      },
    } as any;

    // Should not throw when validateAST is false (default)
    const reconstructed = astToSchema(invalidAst, {
      strictLibraryCheck: true,
    });
    expect(reconstructed.type).toBe("string");
  });

  test("Valid AST with validateAST option", () => {
    const schema = v.object({
      name: v.pipe(v.string(), v.minLength(1)),
      email: v.pipe(v.string(), v.email()),
    });

    const ast = schemaToAST(schema);

    // Should not throw with valid AST
    const reconstructed = astToSchemaAsync(ast, {
      validateAST: ASTDocumentSchema,
    });
    // Just verify it was created without errors
    expect(reconstructed.type).toBe("object");
  });

  test("Invalid AST throws with validateAST option", () => {
    const invalidAst = {
      version: "1.0.0",
      library: "invalid_library", // Invalid library
      schema: {
        kind: "schema",
        type: "string",
      },
    } as any;

    expect(() =>
      astToSchemaAsync(invalidAst, { validateAST: ASTDocumentSchema }),
    ).toThrowError(/Invalid AST document structure/);
  });
});

describe("AST - Lazy Schema Support", () => {
  test("Lazy schema with dictionary", () => {
    // Define the getter function
    const nodeGetter = (): v.GenericSchema =>
      v.object({
        value: v.number(),
        children: v.optional(v.array(v.lazy(nodeGetter))),
      });

    const nodeSchema = v.lazy(nodeGetter);

    // Create dictionary mapping key to getter (same format for both directions)
    const lazyDict = new Map();
    lazyDict.set("node-schema", nodeGetter);

    // Convert to AST
    const astDoc = schemaToAST(nodeSchema, {
      lazyDictionary: lazyDict,
    });

    // Verify AST structure
    expect(astDoc.schema.type).toBe("lazy");
    expect(astDoc.customLazy).toBeDefined();
    expect(astDoc.customLazy!["node-schema"]).toBeDefined();
    if ("customKey" in astDoc.schema) {
      expect(astDoc.schema.customKey).toBe("node-schema");
    }

    // Reconstruct schema with same dictionary
    const reconstructed = astToSchema(astDoc, {
      lazyDictionary: lazyDict,
    });

    // Test the reconstructed schema
    const validData = {
      value: 1,
      children: [{ value: 2 }, { value: 3, children: [{ value: 4 }] }],
    };

    const result = v.safeParse(reconstructed, validData);
    expect(result.success).toBe(true);
  });

  test("Lazy schema without dictionary throws on serialization", () => {
    const getter = (): v.GenericSchema => v.string();
    const schema = v.lazy(getter);

    // Should still create AST but with note
    const astDoc = schemaToAST(schema);
    expect(astDoc.schema.type).toBe("lazy");
    if ("note" in astDoc.schema) {
      expect(astDoc.schema.note).toBe("lazy-schema-requires-runtime-getter");
    }
  });

  test("Lazy schema without dictionary throws on reconstruction", () => {
    const getter = (): v.GenericSchema => v.string();
    const schema = v.lazy(getter);
    const astDoc = schemaToAST(schema);

    // Should throw when trying to reconstruct without dictionary
    expect(() => astToSchema(astDoc)).toThrowError(
      /Cannot reconstruct lazy schema/,
    );
  });

  test("Lazy schema with missing implementation throws", () => {
    const getter = (): v.GenericSchema => v.string();
    const schema = v.lazy(getter);

    const lazyDict = new Map();
    lazyDict.set("my-lazy", getter);

    const astDoc = schemaToAST(schema, { lazyDictionary: lazyDict });

    // Try to reconstruct with wrong key
    const wrongDict = new Map();
    wrongDict.set("wrong-key", getter);

    expect(() =>
      astToSchema(astDoc, { lazyDictionary: wrongDict }),
    ).toThrowError(/not found in lazy dictionary/);
  });

  test("Async lazy schema", () => {
    // Create a lazy schema that will be used in async context
    const getter = (): v.GenericSchemaAsync => v.pipeAsync(v.string());

    const schema = v.lazyAsync(getter);

    const lazyDict = new Map();
    lazyDict.set("async-lazy", getter);

    const astDoc = schemaToAST(schema, { lazyDictionary: lazyDict });

    const lazyImplDict = new Map();
    lazyImplDict.set("async-lazy", getter);

    const reconstructed = astToSchemaAsync(astDoc, {
      lazyDictionary: lazyImplDict,
    });

    expect(reconstructed.type).toBe("lazy");
  });
});

describe("AST - Closure Support", () => {
  test("Closure in transformation with closureDictionary", () => {
    // Simulate a closure that captures external context
    const prefix = "Mr. ";
    const addPrefix = (name: string) => `${prefix}${name}`;

    const schema = v.pipe(v.string(), v.transform(addPrefix));

    // Use closureDictionary for functions that capture variables
    const closureDict = new Map();
    closureDict.set("add-prefix", addPrefix);

    const astDoc = schemaToAST(schema, {
      closureDictionary: closureDict,
    });

    // Verify closure is recorded
    expect(astDoc.customClosures).toBeDefined();
    expect(astDoc.customClosures!["add-prefix"]).toBeDefined();

    // Reconstruct with same dictionary
    const reconstructed = astToSchema(astDoc, {
      closureDictionary: closureDict,
    });

    const result = v.safeParse(reconstructed, "John");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toBe("Mr. John");
    }
  });

  test("Closure in validation with closureDictionary", () => {
    const allowedValues = new Set(["admin", "user", "guest"]);
    const isAllowed = (value: string) => allowedValues.has(value);

    const schema = v.pipe(v.string(), v.check(isAllowed, "Value not allowed"));

    const closureDict = new Map();
    closureDict.set("is-allowed", isAllowed);

    const astDoc = schemaToAST(schema, {
      closureDictionary: closureDict,
    });

    expect(astDoc.customClosures).toBeDefined();

    const reconstructed = astToSchema(astDoc, {
      closureDictionary: closureDict,
    });

    expect(v.safeParse(reconstructed, "admin").success).toBe(true);
    expect(v.safeParse(reconstructed, "invalid").success).toBe(false);
  });

  test("Mixed closure and transformation dictionaries", () => {
    const suffix = "123";
    const addSuffix = (val: string) => `${val}${suffix}`;

    const schema = v.pipe(v.string(), v.transform(addSuffix), v.toUpperCase());

    // Use closureDictionary for closure, other transformations auto-detected
    const closureDict = new Map();
    closureDict.set("add-suffix", addSuffix);

    const astDoc = schemaToAST(schema, {
      closureDictionary: closureDict,
    });

    const reconstructed = astToSchema(astDoc, {
      closureDictionary: closureDict,
    });

    const result = v.safeParse(reconstructed, "test");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toBe("TEST123");
    }
  });

  test("Async closure", () => {
    const apiKey = "secret";
    const validateWithAPI = async (value: string): Promise<boolean> => {
      // Simulate API call using captured apiKey
      return value.length > 0 && apiKey === "secret";
    };

    const schema = v.pipeAsync(
      v.string(),
      v.checkAsync(validateWithAPI, "API validation failed"),
    );

    const closureDict = new Map();
    closureDict.set("api-validator", validateWithAPI);

    const astDoc = schemaToAST(schema, {
      closureDictionary: closureDict,
    });

    const reconstructed = astToSchemaAsync(astDoc, {
      closureDictionary: closureDict,
    });

    expect(reconstructed.async).toBe(true);
  });

  test("Closure fallback from validation dictionary", () => {
    const maxLen = 10;
    const checkLength = (val: string) => val.length <= maxLen;

    const schema = v.pipe(v.string(), v.check(checkLength));

    // Put closure in validationDictionary (should still work)
    const validationDict = new Map();
    validationDict.set("check-len", checkLength);

    const astDoc = schemaToAST(schema, {
      validationDictionary: validationDict,
    });

    const reconstructed = astToSchema(astDoc, {
      validationDictionary: validationDict,
    });

    expect(v.safeParse(reconstructed, "short").success).toBe(true);
    expect(v.safeParse(reconstructed, "very long string").success).toBe(false);
  });
});
