# valibot-ast

> AST (Abstract Syntax Tree) utilities for Valibot schemas - serialization and reconstruction

> [!WARNING]
> **⚠️ Experimental Package ⚠️**: This package is currently available only via [pkg.pr.new](https://pkg.pr.new) and is intended as an experiment to be potentially included as an official Valibot package under the `@valibot/ast` library.

## Overview

`valibot-ast` provides bidirectional conversion between [Valibot](https://valibot.dev) schemas and JSON-serializable AST (Abstract Syntax Tree) representations. This enables powerful use cases like schema persistence, code generation, schema migration, and cross-platform schema sharing.

Built on top of [`valibot-introspection`](../valibot-introspection), this library combines low-level schema inspection with high-level serialization capabilities.

## Installation

Since this package is not yet published to npm, you can install it via pkg.pr.new:

```bash
# Using pnpm
pnpm add https://pkg.pr.new/sandros94/open-circle-utils/valibot-ast@main

# Using npm
npm install https://pkg.pr.new/sandros94/open-circle-utils/valibot-ast@main

# Using yarn
yarn add https://pkg.pr.new/sandros94/open-circle-utils/valibot-ast@main
```

## Features

- 🔄 **Bidirectional Conversion**: Convert schemas to AST and back without loss of information
- 📦 **JSON Serializable**: Store schemas in databases, files, or transmit over networks
- 🎨 **Library Agnostic Design**: AST format designed to potentially support Zod, ArkType, and other libraries
- 🔧 **Custom Operations Support**: Handle custom validations and transformations via dictionaries
- ⚡ **Async Schema Support**: Full support for both sync and async schemas
- 🔒 **Fully Typed**: Complete TypeScript support with type inference
- ✅ **Schema Validation**: Validate AST documents against a Valibot schema before conversion (optional)
- 📚 **Comprehensive**: Supports all Valibot schema types and features

## Use Cases

### When to Use valibot-ast

- **Schema Persistence**: Store validation schemas in databases or configuration files
- **Code Generation**: Generate TypeScript types, documentation, or form UIs from stored schemas
- **Visual Schema Builders**: Build tools that let users create schemas via drag-and-drop
- **Schema Analytics**: Analyze schema complexity, field usage, and validation rules
- **Configuration Management**: Store and manage validation rules centrally

### When to Use valibot-introspection Directly

While `valibot-ast` is built on top of `valibot-introspection`, there are cases where using the introspection utilities directly is more appropriate:

- **Runtime Schema Inspection**: When you need to inspect schemas at runtime without serialization
- **Dynamic Form Generation**: Generating forms and states directly from schemas without intermediate AST
- **Performance-Critical Paths**: When avoiding the AST conversion overhead is important
- **Partial Schema Analysis**: When you only need specific information (e.g., checking if a field is optional)
- **Custom Introspection Logic**: Building custom tools that need fine-grained control over schema inspection
- **In-Memory Schema Manipulation**: Working with schemas programmatically without persistence needs

See the [valibot-introspection documentation](../valibot-introspection) for low-level introspection utilities.

## Quick Start

### Basic Schema to AST Conversion

```typescript
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";

// Create a Valibot schema
const userSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  age: v.number(),
  role: v.optional(v.picklist(["admin", "user", "guest"])),
});

// Convert to AST
const astDocument = schemaToAST(userSchema);

// Serialize to JSON
const json = JSON.stringify(astDocument, null, 2);
console.log(json);
```

Output:

```json
{
  "version": "1.0.0",
  "library": "valibot",
  "schema": {
    "kind": "schema",
    "type": "object",
    "async": false,
    "entries": {
      "name": {
        "kind": "schema",
        "type": "string",
        "async": false
      },
      "email": {
        "kind": "schema",
        "type": "string",
        "async": false,
        "pipe": [
          {
            "kind": "schema",
            "type": "string",
            "async": false
          },
          {
            "kind": "validation",
            "type": "email",
            "async": false,
            "expects": null,
            "requirement": {}
          }
        ]
      },
      "age": {
        "kind": "schema",
        "type": "number",
        "async": false
      },
      "role": {
        "kind": "schema",
        "type": "optional",
        "async": false,
        "wrapped": {
          "kind": "schema",
          "type": "picklist",
          "async": false,
          "options": ["admin", "user", "guest"]
        }
      }
    }
  }
}
```

### Reconstructing Schemas from AST

```typescript
import { astToSchema } from "valibot-ast";

// Parse JSON back to AST document
const parsedAST = JSON.parse(json);

// Reconstruct the Valibot schema
const reconstructedSchema = astToSchema(parsedAST);

// Use the schema for validation
const result = v.safeParse(reconstructedSchema, {
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  role: "admin",
});

console.log(result.success); // true
```

## API Reference

### Core Functions

#### `schemaToAST(schema, options?)`

Convert a Valibot schema to its AST document representation.

```typescript
import { schemaToAST } from "valibot-ast";
import * as v from "valibot";

const schema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  created: v.date(),
});

const ast = schemaToAST(schema, {
  metadata: {
    version: "1.0",
    author: "Your Name",
  },
});
```

**Options:**

- `transformationDictionary?: Map<any, string>` - Map custom transformations to unique keys
- `validationDictionary?: Map<any, string>` - Map custom validations to unique keys
- `library?: ValidationLibrary` - Override library name (default: 'valibot')
- `metadata?: Record<string, unknown>` - Additional document metadata

#### `astToSchema(astDocument, options?)`

Convert an AST document back to a Valibot schema (sync only).

```typescript
import { astToSchema } from "valibot-ast";

const schema = astToSchema(astDocument, {
  validateAST: true, // Validate AST structure before conversion
  strictLibraryCheck: true, // Ensure library is 'valibot'
});
```

**Options:**

- `transformationDictionary?: Map<string, (input: any) => any>` - Custom transformation implementations
- `validationDictionary?: Map<string, (input: any) => boolean>` - Custom validation implementations
- `strictLibraryCheck?: boolean` - Throw error if library !== 'valibot' (default: true)
- `validateAST?: GenericSchema` - Validate AST structure before conversion

#### `astToSchemaAsync(astDocument, options?)`

Convert an AST document back to a Valibot schema (supports async schemas).

```typescript
import { astToSchemaAsync } from "valibot-ast";

const asyncSchema = astToSchemaAsync(astDocument);
```

Accepts the same options as `astToSchema`.

## Advanced Usage

### Schema with Metadata

```typescript
import * as v from "valibot";
import { schemaToAST, astToSchema } from "valibot-ast";

const productSchema = v.pipe(
  v.object({
    name: v.string(),
    price: v.number(),
    sku: v.string(),
  }),
  v.title("Product"),
  v.description("A product in the catalog"),
  v.metadata({ category: "e-commerce" }),
);

const ast = schemaToAST(productSchema);

// AST includes title, description, and metadata
console.log(ast.schema.info?.title); // 'Product'
console.log(ast.schema.info?.description); // 'A product in the catalog'
console.log(ast.schema.info?.metadata?.category); // 'e-commerce'

// Reconstruct with metadata preserved
const reconstructed = astToSchema(ast);
```

### Complex Nested Schemas

```typescript
import * as v from "valibot";
import { schemaToAST, astToSchema } from "valibot-ast";

const addressSchema = v.object({
  street: v.string(),
  city: v.string(),
  country: v.picklist(["US", "CA", "UK", "DE"]),
  zipCode: v.pipe(v.string(), v.regex(/^\d{5}$/)),
});

const companySchema = v.object({
  name: v.string(),
  employees: v.array(
    v.object({
      id: v.pipe(v.string(), v.uuid()),
      name: v.string(),
      email: v.pipe(v.string(), v.email()),
      department: v.picklist(["engineering", "sales", "marketing"]),
      address: v.optional(addressSchema),
    }),
  ),
  headquarters: addressSchema,
  metadata: v.record(v.string(), v.unknown()),
});

// Convert complex nested schema to AST
const ast = schemaToAST(companySchema);

// Serialize and store
localStorage.setItem("companySchema", JSON.stringify(ast));

// Later, retrieve and reconstruct
const stored = JSON.parse(localStorage.getItem("companySchema")!);
const schema = astToSchema(stored);
```

### Union and Variant Schemas

```typescript
import * as v from "valibot";
import { schemaToAST, astToSchema } from "valibot-ast";

// Union schema
const resultSchema = v.union([
  v.object({ success: v.literal(true), data: v.string() }),
  v.object({ success: v.literal(false), error: v.string() }),
]);

const unionAst = schemaToAST(resultSchema);

// Variant (discriminated union) schema
const eventSchema = v.variant("type", [
  v.object({ type: v.literal("click"), x: v.number(), y: v.number() }),
  v.object({ type: v.literal("scroll"), delta: v.number() }),
  v.object({ type: v.literal("keypress"), key: v.string() }),
]);

const variantAst = schemaToAST(eventSchema);

// Both can be reconstructed
const reconstructedResult = astToSchema(unionAst);
const reconstructedEvent = astToSchema(variantAst);
```

### Tuples and Arrays

```typescript
import * as v from "valibot";
import { schemaToAST, astToSchema } from "valibot-ast";

// Array schema
const tagsSchema = v.array(v.string());

// Tuple schema
const coordinatesSchema = v.tuple([v.number(), v.number()]);

// Tuple with rest
const csvRowSchema = v.tupleWithRest(
  [v.string(), v.string()], // First two columns are required
  v.string(), // Rest are optional strings
);

const ast = schemaToAST(csvRowSchema);
// AST preserves tuple structure with items and rest
```

### Custom Validations and Transformations

For operations that can't be automatically serialized (custom business logic), use dictionaries:

```typescript
import * as v from "valibot";
import { schemaToAST, astToSchema } from "valibot-ast";

// Define custom operations
const trimAndUppercase = (input: string) => input.trim().toUpperCase();
const isValidCompanyCode = (input: string) => /^[A-Z]{3}\d{3}$/.test(input);

// Create schema using custom operations
const companyCodeSchema = v.pipe(
  v.string(),
  v.transform(trimAndUppercase),
  v.check(isValidCompanyCode, "Invalid company code format"),
);

// Map operations to unique keys for serialization
const transformDict = new Map();
transformDict.set(trimAndUppercase, "trim-uppercase");

const validationDict = new Map();
validationDict.set(isValidCompanyCode, "company-code-format");

// Convert to AST with dictionaries
const ast = schemaToAST(companyCodeSchema, {
  transformationDictionary: transformDict,
  validationDictionary: validationDict,
});

// AST includes custom operation metadata
console.log(ast.customTransformations);
// { "trim-uppercase": { name: "trim-uppercase", transformationType: "custom" } }

// Serialize to JSON
const json = JSON.stringify(ast);

// Later, reconstruct with implementations
const parsedAst = JSON.parse(json);

const transformImpl = new Map();
transformImpl.set("trim-uppercase", (input: string) =>
  input.trim().toUpperCase(),
);

const validationImpl = new Map();
validationImpl.set("company-code-format", (input: string) =>
  /^[A-Z]{3}\d{3}$/.test(input),
);

const reconstructed = astToSchema(parsedAst, {
  transformationDictionary: transformImpl,
  validationDictionary: validationImpl,
});
```

For detailed information about custom dictionaries, see [CUSTOM_DICTIONARIES.md](./src/CUSTOM_DICTIONARIES.md).

### AST Validation

Validate AST documents before conversion to catch structural errors:

```typescript
import { astToSchema, ASTDocumentSchema } from "valibot-ast";
import * as v from "valibot";

// Method 1: Use the built-in validation option
try {
  const schema = astToSchema(astDocument, {
    validateAST: ASTDocumentSchema,
  });
} catch (error) {
  console.error("Invalid AST structure:", error);
}

// Method 2: Validate separately
const result = v.safeParse(ASTDocumentSchema, astDocument);
if (result.success) {
  const schema = astToSchema(result.output);
} else {
  console.error("Validation errors:", v.flatten(result.issues));
}
```

## Real-World Examples

### Schema Versioning and Migration

```typescript
import * as v from "valibot";
import { schemaToAST, astToSchema } from "valibot-ast";

// Version 1.0 schema
const userSchemaV1 = v.object({
  name: v.string(),
  email: v.string(),
});

// Save to database
const astV1 = schemaToAST(userSchemaV1, {
  metadata: { version: "1.0", createdAt: new Date().toISOString() },
});
await db.schemas.insert({ name: "user", ast: astV1 });

// Version 2.0 schema with new fields
const userSchemaV2 = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  role: v.optional(v.picklist(["admin", "user"])),
  createdAt: v.date(),
});

// Save new version
const astV2 = schemaToAST(userSchemaV2, {
  metadata: { version: "2.0", createdAt: new Date().toISOString() },
});
await db.schemas.insert({ name: "user", ast: astV2 });

// Load and use specific version
const storedAst = await db.schemas.findOne({ name: "user", version: "1.0" });
const schema = astToSchema(storedAst.ast);
```

### API Documentation Generator

```typescript
import * as v from "valibot";
import { type ASTNode, schemaToAST } from "valibot-ast";

function generateAPIDoc(schema: v.GenericSchema) {
  const ast = schemaToAST(schema);

  function nodeToMarkdown(node: ASTNode, depth = 0): string {
    const indent = "  ".repeat(depth);
    let doc = "";

    if (node.kind === "schema") {
      doc += `${indent}- **Type**: ${node.type}\n`;

      if (node.info?.description) {
        doc += `${indent}  *${node.info.description}*\n`;
      }

      if ("entries" in node && node.entries) {
        doc += `${indent}  **Properties**:\n`;
        for (const [key, value] of Object.entries(node.entries)) {
          doc += `${indent}    - \`${key}\`:\n`;
          doc += nodeToMarkdown(value, depth + 3);
        }
      }

      if ("pipe" in node && node.pipe) {
        const validations = node.pipe
          .filter((p) => p.kind === "validation")
          .map((p) => p.type)
          .join(", ");
        if (validations) {
          doc += `${indent}  **Validations**: ${validations}\n`;
        }
      }
    }

    return doc;
  }

  return nodeToMarkdown(ast.schema);
}

