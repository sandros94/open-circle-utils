# formisch-utils

> AST-first utilities for building Formisch forms from Valibot schemas

> [!WARNING]
> **⚠️ Experimental Package ⚠️**: This package is designed to work with the [Formisch](https://formisch.dev) form library.

## Overview

`formisch-utils` derives form field configurations, HTML input constraints, and initial values from [Valibot](https://valibot.dev) schemas. It accepts either a live Valibot schema or a pre-serialized [`valibot-ast`](https://npmx.dev/package/valibot-ast) node at every public API.

Three layers are provided:

| Layer | Purpose |
|-------|---------|
| Single-node utilities | Unwrap, infer input type, constraints, metadata, initial value |
| `buildFormFields` | Recursively build a full `FormFieldConfig` tree |
| Framework adapters | One-call setup for React, Preact, Vue, Solid, Qwik |

## Installation

```bash
# pnpm
pnpm add formisch-utils

# npm
npm install formisch-utils

# yarn
yarn add formisch-utils
```

> [!TIP]
> Continuous releases are also available via [pkg.pr.new](https://pkg.pr.new):
> ```bash
> pnpm add https://pkg.pr.new/formisch-utils@main
> ```

## Quick Start

```typescript
import * as v from "valibot";
import { buildFormFields, generateInitialInput } from "formisch-utils";

const schema = v.object({
  name: v.pipe(v.string(), v.title("Full Name"), v.minLength(2)),
  email: v.pipe(v.string(), v.email(), v.title("Email Address")),
  age: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(150))),
});

// Build the full form field tree
const config = buildFormFields(schema);
// → ObjectFormFieldConfig { kind: "object", fields: [...] }

// Generate type-safe initial values
const initial = generateInitialInput(schema);
// → { name: "", email: "", age: undefined }
```

### With a Framework Adapter (React)

```typescript
import * as v from "valibot";
import { useFormFields } from "formisch-utils/react";

const schema = v.object({
  name: v.pipe(v.string(), v.title("Full Name")),
  email: v.pipe(v.string(), v.email()),
});

function MyForm() {
  const { form, config } = useFormFields(schema, {
    validate: "blur",
    revalidate: "input",
  });

  // config is a FormFieldConfig tree
  // form is a Formisch FormStore
}
```

## Entry Points

| Import path | What it provides |
|-------------|------------------|
| `formisch-utils` | Framework-agnostic core (all utilities and types) |
| `formisch-utils/react` | `useFormFields` + all core exports |
| `formisch-utils/preact` | `useFormFields` + all core exports |
| `formisch-utils/vue` | `useFormFields` + all core exports |
| `formisch-utils/solid` | `createFormFields` + all core exports |
| `formisch-utils/qwik` | `useFormFields$` + all core exports |

## API Reference

### `buildFormFields(input, options?)`

Recursively traverses a schema and produces a `FormFieldConfig` tree describing every field.

```typescript
import * as v from "valibot";
import { buildFormFields } from "formisch-utils";

const schema = v.object({
  name: v.string(),
  address: v.object({
    street: v.string(),
    city: v.string(),
  }),
  tags: v.array(v.string()),
});

const config = buildFormFields(schema);
// config.kind === "object"
// config.fields[0] → LeafFormFieldConfig { kind: "leaf", key: "name", inputType: "text" }
// config.fields[1] → ObjectFormFieldConfig { kind: "object", key: "address", fields: [...] }
// config.fields[2] → ArrayFormFieldConfig { kind: "array", key: "tags", item: {...} }
```

**Input:** accepts a `GenericSchema`, `SchemaToASTResult`, `ASTDocument`, or `ASTNode`.

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `basePath` | `string[]` | Prefix for all generated field paths |

**Mapping rules:**

| Schema type | Config kind | Notes |
|-------------|-------------|-------|
| `object` (all variants) | `object` | `fields[]` preserving insertion order |
| `array` | `array` | `item` config for the array element |
| `tuple` (all variants) | `tuple` | `items[]` indexed as `"0"`, `"1"`, etc. |
| `variant` | `variant` | `discriminatorKey` + `branches[]` |
| `union` (all literals) | `leaf` | `inputType: "select"` with options |
| `union` (mixed/objects) | `union` | `options: FormFieldConfig[][]` (sub-form per option) |
| `intersect` (objects) | `object` | Entries merged, first-wins on duplicates |
| `record` | `record` | `keyField` + `valueField` configs |
| `enum` / `picklist` | `leaf` | `inputType: "select"` with options |
| `literal` | `leaf` | `inputType: "hidden"` |
| Scalars (string, number, etc.) | `leaf` | `inputType` from `inferInputType`, `constraints` from `inferInputConstraints` |
| `lazy`, `function`, `map`, `set`, `instance` | `unsupported` | With `nodeType` and `reason` |

---

### `buildObjectFields(input, options?)`

Convenience wrapper around `buildFormFields`. If the result is `kind: "object"`, returns `root.fields` directly; otherwise wraps the result in a single-element array.

---

### `generateInitialInput(input)`

Derives sensible default values from a schema.

```typescript
import * as v from "valibot";
import { generateInitialInput } from "formisch-utils";

const schema = v.object({
  name: v.string(),
  bio: v.optional(v.string(), "N/A"),
  age: v.optional(v.number()),
  active: v.boolean(),
});

generateInitialInput(schema);
// → { name: "", bio: "N/A", age: undefined, active: false }
```

**Resolution order per field:**
1. Explicit wrapper default (e.g. `v.optional(v.string(), "hello")`) → use it
2. Optional/undefinedable wrapper → `undefined`
3. Nullable (but required) wrapper → `null`
4. Type-based: `string` → `""`, `boolean` → `false`, `literal` → the literal value, `object` → recurse, `array`/`tuple` → `[]`, `union`/`variant` → first option's initial value, `number`/`bigint`/`date` → `undefined`

---

### `inferInputType(node)`

Maps an AST node to an HTML `<input type>` string.

| Schema | Returns |
|--------|---------|
| `string` + `email` pipe | `"email"` |
| `string` + `url` | `"url"` |
| `string` + `isoDate` | `"date"` |
| `string` + `isoDateTime` / `isoTimestamp` | `"datetime-local"` |
| `string` + `isoTime` | `"time"` |
| `string` + `isoWeek` | `"week"` |
| `string` + `hexColor` | `"color"` |
| `string` (plain) | `"text"` |
| `number` / `bigint` | `"number"` |
| `boolean` | `"checkbox"` |
| `date` | `"date"` |
| `file` / `blob` | `"file"` |
| Structural / unsupported | `undefined` |

---

### `inferInputConstraints(node, options?)`

Derives `InputConstraints` (HTML attributes) from pipe validations.

```typescript
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { inferInputConstraints } from "formisch-utils";

const schema = v.pipe(v.string(), v.minLength(2), v.maxLength(100));
const { document } = schemaToAST(schema);

inferInputConstraints(document.schema);
// → { required: true, minLength: 2, maxLength: 100 }
```

| Validation | Constraint |
|------------|-----------|
| `minLength(n)` | `minLength: n` |
| `maxLength(n)` | `maxLength: n` |
| `length(n)` | `minLength` + `maxLength: n` |
| `nonEmpty()` | `minLength: 1` |
| `minValue(n)` | `min: n` |
| `maxValue(n)` | `max: n` |
| `multipleOf(n)` | `step: n` |
| `integer()` | `step: 1` |
| `regex(r)` | `pattern: r.source` |
| `mimeType([...])` | `accept: "image/png,image/jpeg,..."` |

---

### `inferMeta(node, key?)`

Extracts human-readable metadata from an AST node's `info` block.

```typescript
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { inferMeta } from "formisch-utils";

const schema = v.pipe(
  v.string(),
  v.title("Email Address"),
  v.description("Your primary email"),
);
const { document } = schemaToAST(schema);

inferMeta(document.schema, "email");
// → { label: "Email Address", description: "Your primary email" }

// Without title metadata, falls back to titleCase of the key:
inferMeta(someNode, "firstName");
// → { label: "First Name" }
```

Returns `FormFieldMeta`:
- `label` — from `info.title`, falls back to `titleCase(key)`
- `description` — from `info.description`
- `placeholder` — from `info.metadata.placeholder` or `String(info.examples[0])`

---

### `inferInitialValue(node)`

Derives a default value for a single AST node. Used internally by `generateInitialInput`.

---

### `unwrapASTNode(node)`

Alias for `getWrappedASTNode` from `valibot-ast/utils`. Peels off all wrapper layers and returns `{ node, required, nullable, default? }`.

---

### `coerceValue(field, rawValue)`

Converts a raw HTML input string value to the typed value expected by the schema.

```typescript
import { coerceValue } from "formisch-utils";

// For a LeafFormFieldConfig with nodeType: "number"
coerceValue(numberField, "42");   // → 42
coerceValue(numberField, "");     // → undefined (if required) or null (if nullable)

// For fields with options, matches against option values
coerceValue(selectField, "2");    // → 2 (the number, not the string)
```

**Coercion by `nodeType`:**

| `nodeType` | Empty string | Non-empty string |
|------------|-------------|------------------|
| `"number"` | fallback | `Number(raw)` |
| `"bigint"` | fallback | `BigInt(raw)` |
| `"boolean"` | `false` | `true` for `"true"`, `"on"`, `"1"` |
| `"date"` | fallback | `new Date(raw)` |
| Others | raw string | raw string |

Empty-string fallback: `undefined` if required and not nullable, `null` if required and nullable, `undefined` if optional.

---

## Types

```typescript
import type {
  // Field configs (discriminated union on `kind`)
  FormFieldConfig,           // Union of all config types below
  LeafFormFieldConfig,       // Scalar: inputType, constraints, options
  ObjectFormFieldConfig,     // Nested object: fields[]
  ArrayFormFieldConfig,      // Dynamic array: item config
  TupleFormFieldConfig,      // Fixed tuple: items[]
  UnionFormFieldConfig,      // Non-discriminated union: options[][]
  VariantFormFieldConfig,    // Discriminated union: discriminatorKey, branches[]
  RecordFormFieldConfig,     // Key-value: keyField, valueField
  UnsupportedFormFieldConfig,// Unmappable type: nodeType, reason

  // Shared types
  BaseFormFieldConfig,       // Common fields: key, path, label, description, required, nullable, default
  InputConstraints,          // HTML attrs: required, minLength, maxLength, min, max, step, pattern, accept
  FormFieldMeta,             // label, description, placeholder
  FormFieldOption,           // { value, label }
  UnwrappedASTNode,          // Re-export of GetWrappedASTNode

  // Build options
  BuildFormFieldsOptions,
} from "formisch-utils";
```

## Framework Adapters

All adapters accept the same options and return `{ form, config }`:

```typescript
interface UseFormFieldsOptions<S> {
  initialInput?: DeepPartial<InferInput<S>>;  // deep-merged over auto-generated defaults
  validate?: "initial" | "blur" | "input" | "submit";
  revalidate?: "blur" | "input" | "submit";
}
// Returns: { form: FormStore<S>, config: FormFieldConfig }
```

| Adapter | Import | Function |
|---------|--------|----------|
| React | `formisch-utils/react` | `useFormFields(schema, options?)` |
| Preact | `formisch-utils/preact` | `useFormFields(schema, options?)` |
| Vue | `formisch-utils/vue` | `useFormFields(schema, options?)` |
| SolidJS | `formisch-utils/solid` | `createFormFields(schema, options?)` |
| Qwik | `formisch-utils/qwik` | `useFormFields$(schema, options?)` |

The `initialInput` override is deep-merged with the auto-generated defaults, so you can partially override specific fields without losing the rest:

```typescript
const { form, config } = useFormFields(schema, {
  initialInput: { name: "John" },
  // age, email, etc. still get their auto-generated defaults
});
```

## Related Packages

- [`valibot-ast`](https://npmx.dev/package/valibot-ast): AST utilities for schema serialization and reconstruction
- [Formisch](https://github.com/open-circle/formisch): Type-safe form library for modern frameworks

## License

MIT
