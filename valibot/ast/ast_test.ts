import { assertEquals, assertExists } from '@std/assert';
import * as v from 'valibot';
import { schemaToAST } from './to-ast.ts';
import { astToSchema } from './to-schema.ts';
import { astToSchemaAsync } from './to-schema-async.ts';
import { ASTDocumentSchema } from './schema.ts';
import type { ASTDocument } from '../../ast/types.ts';

Deno.test('AST - Simple string schema', () => {
  const schema = v.string();
  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.library, 'valibot');
  assertEquals(astDoc.version, '1.0.0');
  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'string');
});

Deno.test('AST - String with validations', () => {
  const schema = v.pipe(v.string(), v.email(), v.maxLength(100));
  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'string');
  if ('pipe' in astDoc.schema && astDoc.schema.pipe) {
    assertExists(astDoc.schema.pipe);
    assertEquals(astDoc.schema.pipe.length, 3);
    if (astDoc.schema.pipe.length > 1) {
      assertEquals(astDoc.schema.pipe[1].kind, 'validation');
      assertEquals(astDoc.schema.pipe[1].type, 'email');
    }
  }
});

Deno.test('AST - Object schema', () => {
  const schema = v.object({
    name: v.string(),
    age: v.number(),
    email: v.pipe(v.string(), v.email()),
  });

  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'object');
  assertEquals('entries' in astDoc.schema, true);

  if ('entries' in astDoc.schema) {
    assertEquals(Object.keys(astDoc.schema.entries).length, 3);
    assertEquals(astDoc.schema.entries.name.type, 'string');
    assertEquals(astDoc.schema.entries.age.type, 'number');
    assertEquals(astDoc.schema.entries.email.type, 'string');
  }
});

Deno.test('AST - Optional and nullable fields', () => {
  const schema = v.object({
    required: v.string(),
    optional: v.optional(v.string()),
    nullable: v.nullable(v.number()),
    withDefault: v.optional(v.string(), 'default'),
  });

  const astDoc = schemaToAST(schema);

  if ('entries' in astDoc.schema) {
    assertEquals(astDoc.schema.entries.required.type, 'string');
    assertEquals(astDoc.schema.entries.optional.type, 'optional');
    assertEquals(astDoc.schema.entries.nullable.type, 'nullable');
    assertEquals(astDoc.schema.entries.withDefault.type, 'optional');

    if ('default' in astDoc.schema.entries.withDefault) {
      assertEquals(astDoc.schema.entries.withDefault.default, 'default');
    }
  }
});

Deno.test('AST - Array schema', () => {
  const schema = v.array(v.string());
  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'array');
  assertEquals('item' in astDoc.schema, true);

  if ('item' in astDoc.schema) {
    assertEquals(astDoc.schema.item.type, 'string');
  }
});

Deno.test('AST - Tuple schema', () => {
  const schema = v.tuple([v.string(), v.number(), v.boolean()]);
  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'tuple');
  assertEquals('items' in astDoc.schema, true);

  if ('items' in astDoc.schema) {
    assertEquals(astDoc.schema.items.length, 3);
    assertEquals(astDoc.schema.items[0].type, 'string');
    assertEquals(astDoc.schema.items[1].type, 'number');
    assertEquals(astDoc.schema.items[2].type, 'boolean');
  }
});

Deno.test('AST - Union schema', () => {
  const schema = v.union([v.string(), v.number(), v.boolean()]);
  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'union');
  assertEquals('options' in astDoc.schema, true);

  if ('options' in astDoc.schema && astDoc.schema.type === 'union') {
    assertEquals(astDoc.schema.options.length, 3);
    assertEquals(astDoc.schema.options[0].type, 'string');
    assertEquals(astDoc.schema.options[1].type, 'number');
    assertEquals(astDoc.schema.options[2].type, 'boolean');
  }
});

Deno.test('AST - Literal schema', () => {
  const schema = v.literal('hello');
  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'literal');
  assertEquals('literal' in astDoc.schema, true);

  if ('literal' in astDoc.schema) {
    assertEquals(astDoc.schema.literal, 'hello');
  }
});

Deno.test('AST - Enum schema', () => {
  enum Role {
    Admin = 'admin',
    User = 'user',
    Guest = 'guest',
  }

  const schema = v.enum(Role);
  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'enum');
  assertEquals('enum' in astDoc.schema, true);
});

