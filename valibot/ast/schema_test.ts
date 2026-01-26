import { assertEquals } from "@std/assert";
import * as v from "valibot";
import { ASTDocumentSchema } from "./schema.ts";
import { schemaToAST } from "./to-ast.ts";

// Test enum for enum schema tests
enum TestEnum {
  Value1 = "value1",
  Value2 = "value2",
  Value3 = 3,
}

// Test class for instance schema tests
class TestClass {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

Deno.test("AST Schema - Validates simple object schema", () => {
  const schema = v.object({
    name: v.string(),
    age: v.number(),
    tags: v.array(v.string()),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(JSON.stringify(result.issues, null, 2));
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates all primitive types", () => {
  const schema = v.object({
    str: v.string(),
    num: v.number(),
    bool: v.boolean(),
    bigInt: v.bigint(),
    date: v.date(),
    blob: v.blob(),
    symbol: v.symbol(),
    any: v.any(),
    unknown: v.unknown(),
    never: v.never(),
    nan: v.nan(),
    nullType: v.null_(),
    undefinedType: v.undefined_(),
    voidType: v.void_(),
    file: v.file(),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Primitive types validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates literal schemas", () => {
  const schema = v.object({
    strLiteral: v.literal("test"),
    numLiteral: v.literal(42),
    boolLiteral: v.literal(true),
    bigintLiteral: v.literal(9_007_199_254_740_991n),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Literal schemas validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates object variations", () => {
  const schema = v.object({
    normalObj: v.object({ a: v.string() }),
    looseObj: v.looseObject({ a: v.string() }),
    strictObj: v.strictObject({ a: v.string() }),
    objWithRest: v.objectWithRest({ a: v.string() }, v.number()),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Object variations validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates array schema", () => {
  const schema = v.object({
    simpleArray: v.array(v.string()),
    nestedArray: v.array(v.array(v.number())),
    arrayWithPipe: v.pipe(v.array(v.string()), v.minLength(1)),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Array schemas validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates tuple variations", () => {
  const schema = v.object({
    normalTuple: v.tuple([v.string(), v.number()]),
    looseTuple: v.looseTuple([v.string(), v.number()]),
    strictTuple: v.strictTuple([v.string(), v.number()]),
    tupleWithRest: v.tupleWithRest([v.string()], v.number()),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Tuple variations validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates union and variant", () => {
  const schema = v.object({
    simpleUnion: v.union([v.string(), v.number()]),
    variant: v.variant("type", [
      v.object({ type: v.literal("a"), value: v.string() }),
      v.object({ type: v.literal("b"), value: v.number() }),
    ]),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Union/variant validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates enum and picklist", () => {
  const schema = v.object({
    enumSchema: v.enum_(TestEnum),
    picklist: v.picklist(["a", "b", "c"]),
    numPicklist: v.picklist([1, 2, 3]),
    bigintPicklist: v.picklist([1n, 2n, 3n]),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Enum/picklist validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates record, map, and set", () => {
  const schema = v.object({
    record: v.record(v.string(), v.number()),
    map: v.map(v.string(), v.number()),
    set: v.set(v.string()),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Record/map/set validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates intersect", () => {
  const schema = v.object({
    intersection: v.intersect([
      v.object({ a: v.string() }),
      v.object({ b: v.number() }),
    ]),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Intersect validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates instance and function schemas", () => {
  const schema = v.object({
    instance: v.instance(TestClass),
    func: v.function_(),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Instance/function validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates lazy schema", () => {
  type Node = {
    value: string;
    children?: Node[];
  };

  const NodeSchema: v.GenericSchema<Node> = v.lazy(() =>
    v.object({
      value: v.string(),
      children: v.optional(v.array(NodeSchema)),
    }),
  );

  const ast = schemaToAST(NodeSchema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Lazy schema validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates wrapped schemas", () => {
  const schema = v.object({
    optional: v.optional(v.string()),
    optionalWithDefault: v.optional(v.string(), "default"),
    nullable: v.nullable(v.string()),
    nullish: v.nullish(v.string()),
    nonOptional: v.nonOptional(v.optional(v.string())),
    nonNullable: v.nonNullable(v.nullable(v.string())),
    nonNullish: v.nonNullish(v.nullish(v.string())),
    undefinedable: v.undefinedable(v.string()),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Wrapped schemas validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates common validations in pipe", () => {
  const schema = v.object({
    email: v.pipe(v.string(), v.email()),
    url: v.pipe(v.string(), v.url()),
    uuid: v.pipe(v.string(), v.uuid()),
    minLength: v.pipe(v.string(), v.minLength(5)),
    maxLength: v.pipe(v.string(), v.maxLength(10)),
    length: v.pipe(v.string(), v.length(8)),
    minValue: v.pipe(v.number(), v.minValue(0)),
    maxValue: v.pipe(v.number(), v.maxValue(100)),
    value: v.pipe(v.number(), v.value(42)),
    regex: v.pipe(v.string(), v.regex(/^[a-z]+$/)),
    includes: v.pipe(v.string(), v.includes("test")),
    startsWith: v.pipe(v.string(), v.startsWith("prefix")),
    endsWith: v.pipe(v.string(), v.endsWith("suffix")),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Common validations failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates transformations in pipe", () => {
  const schema = v.object({
    lowercase: v.pipe(v.string(), v.toLowerCase()),
    uppercase: v.pipe(v.string(), v.toUpperCase()),
    trim: v.pipe(v.string(), v.trim()),
    trimStart: v.pipe(v.string(), v.trimStart()),
    trimEnd: v.pipe(v.string(), v.trimEnd()),
    toMinValue: v.pipe(v.number(), v.toMinValue(0)),
    toMaxValue: v.pipe(v.number(), v.toMaxValue(100)),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Transformations validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates schema with metadata", () => {
  const schema = v.pipe(
    v.string(),
    v.title("Username"),
    v.description("The user's username"),
    v.examples(["john_doe", "jane_smith"]),
    v.metadata({ customField: "customValue" }),
  );

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Metadata validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates custom validations with dictionary", () => {
  const customValidation = (input: string) => input.includes("custom");

  const validationDictionary = new Map();
  validationDictionary.set(customValidation, "customCheck");

  const schema = v.pipe(
    v.string(),
    v.check(customValidation, 'Must include "custom"'),
  );

  const ast = schemaToAST(schema, { validationDictionary });
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Custom validations validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
  assertEquals(ast.customValidations?.customCheck?.name, "customValidation");
});

Deno.test(
  "AST Schema - Validates custom transformations with dictionary",
  () => {
    const customTransform = (input: string) => input + "_transformed";

    const transformationDictionary = new Map();
    transformationDictionary.set(customTransform, "customTransform");

    const schema = v.pipe(v.string(), v.transform(customTransform));

    const ast = schemaToAST(schema, { transformationDictionary });
    const result = v.safeParse(ASTDocumentSchema, ast);

    if (!result.success) {
      console.error(
        "Custom transformations validation failed:",
        JSON.stringify(result.issues, null, 2),
      );
    }

    assertEquals(result.success, true);
    assertEquals(
      ast.customTransformations?.customTransform?.name,
      "customTransform",
    );
  },
);

Deno.test("AST Schema - Validates complex nested schema", () => {
  const schema = v.object({
    user: v.object({
      id: v.pipe(v.string(), v.uuid()),
      name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
      email: v.pipe(v.string(), v.email()),
      age: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(150))),
      roles: v.array(v.picklist(["admin", "user", "guest"])),
      metadata: v.nullable(v.record(v.string(), v.unknown())),
    }),
    preferences: v.optional(
      v.object({
        theme: v.union([v.literal("light"), v.literal("dark")]),
        notifications: v.object({
          email: v.boolean(),
          push: v.boolean(),
        }),
      }),
    ),
    tags: v.array(v.string()),
    createdAt: v.date(),
  });

  const ast = schemaToAST(schema);
  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Complex nested schema validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
});

Deno.test("AST Schema - Validates schema with document metadata", () => {
  const schema = v.string();
  const ast = schemaToAST(schema, {
    library: "valibot",
    metadata: {
      author: "Test Author",
      version: "1.0.0",
      customField: { nested: true },
    },
  });

  const result = v.safeParse(ASTDocumentSchema, ast);

  if (!result.success) {
    console.error(
      "Document metadata validation failed:",
      JSON.stringify(result.issues, null, 2),
    );
  }

  assertEquals(result.success, true);
  assertEquals(ast.metadata?.author, "Test Author");
});

Deno.test("AST Schema - Rejects invalid AST - wrong library", () => {
  const invalidAst = {
    version: "1.0.0",
    library: "invalid_library", // Invalid library type
    schema: {
      kind: "schema",
      type: "string",
    },
  };

  const result = v.safeParse(ASTDocumentSchema, invalidAst);
  assertEquals(result.success, false);
});

Deno.test("AST Schema - Rejects invalid AST - missing required fields", () => {
  const invalidAst = {
    version: "1.0.0",
    library: "valibot",
    // Missing schema field
  };

  const result = v.safeParse(ASTDocumentSchema, invalidAst);
  assertEquals(result.success, false);
});

Deno.test("AST Schema - Rejects invalid AST - wrong kind", () => {
  const invalidAst = {
    version: "1.0.0",
    library: "valibot",
    schema: {
      kind: "invalid_kind",
      type: "string",
    },
  };

  const result = v.safeParse(ASTDocumentSchema, invalidAst);
  assertEquals(result.success, false);
});
