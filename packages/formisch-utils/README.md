# formisch-utils

> Utility functions for working with Formisch forms and Valibot schemas

> [!WARNING]
> **⚠️ Experimental Package ⚠️**: This package is currently available only via [pkg.pr.new](https://pkg.pr.new) and is designed to work with the [Formisch](https://formisch.dev) form library.

## Overview

`formisch-utils` provides utilities for seamlessly integrating [Valibot](https://valibot.dev) schemas with [Formisch](https://formisch.dev) forms across all supported frameworks (Vue, React, Preact, Solid, Svelte, and Qwik).

The primary utility, `generateInitialInput`, automatically generates type-safe initial values from Valibot schemas, eliminating the need to manually define initial values for forms.

Built on top of [`valibot-introspection`](../valibot-introspection), this library leverages runtime schema inspection to provide intelligent initial value generation.

## Installation

Since this package is not yet published to npm, you can install it via pkg.pr.new:

```bash
# Using pnpm
pnpm add https://pkg.pr.new/sandros94/open-circle-utils/formisch-utils@main

# Using npm
npm install https://pkg.pr.new/sandros94/open-circle-utils/formisch-utils@main

# Using yarn
yarn add https://pkg.pr.new/sandros94/open-circle-utils/formisch-utils@main
```

## Features

- 🎯 **Automatic Initial Values**: Generate initial values from Valibot schemas automatically
- 🔒 **Fully Typed**: Complete TypeScript support with type inference
- 🎨 **Comprehensive Coverage**: Supports all Valibot schema types
- ⚙️ **Smart Wrapping**: Handles optional, nullable, and nullish schemas intelligently
- 🔧 **Extensible**: Custom generator support for custom schemas
- 📦 **Tree-Shakeable**: Import only what you need
- ⚡ **Zero Config**: Works out of the box with sensible defaults
- 🌐 **Framework Agnostic**: Works with all Formisch framework adaptors

## Quick Start

### Basic Usage

```typescript
import * as v from "valibot";
import { generateInitialInput } from "formisch-utils";
import { useForm } from "@formisch/vue"; // or any other framework

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
  rememberMe: v.optional(v.boolean()),
});

// Generate initial values automatically
const initialValues = generateInitialInput(LoginSchema);
// { email: '', password: '', rememberMe: undefined }

// Use with Formisch
const loginForm = useForm({
  schema: LoginSchema,
  initialInput: initialValues,
});
```

## API Reference

### `generateInitialInput(schema, options?)`

Generates initial values for a Valibot schema suitable for use with Formisch's `initialInput`.

**Parameters:**

- `schema`: A Valibot schema (sync or async)
- `options?`: Optional configuration object
  - `customGenerator?`: Custom generator function for handling unknown schema types

**Returns:** Initial values matching the schema's `InferInput` type

## Usage Examples

### Primitive Types

```typescript
import * as v from "valibot";
import { generateInitialInput } from "formisch-utils";

// String
generateInitialInput(v.string()); // ""

// Number
generateInitialInput(v.number()); // 0

// Boolean
generateInitialInput(v.boolean()); // false

// Date
generateInitialInput(v.date()); // new Date()
```

### Literal and Choice Types

```typescript
// Literal values
generateInitialInput(v.literal("success")); // "success"
generateInitialInput(v.literal(42)); // 42

// Picklist (uses first option)
generateInitialInput(v.picklist(["red", "green", "blue"])); // "red"

// Enum (uses first value)
enum Status {
  Active = "active",
  Inactive = "inactive",
}
generateInitialInput(v.enum_(Status)); // "active"
```

### Complex Objects

```typescript
const UserProfileSchema = v.object({
  personalInfo: v.object({
    firstName: v.string(),
    lastName: v.string(),
    age: v.optional(v.number()),
  }),
  contact: v.object({
    email: v.pipe(v.string(), v.email()),
    phone: v.optional(v.string()),
  }),
  preferences: v.object({
    theme: v.picklist(["light", "dark", "auto"]),
    notifications: v.boolean(),
  }),
  tags: v.array(v.string()),
});

const initialValues = generateInitialInput(UserProfileSchema);
/*
{
  personalInfo: {
    firstName: "",
    lastName: "",
    age: undefined,
  },
  contact: {
    email: "",
    phone: undefined,
  },
  preferences: {
    theme: "light",
    notifications: false,
  },
  tags: [],
}
*/
```

### Arrays and Tuples

```typescript
// Arrays (empty by default)
generateInitialInput(v.array(v.string())); // []

// Tuples (generates value for each element)
generateInitialInput(v.tuple([v.string(), v.number(), v.boolean()]));
// ["", 0, false]

// Tuple with rest
generateInitialInput(v.tupleWithRest([v.string(), v.number()], v.boolean()));
// ["", 0]
```

### Wrapped Schemas

The function intelligently handles wrapped schemas (optional, nullable, nullish):

```typescript
// Optional (required: false) -> undefined
generateInitialInput(v.optional(v.string())); // undefined

// Nullable (required: true, nullable: true) -> null
generateInitialInput(v.nullable(v.number())); // null

// Nullish (required: false, nullable: true) -> undefined
generateInitialInput(v.nullish(v.boolean())); // undefined

// With default value -> uses default
generateInitialInput(v.optional(v.string(), "default-value")); // "default-value"
```

### Union and Variant Schemas

```typescript
// Union (uses first option)
const schema = v.union([v.string(), v.number()]);
generateInitialInput(schema); // ""

// Variant (uses first option)
const variantSchema = v.variant("type", [
  v.object({ type: v.literal("text"), content: v.string() }),
  v.object({ type: v.literal("number"), content: v.number() }),
]);
generateInitialInput(variantSchema);
// { type: "text", content: "" }
```

### Lazy Schemas

```typescript
const LazySchema = v.lazy(() =>
  v.object({
    name: v.string(),
    age: v.number(),
  }),
);

generateInitialInput(LazySchema);
// { name: "", age: 0 }
```

### Intersect Schemas

```typescript
const IntersectedSchema = v.intersect([
  v.object({ firstName: v.string(), lastName: v.string() }),
  v.object({ email: v.string() }),
  v.object({ age: v.number(), active: v.boolean() }),
]);

generateInitialInput(IntersectedSchema);
/*
{
  firstName: "",
  lastName: "",
  email: "",
  age: 0,
  active: false,
}
*/
```

### Custom Schemas

For custom schemas or unknown types, provide a `customGenerator`:

```typescript
const customGenerator = (schema: any) => {
  if (schema.type === "custom") {
    return "custom-default-value";
  }
  return undefined;
};

const CustomSchema = v.custom<string>((input) => typeof input === "string");
const initialValue = generateInitialInput(CustomSchema, { customGenerator });
// "custom-default-value"
```

Without a custom generator, unknown types will throw an error:

```typescript
try {
  generateInitialInput(v.custom<string>(() => true));
} catch (error) {
  // Error: Unable to generate initial value for schema type "custom"
}
```

## Framework Integration Examples

### Vue

```vue
<script setup lang="ts">
import type { SubmitHandler } from "@formisch/vue";
import { Field, Form, useForm } from "@formisch/vue";
import { generateInitialInput } from "formisch-utils";
import * as v from "valibot";

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
});

const loginForm = useForm({
  schema: LoginSchema,
  initialInput: generateInitialInput(LoginSchema),
});

const submitForm: SubmitHandler<typeof LoginSchema> = (values) => {
  // Process the validated form values
  console.log(values); // { email: string, password: string }
};
</script>

<template>
  <Form :of="loginForm" @submit="submitForm">
    <Field :of="loginForm" :path="['email']" v-slot="field">
      <input v-model="field.input" v-bind="field.props" type="email" />
    </Field>
    <Field :of="loginForm" :path="['password']" v-slot="field">
      <input v-model="field.input" v-bind="field.props" type="password" />
    </Field>
    <button type="submit">Login</button>
  </Form>
</template>
```

### React

```tsx
import type { SubmitHandler } from "@formisch/react";
import { Field, Form, useForm } from "@formisch/react";
import { generateInitialInput } from "formisch-utils";
import * as v from "valibot";

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
});

function LoginForm() {
  const loginForm = useForm({
    schema: LoginSchema,
    initialInput: generateInitialInput(LoginSchema),
  });

  const submitForm: SubmitHandler<typeof LoginSchema> = (values) => {
    // Process the validated form values
    console.log(values); // { email: string, password: string }
  };

  return (
    <Form of={loginForm} onSubmit={submitForm}>
      <Field of={loginForm} path={["email"]}>
        {(field) => <input {...field.props} value={field.input} type="email" />}
      </Field>
      <Field of={loginForm} path={["password"]}>
        {(field) => (
          <input {...field.props} value={field.input} type="password" />
        )}
      </Field>
      <button type="submit">Login</button>
    </Form>
  );
}
```

### Solid

```tsx
import type { SubmitHandler } from "@formisch/solid";
import { createForm, Field, Form } from "@formisch/solid";
import { generateInitialInput } from "formisch-utils";
import * as v from "valibot";

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
});

function LoginForm() {
  const loginForm = createForm({
    schema: LoginSchema,
    initialInput: generateInitialInput(LoginSchema),
  });

  const submitForm: SubmitHandler<typeof LoginSchema> = (values) => {
    // Process the validated form values
    console.log(values); // { email: string, password: string }
  };

  return (
    <Form of={loginForm} onSubmit={submitForm}>
      <Field of={loginForm} path={["email"]}>
        {(field) => <input {...field.props} value={field.input} type="email" />}
      </Field>
      <Field of={loginForm} path={["password"]}>
        {(field) => (
          <input {...field.props} value={field.input} type="password" />
        )}
      </Field>
      <button type="submit">Login</button>
    </Form>
  );
}
```

## Important Notes

### Wrapped Schema Handling

The function properly handles wrapped schemas with the following priority:

1. **Default Value**: If a wrapped schema has a default value, it's always used
2. **Optional** (`required: false`, `nullable: false`): Returns `undefined`
3. **Nullable** (`required: true`, `nullable: true`): Returns `null`
4. **Nullish** (`required: false`, `nullable: true`): Returns `undefined`
5. **Required** (`required: true`, `nullable: false`): Generates value from unwrapped schema

### Array Initial Values

Arrays are initialized as empty (`[]`) by default, even if they have validation requirements like `minLength`. This is intentional to allow progressive form filling. If you need pre-populated arrays, you can manually override the initial values after generation.

### Piped Schemas

Schemas with pipes (e.g., `v.pipe(v.string(), v.email())`) are handled by generating the initial value for the base schema, ignoring validation and transformation steps.

## Supported Schema Types

- ✅ **Primitives**: `string`, `number`, `bigint`, `boolean`, `date`, `null`, `undefined`, `any`, `unknown`, `void`
- ✅ **Literal**: `literal`
- ✅ **Choice**: `picklist`, `enum`
- ✅ **Objects**: `object`, `objectWithRest`
- ✅ **Arrays**: `array`, `tuple`, `tupleWithRest`
- ✅ **Records**: `record`
- ✅ **Special**: `file`, `blob`, `symbol`, `nan`, `map`, `set`
- ✅ **Logic**: `union`, `variant`, `intersect`, `lazy`
- ✅ **Wrapped**: `optional`, `nullable`, `nullish`, `nonOptional`, `nonNullable`, `nonNullish`
- ✅ **Custom**: Via `customGenerator` option
- ⚠️ **Not applicable**: `never`, `function`, `promise`, `instance` (returns `undefined`)

## Related Packages

- [`valibot-introspection`](../valibot-introspection): Low-level introspection utilities for Valibot schemas
- [`valibot-ast`](../valibot-ast): AST utilities for schema serialization and reconstruction
- [Formisch](https://github.com/open-circle/formisch): Type-safe form library for modern frameworks

## License

MIT