Deno.test('AST - Picklist schema', () => {
  const schema = v.picklist(['red', 'green', 'blue']);
  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'picklist');
  assertEquals('options' in astDoc.schema, true);

  if ('options' in astDoc.schema) {
    assertEquals(astDoc.schema.options.length, 3);
  }
});

Deno.test('AST - Record schema', () => {
  const schema = v.record(v.string(), v.number());
  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'record');
  assertEquals('key' in astDoc.schema, true);
  assertEquals('value' in astDoc.schema, true);

  if ('key' in astDoc.schema && 'value' in astDoc.schema) {
    assertEquals(astDoc.schema.key.type, 'string');
    assertEquals(astDoc.schema.value.type, 'number');
  }
});

Deno.test('AST - Nested object schema', () => {
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

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'object');

  if ('entries' in astDoc.schema) {
    assertEquals(astDoc.schema.entries.user.type, 'object');

    if ('entries' in astDoc.schema.entries.user) {
      assertEquals(astDoc.schema.entries.user.entries.profile.type, 'object');
    }

    assertEquals(astDoc.schema.entries.tags.type, 'array');
  }
});

Deno.test('AST - Schema with metadata', () => {
  const schema = v.pipe(
    v.string(),
    v.title('Username'),
    v.description('The username of the user'),
    v.examples(['john_doe', 'jane_smith']),
  );

  const astDoc = schemaToAST(schema);

  assertEquals(astDoc.schema.kind, 'schema');
  assertEquals(astDoc.schema.type, 'string');
  if ('info' in astDoc.schema) {
    assertExists(astDoc.schema.info);
    assertEquals(astDoc.schema.info!.title, 'Username');
    assertEquals(astDoc.schema.info!.description, 'The username of the user');
    assertEquals(astDoc.schema.info!.examples?.length, 2);
  }
});

Deno.test('AST Roundtrip - Simple string', () => {
  const original = v.string();
  const astDoc = schemaToAST(original);
  const reconstructed = astToSchema(astDoc) as typeof original;

  assertEquals(reconstructed.type, 'string');
  assertEquals(v.is(reconstructed, 'hello'), true);
  assertEquals(v.is(reconstructed, 123), false);
});

Deno.test('AST Roundtrip - String with validation', () => {
  const original = v.pipe(v.string(), v.email());
  const astDoc = schemaToAST(original);
  const reconstructed = astToSchema(astDoc) as typeof original;

  assertEquals(v.is(reconstructed, 'test@example.com'), true);
  assertEquals(v.is(reconstructed, 'not-an-email'), false);
});

Deno.test('AST Roundtrip - Object schema', () => {
  const original = v.object({
    name: v.string(),
    age: v.number(),
  });

  const astDoc = schemaToAST(original);
  const reconstructed = astToSchema(astDoc) as typeof original;

  assertEquals(v.is(reconstructed, { name: 'John', age: 30 }), true);
  assertEquals(v.is(reconstructed, { name: 'John' }), false);
  assertEquals(v.is(reconstructed, { name: 123, age: 30 }), false);
});

Deno.test('AST Roundtrip - Optional fields', () => {
  const original = v.object({
    required: v.string(),
    optional: v.optional(v.string()),
  });

  const astDoc = schemaToAST(original);
  const reconstructed = astToSchema(astDoc) as typeof original;

  assertEquals(v.is(reconstructed, { required: 'test', optional: 'value' }), true);
  assertEquals(v.is(reconstructed, { required: 'test' }), true);
  assertEquals(v.is(reconstructed, { optional: 'value' }), false);
});

Deno.test('AST Roundtrip - Array schema', () => {
  const original = v.array(v.string());
  const astDoc = schemaToAST(original);
  const reconstructed = astToSchema(astDoc) as typeof original;

  assertEquals(v.is(reconstructed, ['a', 'b', 'c']), true);
  assertEquals(v.is(reconstructed, ['a', 1, 'c']), false);
  assertEquals(v.is(reconstructed, 'not-array'), false);
});

Deno.test('AST Roundtrip - Union schema', () => {
  const original = v.union([v.string(), v.number()]);
  const astDoc = schemaToAST(original);
  const reconstructed = astToSchema(astDoc) as typeof original;

  assertEquals(v.is(reconstructed, 'hello'), true);
  assertEquals(v.is(reconstructed, 123), true);
  assertEquals(v.is(reconstructed, true), false);
});