const apiSchema = v.pipe(
  v.object({
    endpoint: v.pipe(v.string(), v.url()),
    method: v.picklist(["GET", "POST", "PUT", "DELETE"]),
    body: v.optional(v.record(v.string(), v.unknown())),
  }),
  v.description("API endpoint configuration"),
);

console.log(generateAPIDoc(apiSchema));
```

### Dynamic Form Builder

```typescript
import * as v from "valibot";
import { type ASTNode, schemaToAST } from "valibot-ast";

interface FormField {
  name: string;
  type: "text" | "email" | "number" | "select" | "checkbox";
  label: string;
  required: boolean;
  options?: string[];
  validations?: string[];
}

function generateFormFields(schema: v.GenericSchema): FormField[] {
  const ast = schemaToAST(schema);

  if (ast.schema.kind !== "schema" || ast.schema.type !== "object") {
    throw new Error("Expected object schema");
  }

  const fields: FormField[] = [];

  if ("entries" in ast.schema && ast.schema.entries) {
    for (const [key, node] of Object.entries(ast.schema.entries)) {
      const field: FormField = {
        name: key,
        type: "text",
        label: node.info?.title || key,
        required: node.type !== "optional",
      };

      // Unwrap optional/nullable
      let innerNode = node;
      if (node.type === "optional" || node.type === "nullable") {
        if ("wrapped" in node) {
          innerNode = node.wrapped as ASTNode;
        }
      }

      // Determine field type
      if (innerNode.type === "string") {
        field.type = "text";

        // Check for email validation
        if ("pipe" in innerNode && innerNode.pipe) {
          const hasEmail = innerNode.pipe.some(
            (p) => p.kind === "validation" && p.type === "email",
          );
          if (hasEmail) field.type = "email";
        }
      } else if (innerNode.type === "number") {
        field.type = "number";
      } else if (innerNode.type === "boolean") {
        field.type = "checkbox";
      } else if (innerNode.type === "picklist") {
        field.type = "select";
        if ("options" in innerNode) {
          field.options = innerNode.options as string[];
        }
      }

      // Extract validations
      if ("pipe" in innerNode && innerNode.pipe) {
        field.validations = innerNode.pipe
          .filter((p) => p.kind === "validation")
          .map((p) => p.type);
      }

      fields.push(field);
    }
  }

  return fields;
}

const registrationSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
  role: v.picklist(["user", "admin", "moderator"]),
  newsletter: v.optional(v.boolean()),
});

const formFields = generateFormFields(registrationSchema);
console.log(formFields);
// [
//   { name: 'email', type: 'email', label: 'email', required: true, validations: ['email'] },
//   { name: 'password', type: 'text', label: 'password', required: true, validations: ['minLength'] },
//   { name: 'role', type: 'select', label: 'role', required: true, options: [...] },
//   { name: 'newsletter', type: 'checkbox', label: 'newsletter', required: false },
// ]
```

## Type Safety

The AST types are fully typed and provide complete type inference:

```typescript
import type { ASTDocument, ASTNode } from "valibot-ast";

const ast: ASTDocument = {
  version: "1.0.0",
  library: "valibot",
  schema: {
    kind: "schema",
    type: "string",
    async: false,
  },
};

// TypeScript ensures structure is valid
function processAST(node: ASTNode) {
  if (node.kind === "schema") {
    console.log(`Schema type: ${node.type}`);

    if ("entries" in node && node.type === "object") {
      // TypeScript knows entries exists here
      for (const [key, value] of Object.entries(node.entries)) {
        processAST(value);
      }
    }
  }
}
```

## AST Document Structure

The AST document follows this structure:

```typescript
interface ASTDocument {
  version: string; // AST specification version
  library: string; // Source library (e.g., 'valibot')
  schema: ASTNode; // Root schema node
  customTransformations?: Record<string, CustomTransformationMeta>;
  customValidations?: Record<string, CustomValidationMeta>;
  metadata?: Record<string, unknown>; // Additional metadata
}
```

Each `ASTNode` has:

- `kind`: Type of node ('schema', 'validation', 'transformation', 'metadata')
- `type`: Specific type (e.g., 'string', 'object', 'email')
- `async`: Whether the schema is async
- Additional type-specific properties (e.g., `entries` for objects, `item` for arrays)

## Performance

- **Lightweight**: AST conversion is fast and memory-efficient
- **Tree-Shakeable**: Only imported functions are bundled
- **JSON-Friendly**: AST is optimized for JSON serialization
- **Built on valibot-introspection**: Leverages optimized low-level utilities

## Limitations

- **Lazy Schemas**: Recursive schemas using `v.lazy()` include a note but cannot serialize the getter function
- **Custom Functions**: Custom validations and transformations require dictionaries for serialization
- **Function Schemas**: While supported, function schemas have limited AST representation
- **Library-Specific**: Currently optimized for Valibot (Zod/ArkType support planned)

## Contributing

This is an experimental package intended for potential inclusion in the official Valibot ecosystem. Feedback, suggestions, and contributions are welcome!

## License

MIT

## Related

- [Valibot](https://valibot.dev) - The modular and type-safe schema library
- [valibot-introspection](../valibot-introspection) - Low-level introspection utilities for Valibot schemas

---

**Note**: This package is experimental and the API may change. It is not recommended for production use until it becomes an official Valibot package.
