# valibot-introspection

> Low-level introspection utilities for Valibot schemas - bundle-size optimized

> [!WARNING]
> **⚠️ Experimental Package ⚠️**: This package is currently available only via [pkg.pr.new](https://pkg.pr.new) and is intended as an experiment to be potentially included as an official Valibot package under the `@valibot/introspection` library.

## Overview

`valibot-introspection` provides a comprehensive set of utilities for runtime introspection of [Valibot](https://valibot.dev) schemas. It enables you to programmatically inspect, analyze, and extract information from your schemas with full TypeScript type safety.

This library is designed with bundle-size optimization in mind, offering tree-shakeable utilities that allow you to import only what you need.

## Installation

Since this package is not yet published to npm, you can install it via pkg.pr.new:

```bash
# Using pnpm
pnpm add https://pkg.pr.new/sandros94/open-circle-utils/valibot-introspection@main

# Using npm
npm install https://pkg.pr.new/sandros94/open-circle-utils/valibot-introspection@main

# Using yarn
yarn add https://pkg.pr.new/sandros94/open-circle-utils/valibot-introspection@main
```

## Features

- 🔍 **Schema Type Checking**: Determine the type of any Valibot schema at runtime
- 🎯 **Property Extraction**: Extract nested schemas, keys, values, and metadata
- 📦 **Tree-Shakeable**: Import only the utilities you need
- 🔒 **Fully Typed**: Complete TypeScript support with type inference
- ⚡ **Zero Runtime Overhead**: Pure functions with no side effects
- 🎨 **Comprehensive Coverage**: Supports all Valibot schema types

## API Categories

### Base Schemas

Check for primitive and basic schema types:

```typescript
import {
  isAnySchema,
  isBigintSchema,
  isBlobSchema,
  isBooleanSchema,
  isDateSchema,
  isNanSchema,
  isNeverSchema,
  isNullSchema,
  isNumberSchema,
  isStringSchema,
  isSymbolSchema,
  isUndefinedSchema,
  isUnknownSchema,
  isVoidSchema,
} from "valibot-introspection";
import * as v from "valibot";

const schema = v.string();

if (isStringSchema(schema)) {
  console.log("This is a string schema");
}
```

### Array Schemas

Inspect array and tuple schemas:

```typescript
import {
  isArraySchema,
  isTupleSchema,
  isTupleWithRestSchema,
  getArrayItem,
  getTupleItems,
  getTupleRest,
} from "valibot-introspection";
import * as v from "valibot";

// Array inspection
const arraySchema = v.array(v.string());
if (isArraySchema(arraySchema)) {
  const itemSchema = getArrayItem(arraySchema);
  // itemSchema is the string() schema
}

// Tuple inspection
const tupleSchema = v.tuple([v.string(), v.number(), v.boolean()]);
if (isTupleSchema(tupleSchema)) {
  const items = getTupleItems(tupleSchema);
  // items is an array of schemas: [string(), number(), boolean()]
}

// Tuple with rest
const tupleWithRestSchema = v.tupleWithRest(
  [v.string(), v.number()],
  v.boolean(),
);
if (isTupleWithRestSchema(tupleWithRestSchema)) {
  const items = getTupleItems(tupleWithRestSchema);
  const rest = getTupleRest(tupleWithRestSchema);
  // rest is the boolean() schema
}
```

### Object Schemas

Work with object schemas and their properties:

```typescript
import {
  isObjectSchema,
  isObjectWithRestSchema,
  getObjectEntries,
  getObjectEntry,
  getObjectFields,
  getObjectField,
  getObjectRest,
} from "valibot-introspection";
import * as v from "valibot";

const userSchema = v.object({
  name: v.string(),
  age: v.number(),
  email: v.pipe(v.string(), v.email()),
});

if (isObjectSchema(userSchema)) {
  // Get all entries as [key, schema][] tuple
  const entries = getObjectEntries(userSchema);
  // [['name', string()], ['age', number()], ['email', ...]]

  // Get a specific entry
  const nameSchema = getObjectEntry(userSchema, "name");
  // nameSchema is the string() schema with full type inference

  // Get fields with metadata
  const fields = getObjectFields(userSchema);
  // [{ key: 'name', schema: string() }, { key: 'age', schema: number() }, ...]

  // Get a specific field
  const emailField = getObjectField(userSchema, "email");
  // { key: 'email', schema: ... }
}

// Object with rest
const flexibleSchema = v.objectWithRest({ name: v.string() }, v.number());

if (isObjectWithRestSchema(flexibleSchema)) {
  const rest = getObjectRest(flexibleSchema);
  // rest is the number() schema
}
```

### Choice Schemas

Inspect union, variant, enum, and picklist schemas:

```typescript
import {
  isUnionSchema,
  isVariantSchema,
  isEnumSchema,
  isPicklistSchema,
  getUnionOptions,
  getVariantKey,
  getVariantOptions,
  getEnumOptions,
  getPicklistOptions,
} from "valibot-introspection";
import * as v from "valibot";

// Union
const unionSchema = v.union([v.string(), v.number(), v.boolean()]);
if (isUnionSchema(unionSchema)) {
  const options = getUnionOptions(unionSchema);
  // [string(), number(), boolean()]
}

// Variant (discriminated union)
const variantSchema = v.variant("type", [
  v.object({ type: v.literal("a"), value: v.string() }),
  v.object({ type: v.literal("b"), value: v.number() }),
]);

if (isVariantSchema(variantSchema)) {
  const key = getVariantKey(variantSchema);
  // 'type'
  const options = getVariantOptions(variantSchema);
  // Array of object schemas
}

// Enum
enum Status {
  Active = "active",
  Inactive = "inactive",
}
const enumSchema = v.enum(Status);

if (isEnumSchema(enumSchema)) {
  const enumObj = getEnumOptions(enumSchema);
  // Status enum object
}

// Picklist
const picklistSchema = v.picklist(["red", "green", "blue"]);
if (isPicklistSchema(picklistSchema)) {
  const options = getPicklistOptions(picklistSchema);
  // ['red', 'green', 'blue']
}
```

### Record Schemas

Extract key and value schemas from records:

```typescript
import {
  isRecordSchema,
  getRecordKey,
  getRecordValue,
} from "valibot-introspection";
import * as v from "valibot";

const recordSchema = v.record(v.string(), v.number());

if (isRecordSchema(recordSchema)) {
  const keySchema = getRecordKey(recordSchema);
  // string() schema

  const valueSchema = getRecordValue(recordSchema);
  // number() schema
}

// With complex key types
const strictRecordSchema = v.record(
  v.picklist(["a", "b", "c"]),
  v.object({ value: v.number() }),
);

const keySchema = getRecordKey(strictRecordSchema);
// picklist(['a', 'b', 'c']) schema
```

### Literal Schemas

Extract literal values:

```typescript
import { isLiteralSchema, getLiteralValue } from "valibot-introspection";
import * as v from "valibot";

const literalSchema = v.literal("success");

if (isLiteralSchema(literalSchema)) {
  const value = getLiteralValue(literalSchema);
  // 'success' (with type inference: 'success')
}

// Works with any literal type
const numLiteral = v.literal(42);
const numValue = getLiteralValue(numLiteral); // 42

const boolLiteral = v.literal(true);
const boolValue = getLiteralValue(boolLiteral); // true
```

### Lazy Schemas

Work with lazy (recursive) schemas:

```typescript
import { isLazySchema, getLazyGetter } from "valibot-introspection";
import * as v from "valibot";

type Node = {
  value: string;
  children: Node[];
};

const nodeSchema: v.GenericSchema<Node> = v.object({
  value: v.string(),
  children: v.array(v.lazy(() => nodeSchema)),
});

const childrenSchema = nodeSchema.entries.children;

if (isArraySchema(childrenSchema)) {
  const itemSchema = getArrayItem(childrenSchema);

  if (isLazySchema(itemSchema)) {
    const getter = getLazyGetter(itemSchema);
    // getter is the function that returns the schema
    const resolvedSchema = getter();
    // resolvedSchema is the nodeSchema
  }
}
```

### Wrapped Schemas

Detect and deeply unwrap optional, nullable, and nullish schemas, providing insights on their default value, required and nullable properties:

```typescript
import { isWrappedSchema, getWrappedSchema } from "valibot-introspection";
import * as v from "valibot";

const optionalSchema = v.optional(v.string());

if (isWrappedSchema(optionalSchema)) {
  const wrapped = getWrappedSchema(optionalSchema);
  // wrapped.wasWrapped === true // if false, the original schema is returned
  // wrapped.schema is the string() schema
  // wrapped.required === false
  // wrapped.nullable === false
  // wrapped.defaultValue === undefined
}

// Works with all wrapper types
const nullableSchema = v.nullable(v.number());
const nullishSchema = v.nullish(v.boolean());
const nonOptionalSchema = v.nonOptional(v.optional(v.string()));

// All return true
isWrappedSchema(nullableSchema);
isWrappedSchema(nullishSchema);
isWrappedSchema(nonOptionalSchema);
```

### Pipe Inspection

Check and extract pipe actions:

```typescript
import { hasPipe, getPipe } from "valibot-introspection";
import * as v from "valibot";

const emailSchema = v.pipe(v.string(), v.email(), v.maxLength(100));

if (hasPipe(emailSchema)) {
  const pipe = getPipe(emailSchema);
  // pipe is an array of actions: [email(), maxLength(100)]
}
```

### Schema Information

Extract metadata, title, description, and examples:

```typescript
import { getSchemaInfo } from "valibot-introspection";
import * as v from "valibot";

const userSchema = v.pipe(
  v.object({
    name: v.string(),
    email: v.string(),
  }),
  v.title("User"),
  v.description("A user object with name and email"),
  v.metadata({ version: "1.0" }),
);

const info = getSchemaInfo(userSchema);
// {
//   title: 'User',
//   description: 'A user object with name and email',
//   examples: undefined,
//   metadata: { version: '1.0' }
// }
```

### Special Schemas

Work with specialized schema types:

```typescript
import {
  isIntersectSchema,
  isInstanceSchema,
  isMapSchema,
  isSetSchema,
  isFunctionSchema,
  getIntersectOptions,
  getInstanceClass,
  getMapKey,
  getMapValue,
  getSetValue,
} from "valibot-introspection";
import * as v from "valibot";

// Intersect
const intersectSchema = v.intersect([
  v.object({ a: v.string() }),
  v.object({ b: v.number() }),
]);

if (isIntersectSchema(intersectSchema)) {
  const options = getIntersectOptions(intersectSchema);
  // Array of schemas to intersect
}

// Instance
const dateSchema = v.instance(Date);
if (isInstanceSchema(dateSchema)) {
  const cls = getInstanceClass(dateSchema);
  // Date constructor
}

// Map
const mapSchema = v.map(v.string(), v.number());
if (isMapSchema(mapSchema)) {
  const keySchema = getMapKey(mapSchema);
  const valueSchema = getMapValue(mapSchema);
}

// Set
const setSchema = v.set(v.string());
if (isSetSchema(setSchema)) {
  const valueSchema = getSetValue(setSchema);
}

// Function
const fnSchema = v.function();
if (isFunctionSchema(fnSchema)) {
  console.log("This is a function schema");
}
```

## Advanced Use Cases

### Dynamic Form Generation

```typescript
import * as v from "valibot";
import {
  isObjectSchema,
  getObjectFields,
  isStringSchema,
  isNumberSchema,
  isBooleanSchema,
  hasPipe,
  getPipe,
} from "valibot-introspection";

function generateFormFields(schema: v.GenericSchema) {
  if (!isObjectSchema(schema)) {
    throw new Error("Expected object schema");
  }

  const fields = getObjectFields(schema);

  return fields?.map(({ key, schema: fieldSchema }) => {
    let type = "text";

    if (isStringSchema(fieldSchema)) {
      type = "text";

      // Check for email validation
      if (hasPipe(fieldSchema)) {
        const pipe = getPipe(fieldSchema);
        if (pipe?.some((action) => action.type === "email")) {
          type = "email";
        }
      }
    } else if (isNumberSchema(fieldSchema)) {
      type = "number";
    } else if (isBooleanSchema(fieldSchema)) {
      type = "checkbox";
    }

    return {
      name: key,
      type,
      required: !isWrappedSchema(fieldSchema),
    };
  });
}

const userSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  age: v.number(),
  newsletter: v.optional(v.boolean()),
});

const formFields = generateFormFields(userSchema);
// [
//   { name: 'name', type: 'text', required: true },
//   { name: 'email', type: 'email', required: true },
//   { name: 'age', type: 'number', required: true },
//   { name: 'newsletter', type: 'checkbox', required: false },
// ]
```

### Schema Documentation Generator

```typescript
import * as v from "valibot";
import {
  isObjectSchema,
  getObjectFields,
  getSchemaInfo,
} from "valibot-introspection";

function generateDocs(schema: v.GenericSchema) {
  const info = getSchemaInfo(schema);
  let docs = "";

  if (info.title) {
    docs += `# ${info.title}\n\n`;
  }

  if (info.description) {
    docs += `${info.description}\n\n`;
  }

  if (isObjectSchema(schema)) {
    docs += "## Properties\n\n";
    const fields = getObjectFields(schema);

    fields?.forEach(({ key, schema: fieldSchema }) => {
      const fieldInfo = getSchemaInfo(fieldSchema);
      docs += `- **${key}**`;
      if (fieldInfo.description) {
        docs += `: ${fieldInfo.description}`;
      }
      docs += "\n";
    });
  }

  return docs;
}
```

### Runtime Schema Validation

```typescript
import * as v from "valibot";
import {
  isObjectSchema,
  getObjectEntry,
  isStringSchema,
} from "valibot-introspection";