Deno.test('AST Roundtrip - Complex nested schema', () => {
  const original = v.object({
    user: v.object({
      name: v.string(),
      email: v.pipe(v.string(), v.email()),
      role: v.union([v.literal('admin'), v.literal('user')]),
    }),
    tags: v.array(v.string()),
    metadata: v.optional(v.record(v.string(), v.unknown())),
  });

  const astDoc = schemaToAST(original);
  const reconstructed = astToSchema(astDoc) as typeof original;

  const validData = {
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin' as const,
    },
    tags: ['javascript', 'typescript'],
    metadata: { key: 'value' },
  };

  assertEquals(v.is(reconstructed, validData), true);

  const invalidData = {
    user: {
      name: 'John Doe',
      email: 'not-an-email',
      role: 'admin',
    },
    tags: ['javascript'],
  };

  assertEquals(v.is(reconstructed, invalidData), false);
});

Deno.test('AST - Serialize to JSON and deserialize', () => {
  const original = v.object({
    name: v.string(),
    age: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
    email: v.optional(v.pipe(v.string(), v.email())),
  });

  const astDoc = schemaToAST(original);

  // Serialize to JSON
  const json = JSON.stringify(astDoc, null, 2);
  assertExists(json);

  // Deserialize from JSON
  const parsedAST: ASTDocument = JSON.parse(json);

  // Reconstruct schema from parsed AST
  const reconstructed = astToSchema(parsedAST) as typeof original;

  // Test validation
  assertEquals(v.is(reconstructed, { name: 'John', age: 30, email: 'john@example.com' }), true);
  assertEquals(v.is(reconstructed, { name: 'John', age: 150 }), false); // age too high
  assertEquals(v.is(reconstructed, { name: 'John', age: -5 }), false); // age negative
});

Deno.test('AST - Custom transformation dictionary', () => {
  // Create custom transformation
  const toUpperCase = (input: string) => input.toUpperCase();
  const splitByComma = (input: string) => input.split(',').map(s => s.trim());

  // Create schema with custom transformations
  const schema = v.pipe(
    v.string(),
    v.transform(toUpperCase),
    v.transform(splitByComma)
  );

  // Create dictionaries
  const transformDict = new Map();
  transformDict.set(toUpperCase, 'to-upper-case');
  transformDict.set(splitByComma, 'split-by-comma');

  // Convert to AST
  const astDoc = schemaToAST(schema, {
    transformationDictionary: transformDict,
  });

  // Verify custom transformations are recorded
  assertExists(astDoc.customTransformations);
  assertEquals(Object.keys(astDoc.customTransformations!).length, 2);
  assertExists(astDoc.customTransformations!['to-upper-case']);
  assertExists(astDoc.customTransformations!['split-by-comma']);

  // Serialize to JSON
  const json = JSON.stringify(astDoc);
  const parsed: ASTDocument = JSON.parse(json);

  // Reconstruct with implementations
  const implDict = new Map();
  implDict.set('to-upper-case', toUpperCase);
  implDict.set('split-by-comma', splitByComma);

  const reconstructed = astToSchema(parsed, {
    transformationDictionary: implDict,
  });

  // Test the reconstructed schema works
  const result = v.safeParse(reconstructed, 'hello, world');
  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.output, ['HELLO', 'WORLD']);
  }
});

Deno.test('AST - Custom validation dictionary', () => {
  // Create custom validations
  const isEven = (input: unknown) => typeof input === 'number' && input % 2 === 0;
  const isPositive = (input: unknown) => typeof input === 'number' && input > 0;

  // Create schema with custom validations
  const schema = v.pipe(
    v.number(),
    v.custom(isEven, 'Must be even'),
    v.custom(isPositive, 'Must be positive')
  );

  // Create dictionaries
  const validationDict = new Map();
  validationDict.set(isEven, 'is-even');
  validationDict.set(isPositive, 'is-positive');

  // Convert to AST
  const astDoc = schemaToAST(schema, {
    validationDictionary: validationDict,
  });

  // Verify custom validations are recorded
  assertExists(astDoc.customValidations);
  assertEquals(Object.keys(astDoc.customValidations!).length, 2);

  // Serialize and reconstruct
  const json = JSON.stringify(astDoc);
  const parsed: ASTDocument = JSON.parse(json);

  const implDict = new Map<string, (input: any) => boolean>();
  implDict.set('is-even', isEven);
  implDict.set('is-positive', isPositive);

  const reconstructed = astToSchema(parsed, {
    validationDictionary: implDict,
  });

  // Test validation
  assertEquals(v.is(reconstructed, 4), true);
  assertEquals(v.is(reconstructed, 3), false); // not even
  assertEquals(v.is(reconstructed, -2), false); // not positive
});

