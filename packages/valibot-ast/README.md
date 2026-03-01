# valibot-ast

> AST (Abstract Syntax Tree) utilities for Valibot schemas — serialization and reconstruction

> [!WARNING]
> **⚠️ Experimental Package ⚠️**: Intended as an experiment toward a potential official Valibot package under `@valibot/ast`.

## Overview

`valibot-ast` provides bidirectional conversion between [Valibot](https://valibot.dev) schemas and JSON-serializable AST documents. Use it for schema persistence, code generation, visual schema builders, and cross-platform schema sharing.

Two entry points are available:

| Entry | Purpose |
|-------|---------|
| `valibot-ast` | Core serialization/deserialization functions |
| `valibot-ast/utils` | Type-safe runtime introspection helpers |

## Installation

```bash
# pnpm
pnpm add valibot-ast

# npm
npm install valibot-ast

# yarn
yarn add valibot-ast
```

> [!TIP]
> Continuous releases are also available via [pkg.pr.new](https://pkg.pr.new):
> ```bash
> pnpm add https://pkg.pr.new/valibot-ast@main
> ```

## Quick Start

```typescript
import * as v from "valibot";
import { schemaToAST, astToSchema } from "valibot-ast";

const userSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.number()),
});

// Schema → JSON-serializable AST
const { document } = schemaToAST(userSchema);
const json = JSON.stringify(document);

// JSON → Schema (round-trip)
const parsed = JSON.parse(json);
const rebuilt = astToSchema<v.GenericSchema>(parsed);

v.parse(rebuilt, { name: "Alice", email: "alice@example.com" });
```

## API Reference

### Core functions (`valibot-ast`)

#### `schemaToAST(schema, options?)`

Serializes a Valibot schema to an `ASTDocument`.

```typescript
import { schemaToAST, createDictionary } from "valibot-ast";
import * as v from "valibot";

const myTransform = (s: string) => s.trim();
const myCheck   = (s: string) => s.length > 0;

const schema = v.pipe(
  v.string(),
  v.transform(myTransform),
  v.check(myCheck, "must not be empty"),
);

const dictionary = createDictionary({
  "my-transform": myTransform,
  "my-check":     myCheck,
});

const { document } = schemaToAST(schema, { dictionary });
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `dictionary` | `DictionaryMap` | Maps string keys to custom functions/classes/lazy getters |
| `metadata` | `Record<string, unknown>` | Arbitrary document-level metadata |

**Returns:** `SchemaToASTResult` — an object with:
- `document: ASTDocument` — the serializable AST document
- `referencedDictionary: DictionaryMap` — only the dictionary entries actually referenced during serialization

---

#### `astToSchema<T>(astDocument, options?)`

Deserializes an `ASTDocument` back to a Valibot schema. Generic — pin the return type to avoid casts.

```typescript
import { astToSchema } from "valibot-ast";
import * as v from "valibot";

// Sync schema (default inference)
const schema = astToSchema<v.GenericSchema>(parsed);

// Async schema (when the AST contains async nodes)
const asyncSchema = astToSchema<v.GenericSchemaAsync>(parsed, { dictionary });

// Validate AST structure before conversion
const safe = astToSchema(parsed, { validateAST: true });
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `dictionary` | `DictionaryMap` | Same map used during serialization |
| `validateAST` | `boolean` | Validate the AST document structure before deserializing |
| `strictLibraryCheck` | `boolean` | Throw if `document.library` is not `"valibot"` |

> The function is async-aware: when `ast.async === true` it automatically emits `v.objectAsync`, `v.arrayAsync`, `v.pipeAsync`, `v.checkAsync`, `v.transformAsync`, etc.

---

#### `createDictionary(entries)`

Creates a `DictionaryMap` from a plain object. Accepts class constructors, plain functions, and lazy schema getters.

```typescript
import { createDictionary } from "valibot-ast";

const dictionary = createDictionary({
  MyClass:         MyClass,              // class constructor
  "validate-slug": isValidSlug,          // validation function
  "trim-lower":    (s: string) => s.trim().toLowerCase(), // transformation
  "lazy-node":     () => someSchema,     // lazy schema getter
});
```

---

#### `ASTDocumentSchema`

A Valibot schema for validating `ASTDocument` objects. Pass it to `astToSchema`'s `validateAST` option to catch structural errors early.

```typescript
import { astToSchema, ASTDocumentSchema } from "valibot-ast";
import * as v from "valibot";

const result = v.safeParse(ASTDocumentSchema, untrustedAst);
if (result.success) {
  const schema = astToSchema(result.output);
}
```

---

### Constants (`valibot-ast`)

- `AST_VERSION` — `"1.0.0"`, the current AST specification version

### Types (`valibot-ast`)

```typescript
import type {
  ASTDocument,        // Top-level serialized document
  ASTNode,            // Union of all AST node types
  DictionaryMap,      // Map<string, Class | Function | LazyGetter>
  DictionaryValue,    // Class | Function | (() => GenericSchema | GenericSchemaAsync)
  DictionaryEntryMeta,// Metadata for dictionary manifest entries
  SchemaToASTOptions,
  SchemaToASTResult,
  ASTToSchemaOptions,
  SchemaInfoAST,      // Serialized schema info (title, description, etc.)
  SerializedBigInt,   // { __type: "bigint", value: string }
} from "valibot-ast";
```

---

### Introspection utilities (`valibot-ast/utils`)

`valibot-ast/utils` exports type-safe, tree-shakeable helpers for inspecting live Valibot schema objects and AST nodes. All functions are annotated `@__NO_SIDE_EFFECTS__`.

```typescript
import {
  // base
  getSchemaType,
  isAnySchema, isBigintSchema, isBlobSchema, isBooleanSchema,
  isDateSchema, isNanSchema, isNeverSchema, isNullSchema,
  isNumberSchema, isStringSchema, isSymbolSchema, isUndefinedSchema,
  isUnknownSchema, isVoidSchema,
  // wrapped
  isWrappedSchema, getWrappedSchema,
  getWrappedASTNode,  // AST-level counterpart of getWrappedSchema
  // object
  isObjectSchema, isObjectWithRestSchema,
  getObjectEntries, getObjectEntry,
  getObjectFields, getObjectField,
  getObjectRest,
  // array / tuple
  isArraySchema, isTupleSchema, isTupleWithRestSchema,
  getArrayItem, getTupleItems, getTupleRest,
  // record
  isRecordSchema, getRecordKey, getRecordValue,
  // choice (enum / picklist / union / variant)
  isEnumSchema, isPicklistSchema, isUnionSchema, isVariantSchema,
  getEnumOptions, getPicklistOptions,
  getUnionOptions, getVariantOptions, getVariantKey,
  // literal
  isLiteralSchema, getLiteralValue,
  // special (intersect / instance / map / set / function)
  isIntersectSchema, isInstanceSchema, isMapSchema, isSetSchema, isFunctionSchema,
  getIntersectOptions, getInstanceClass, getMapKey, getMapValue, getSetItem,
  // lazy
  isLazySchema, getLazyGetter,
  // pipe
  hasPipe,
  getPipeItems, getPipeActions, findPipeItems,
  getTransformationActions, getValidationActions,
  getLengthActions, getValueActions, getSizeActions, getBytesActions,
  // info
  getSchemaInfo,
} from "valibot-ast/utils";
```

#### `getSchemaType(schema)`

Returns the `schema.type` string with the narrowed return type inferred from the input.

#### `is*Schema(schema)` — type guards

All `is*` functions narrow their input to the specific schema type. They work on any `GenericSchema | GenericSchemaAsync`.

```typescript
import * as v from "valibot";
import { isObjectSchema, isWrappedSchema } from "valibot-ast/utils";

function inspect(schema: v.GenericSchema) {
  if (isWrappedSchema(schema)) {
    console.log("wrapped:", schema.type); // optional, nullable, etc.
  }
  if (isObjectSchema(schema)) {
    console.log("entries:", Object.keys(schema.entries));
  }
}
```

#### `getWrappedSchema(schema, dataset?, config?)`

Recursively unwraps all wrapper layers (`optional`, `nullable`, `nullish`, `exact_optional`, `undefinedable`, `non_optional`, `non_nullable`, `non_nullish`) and returns:

```typescript
// For wrapped schemas:
{
  wasWrapped: true,
  schema:       /* deepest inner schema */,
  required:     boolean,   // false if any outer wrapper is optional/nullish/undefinedable
  nullable:     boolean,   // true if any outer wrapper is nullable/nullish
  defaultValue: /* inferred from valibot's getDefault() */,
}

// For non-wrapped schemas:
{ wasWrapped: false, schema: /* original */ }
```

#### `getWrappedASTNode(node)`

The AST-level counterpart of `getWrappedSchema`. Peels off all wrapper layers from a serialized `ASTNode` and returns:

```typescript
{
  node:     ASTNode,   // deepest inner node
  required: boolean,
  nullable: boolean,
  default?: unknown,   // present when the wrapper carried a default value
}
```

#### Object helpers

| Function | Returns |
|----------|---------|
| `getObjectEntries(schema)` | `[key, schema][]` |
| `getObjectEntry(schema, key)` | entry schema or `null` |
| `getObjectFields(schema)` | `{ key, schema }[]` |
| `getObjectField(schema, key)` | `{ key, schema }` or `null` |
| `getObjectRest(schema)` | rest schema (`objectWithRest`) or `null` |

#### Array / Tuple helpers

| Function | Returns |
|----------|---------|
| `getArrayItem(schema)` | item schema or `null` |
| `getTupleItems(schema)` | items array or `null` |
| `getTupleRest(schema)` | rest schema (`tupleWithRest`) or `null` |

#### Literal helpers

| Function | Returns |
|----------|---------|
| `getLiteralValue(schema)` | literal value (`string \| number \| bigint \| boolean`) or `null` |

#### Record helpers

| Function | Returns |
|----------|---------|
| `getRecordKey(schema)` | key schema or `null` |
| `getRecordValue(schema)` | value schema or `null` |

#### Choice helpers

| Function | Returns |
|----------|---------|
| `getEnumOptions(schema)` | enum object or `null` |
| `getPicklistOptions(schema)` | options array or `null` |
| `getUnionOptions(schema)` | options array or `null` |
| `getVariantOptions(schema)` | options array or `null` |
| `getVariantKey(schema)` | discriminant key string or `null` |

#### Special helpers

| Function | Returns |
|----------|---------|
| `getIntersectOptions(schema)` | options array or `null` |
| `getInstanceClass(schema)` | class constructor or `null` |
| `getMapKey(schema)` | key schema or `null` |
| `getMapValue(schema)` | value schema or `null` |
| `getSetItem(schema)` | item schema or `null` |

#### Lazy helpers

| Function | Returns |
|----------|---------|
| `isLazySchema(schema)` | type guard |
| `getLazyGetter(schema)` | `() => WrappedSchema` or `null` |

#### Pipe helpers

| Function | Returns |
|----------|---------|
| `hasPipe(schema)` | type guard — schema has a `pipe` array |
| `getPipeItems(schema)` | full pipe array or `null` |
| `getPipeActions(schema)` | pipe items excluding the base schema |
| `getValidationActions(schema)` | items with `kind === "validation"` |
| `getTransformationActions(schema)` | items with `kind === "transformation"` |
| `findPipeItems(schema, { kind?, type? })` | filtered pipe items |
| `getLengthActions(schema)` | `min_length`, `max_length`, `length` actions |
| `getValueActions(schema)` | `min_value`, `max_value`, `value` actions |
| `getSizeActions(schema)` | `min_size`, `max_size`, `size` actions |
| `getBytesActions(schema)` | `min_bytes`, `max_bytes`, `bytes` actions |

#### `getSchemaInfo(schema)`

Extracts Valibot metadata actions from a schema (unwrapping wrappers first):

```typescript
import * as v from "valibot";
import { getSchemaInfo } from "valibot-ast/utils";

const schema = v.pipe(
  v.optional(v.string()),
  v.title("Username"),
  v.description("Must be unique"),
);

const info = getSchemaInfo(schema);
// { title: "Username", description: "Must be unique", examples: undefined, metadata: undefined }
```

Returns `SchemaInfo<TSchema>`:

```typescript
interface SchemaInfo<TSchema> {
  title:       string | undefined;
  description: string | undefined;
  examples:    InferExamples<...>;
  metadata:    InferMetadata<...>;
}
```

---

## Dictionary: Handling Custom Functions

Custom validations, transformations, class instances, and lazy schemas cannot be serialized as plain JSON. Use a single `DictionaryMap` for both directions — `schemaToAST` looks up the key by reference, `astToSchema` restores the value by key.

```typescript
import * as v from "valibot";
import { schemaToAST, astToSchema, createDictionary } from "valibot-ast";

class UserId { constructor(public value: string) {} }

const isSlug = (s: string) => /^[a-z0-9-]+$/.test(s);
const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

const dictionary = createDictionary({
  UserId,
  "is-slug": isSlug,
  "to-slug":  toSlug,
});

const schema = v.object({
  id:   v.instance(UserId),
  slug: v.pipe(v.string(), v.transform(toSlug), v.check(isSlug, "invalid slug")),
});

// Serialize
const { document } = schemaToAST(schema, { dictionary });
const json = JSON.stringify(document);

// Deserialize (same dictionary)
const rebuilt = astToSchema<v.GenericSchema>(JSON.parse(json), { dictionary });
```

> The `DictionaryMap` accepts:
> - **Class constructors** — used with `v.instance()`
> - **Functions** — used with `v.check()`, `v.transform()`, `v.custom()`
> - **Lazy getters** `() => schema` — used with `v.lazy()`

---

## AST Document Structure

```typescript
interface ASTDocument {
  version:    string;                              // e.g. "1.0.0"
  library:    string;                              // "valibot"
  schema:     ASTNode;                             // root node
  dictionary?: Record<string, DictionaryEntryMeta>; // referenced dictionary manifest
  metadata?:  Record<string, unknown>;             // arbitrary document-level metadata
}
```

Each `ASTNode` carries:

- `kind` — `"schema"` | `"validation"` | `"transformation"`
- `type` — e.g. `"string"`, `"object"`, `"email"`, `"transform"`
- `async` — `boolean`
- Type-specific fields: `entries`, `item`, `items`, `rest`, `wrapped`, `options`, `pipe`, `info`, etc.

---

## Limitations

- **Custom functions** require a dictionary — they are stored by key, not by value
- **`v.lazy()` getters** require a dictionary — the getter function itself is never serialized
- **RegExp** values in pipe validations like `v.regex()` are serialized to their source/flags and restored; `v.hash()` is similarly restored via regex
- **Library-agnostic format** — currently only Valibot is supported

---

## License

MIT

---

**Note**: This package is experimental and the API may change before stabilization.