function hasRequiredStringField(
  schema: v.GenericSchema,
  fieldName: string,
): boolean {
  if (!isObjectSchema(schema)) {
    return false;
  }

  const fieldSchema = getObjectEntry(schema, fieldName);
  if (!fieldSchema) {
    return false;
  }

  return isStringSchema(fieldSchema);
}
```

## Type Safety

All functions provide complete type inference and type guards:

```typescript
import * as v from "valibot";
import {
  isStringSchema,
  isObjectSchema,
  getObjectEntry,
} from "valibot-introspection";

const schema = v.object({
  name: v.string(),
  age: v.number(),
});

// Type guard narrows the type
if (isObjectSchema(schema)) {
  // TypeScript knows schema is an object schema here
  const nameSchema = getObjectEntry(schema, "name");

  if (nameSchema && isStringSchema(nameSchema)) {
    // TypeScript knows nameSchema is a string schema
    // nameSchema.type === 'string' is type-safe
  }
}

// Return types are properly inferred
const maybeString = getObjectEntry(schema, "name");
// Type: StringSchema | null (with proper type inference)

const maybeAge = getObjectEntry(schema, "age");
// Type: NumberSchema | null (with proper type inference)
```

## Performance

All utilities are:

- **Pure functions** with no side effects (marked with `@__NO_SIDE_EFFECTS__`)
- **Tree-shakeable** - only bundled functions are included
- **Zero runtime overhead** - simple property checks and extractions
- **Optimized for bundle size** - modular design allows importing only what you need

## Contributing

This is an experimental package intended for potential inclusion in the official Valibot ecosystem. Feedback, suggestions, and contributions are welcome!

## License

MIT

## Related

- [Valibot](https://valibot.dev) - The modular and type-safe schema library
- [valibot-ast](../valibot-ast) - AST generation from Valibot schemas

---

**Note**: This package is experimental and the API may change. It is not recommended for production use until it becomes an official Valibot package.