Deno.test('AST - Document metadata', () => {
  const schema = v.string();

  const astDoc = schemaToAST(schema, {
    library: 'valibot',
    metadata: {
      author: 'Test Author',
      version: '1.0.0',
      customField: 'custom value',
    },
  });

  assertEquals(astDoc.library, 'valibot');
  assertEquals(astDoc.version, '1.0.0');
  assertExists(astDoc.metadata);
  assertEquals(astDoc.metadata!.author, 'Test Author');
  assertEquals(astDoc.metadata!.customField, 'custom value');
});

Deno.test('AST Async - Simple async schema', async () => {
  // Create async validation
  const checkUnique = async (value: string): Promise<boolean> => {
    // Simulate async check
    await new Promise(resolve => setTimeout(resolve, 10));
    return value !== 'taken';
  };

  // Create async schema
  const schema = v.pipeAsync(
    v.string(),
    v.checkAsync(checkUnique, 'Value is taken')
  );

  // Convert to AST with dictionary
  const validationDict = new Map();
  validationDict.set(checkUnique, 'check-unique');

  const astDoc = schemaToAST(schema, {
    validationDictionary: validationDict,
  });

  // Reconstruct with async support
  const implDict = new Map();
  implDict.set('check-unique', checkUnique);

  const reconstructed = astToSchemaAsync(JSON.parse(JSON.stringify(astDoc)), {
    validationDictionary: implDict,
  });

  // Test async validation
  const validResult = await v.safeParseAsync(reconstructed, 'available');
  assertEquals(validResult.success, true);

  const invalidResult = await v.safeParseAsync(reconstructed, 'taken');
  assertEquals(invalidResult.success, false);
});

Deno.test('AST Async - Async transformation', async () => {
  // Create async transformation
  const fetchUserData = async (userId: string): Promise<{ id: string; name: string }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 10));
    return { id: userId, name: `User ${userId}` };
  };

  // Create async schema
  const schema = v.pipeAsync(
    v.string(),
    v.transformAsync(fetchUserData)
  );

  // Convert to AST
  const transformDict = new Map();
  transformDict.set(fetchUserData, 'fetch-user-data');

  const astDoc = schemaToAST(schema, {
    transformationDictionary: transformDict,
  });

  // Reconstruct
  const implDict = new Map();
  implDict.set('fetch-user-data', fetchUserData);

  const reconstructed = astToSchemaAsync(JSON.parse(JSON.stringify(astDoc)), {
    transformationDictionary: implDict,
  });

  // Test async transformation
  const result = await v.safeParseAsync(reconstructed, '123');
  assertEquals(result.success, true);
  if (result.success) {
    const output = result.output as { id: string; name: string };
    assertEquals(output.id, '123');
    assertEquals(output.name, 'User 123');
  }
});

Deno.test('AST Async - Complex async schema', async () => {
  // Custom async operations
  const validateEmail = async (email: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    // Check for valid email format and not in blocklist
    const isValidFormat = email.includes('@') && email.includes('.');
    const isBlocked = email.startsWith('spam@') || email.startsWith('blocked@');
    return isValidFormat && !isBlocked;
  };

  const normalizeEmail = async (email: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    return email.toLowerCase().trim();
  };

  // Create complex async schema
  const schema = v.pipeAsync(
    v.string(),
    v.transformAsync(normalizeEmail),
    v.checkAsync(validateEmail, 'Invalid email')
  );

  // Convert to AST
  const dict = new Map();
  dict.set(validateEmail, 'validate-email');
  dict.set(normalizeEmail, 'normalize-email');

  const astDoc = schemaToAST(schema, {
    validationDictionary: dict,
    transformationDictionary: dict,
  });

  // Serialize and deserialize
  const json = JSON.stringify(astDoc);
  const parsed = JSON.parse(json);

  // Reconstruct
  const implDict = new Map();
  implDict.set('validate-email', validateEmail);
  implDict.set('normalize-email', normalizeEmail);

  const reconstructed = astToSchemaAsync(parsed, {
    validationDictionary: implDict,
    transformationDictionary: implDict,
  });

  // Test with valid email
  const validResult = await v.safeParseAsync(reconstructed, '  TEST@EXAMPLE.COM  ');
  assertEquals(validResult.success, true);
  if (validResult.success) {
    assertEquals(validResult.output, 'test@example.com');
  }

  // Test with blocked email (spam) - will be normalized to lowercase before validation
  const invalidResult = await v.safeParseAsync(reconstructed, '  SPAM@EXAMPLE.COM  ');
  assertEquals(invalidResult.success, false);
});

Deno.test('AST - File and Promise Schemas', () => {
  // File
  const fileSchema = v.file();
  const fileAst = schemaToAST(fileSchema);
  assertEquals(fileAst.schema.type, 'file');
  const fileRec = astToSchema(fileAst);
  assertEquals(fileRec.type, 'file');

  // Promise
  const promiseSchema = v.promise();
  const promiseAst = schemaToAST(promiseSchema);
  assertEquals(promiseAst.schema.type, 'promise');
  const promiseRec = astToSchema(promiseAst);
  assertEquals(promiseRec.type, 'promise');
});

Deno.test('AST - Extended Validations', () => {
  // Credit Card (existence check)
  const ccSchema = v.pipe(v.string(), v.creditCard());
  const ccRec = astToSchema(schemaToAST(ccSchema));
  assertEquals(v.is(ccRec, '4111 1111 1111 1111'), true);

  // Hex Color
  const hexSchema = v.pipe(v.string(), v.hexColor());
  const hexRec = astToSchema(schemaToAST(hexSchema));
  assertEquals(v.is(hexRec, '#ff0000'), true);

  // Empty
  const emptySchema = v.pipe(v.string(), v.empty());
  const emptyRec = astToSchema(schemaToAST(emptySchema));
  assertEquals(v.is(emptyRec, ''), true);

  // Slug
  const slugSchema = v.pipe(v.string(), v.slug());
  const slugRec = astToSchema(schemaToAST(slugSchema));
  assertEquals(v.is(slugRec, 'my-slug'), true);
});

Deno.test('AST Validation - Valid AST with validateAST option', () => {
  const schema = v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
  });

  const ast = schemaToAST(schema);

  // Should not throw with valid AST
  const reconstructed = astToSchema(ast, { validateAST: ASTDocumentSchema });
  assertEquals(v.is(reconstructed, { name: 'John', email: 'john@example.com' }), true);
});

Deno.test('AST Validation - Invalid AST throws with validateAST option', () => {
  const invalidAst = {
    version: '1.0.0',
    library: 'invalid_library', // Invalid library
    schema: {
      kind: 'schema',
      type: 'string',
    }
  } as any;

  let errorThrown = false;
  try {
    astToSchema(invalidAst, { validateAST: ASTDocumentSchema });
  } catch (e) {
    errorThrown = true;
    assertEquals((e as Error).message.includes('Invalid AST document structure'), true);
  }
  assertEquals(errorThrown, true);
});

Deno.test('AST Validation - Invalid AST passes without validateAST option', () => {
  const invalidAst = {
    version: '1.0.0',
    library: 'valibot',
    schema: {
      kind: 'schema',
      type: 'string',
    }
  } as any;

  // Should not throw when validateAST is false (default)
  const reconstructed = astToSchema(invalidAst, { strictLibraryCheck: true });
  assertEquals(reconstructed.type, 'string');
});

Deno.test('AST Validation Async - Valid AST with validateAST option', () => {
  const schema = v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
  });

  const ast = schemaToAST(schema);

  // Should not throw with valid AST
  const reconstructed = astToSchemaAsync(ast, { validateAST: ASTDocumentSchema });
  // Just verify it was created without errors
  assertEquals(reconstructed.type, 'object');
});

Deno.test('AST Validation Async - Invalid AST throws with validateAST option', () => {
  const invalidAst = {
    version: '1.0.0',
    library: 'invalid_library', // Invalid library
    schema: {
      kind: 'schema',
      type: 'string',
    }
  } as any;

  let errorThrown = false;
  try {
    astToSchemaAsync(invalidAst, { validateAST: ASTDocumentSchema });
  } catch (e) {
    errorThrown = true;
    assertEquals((e as Error).message.includes('Invalid AST document structure'), true);
  }
  assertEquals(errorThrown, true);
});
