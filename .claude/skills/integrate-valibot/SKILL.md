---
name: integrate-valibot
description: Use this guide when library authors who want to build on top of Valibot — whether that is a form library, an ORM, an API framework, a code generator, or other tooling. It covers Standard Schema for schema-agnostic integrations, schema introspection for extracting types and runtime properties, and schema tree traversal for analysis and code generation.
license: MIT
metadata:
  author: open-circle
  version: "1.0"
---

# Integrate Valibot

## Standard Schema

Valibot implements [Standard Schema v1](https://standardschema.dev/schema). Every schema object exposes a `'~standard'` property that provides a vendor-neutral `validate` function and inferred TypeScript types. We recommend reading the Standard Schema documentation for the full interface specification.

When building a library that accepts user-defined schemas, we recommend accepting a `StandardSchemaV1` instead of a Valibot-specific type — unless your integration requires Valibot-specific APIs. This ensures your library works with any Standard Schema-compatible library, not just Valibot.

```ts
import type { StandardSchemaV1 } from "@standard-schema/spec";

async function validateData(schema: StandardSchemaV1, data: unknown) {
  const result = await schema["~standard"].validate(data);
  if (result.issues) {
    // Validation failed — result.issues is a readonly array of StandardIssue
    console.log(result.issues);
  } else {
    // Validation succeeded — result.value is the typed output
    console.log(result.value);
  }
}
```

One important limitation: `'~standard'.validate` always uses Valibot's global config. There is no way to pass a custom config (such as `abortEarly` or a custom `lang`) through the Standard Schema interface. If you need that level of control, use Valibot's own parsing APIs directly.

> Valibot also supports the [Standard JSON Schema](https://standardschema.dev/json-schema) specification via the `@valibot/to-json-schema` package, which exposes a `toStandardJsonSchema` function.

## Schema introspection

Valibot schemas are plain objects, so all their properties are readable at runtime. This section covers how to extract static TypeScript types, read runtime properties, and use built-in type guards to narrow schema values safely.

### Static types

Valibot exposes three generic utility types for extracting type information from any schema, validation, transformation, or metadata object.

```ts
import * as v from "valibot";

const Schema = v.pipe(v.string(), v.decimal(), v.toNumber());

type Input = v.InferInput<typeof Schema>; // string
type Output = v.InferOutput<typeof Schema>; // number
type Issue = v.InferIssue<typeof Schema>; // StringIssue | DecimalIssue | ToNumberIssue
```

[`InferInput`](https://valibot.dev/api/InferInput/),
[`InferOutput`](https://valibot.dev/api/InferOutput/), and
[`InferIssue`](https://valibot.dev/api/InferIssue/) read the phantom `'~types'`
field. They work on schemas, validations, transformations, and metadata alike.
`'~types'` is always `undefined` at runtime — this field exists solely for
TypeScript's type inference, so we recommend never reading it in runtime code.

### Runtime properties

Every schema and action is a plain object, so you can read its properties directly at runtime. The base properties (`kind`, `type`, `async`, etc.) are always present. Use `kind` to distinguish schemas from actions, and `type` to identify specific schemas and actions. Some schemas expose additional properties listed in the table below.

| Schema                                     | Extra property    | Description                                       |
| ------------------------------------------ | ----------------- | ------------------------------------------------- |
| `object`, `looseObject`, `strictObject`    | `entries`         | `Record<string, BaseSchema>` of named fields      |
| `objectWithRest`                           | `entries`, `rest` | named fields + rest element schema                |
| `array`                                    | `item`            | element schema                                    |
| `tuple`, `looseTuple`, `strictTuple`       | `items`           | ordered tuple of element schemas                  |
| `tupleWithRest`                            | `items`, `rest`   | ordered elements + rest element schema            |
| `record`, `map`                            | `key`, `value`    | key and value schemas                             |
| `set`                                      | `value`           | value schema                                      |
| `union`, `intersect`                       | `options`         | array of member schemas                           |
| `variant`                                  | `key`, `options`  | discriminant key string + array of object schemas |
| `optional`, `nullable`, and other wrappers | `wrapped`         | inner schema                                      |
| `lazy`                                     | `getter`          | `(input: unknown) => BaseSchema` deferred getter  |
| any schema passed through `pipe`           | `pipe`            | tuple of the root schema followed by pipe items   |

### Type guards

Use these helpers to narrow the TypeScript type of an unknown Valibot object before accessing its properties. Valibot exports three type guard helpers — [`isOfKind`](https://valibot.dev/api/isOfKind/), [`isOfType`](https://valibot.dev/api/isOfType/), and [`isValiError`](https://valibot.dev/api/isValiError/) — that narrow `kind` and `type` with TypeScript inference:

```ts
import * as v from "valibot";

// Narrows to BaseSchema by kind
if (v.isOfKind("schema", item)) {
  item; // BaseSchema<...>
}

// Narrows to StringSchema by type
if (v.isOfType("string", schema)) {
  schema; // StringSchema<...>
}
```

Direct `===` comparisons on `kind` and `type` are fine too, but `isOfKind` and `isOfType` can better narrow the TypeScript type of the object in some edge cases.

[`isValiError`](https://valibot.dev/api/isValiError/) is a separate helper for
error handling. [`ValiError`](https://valibot.dev/api/ValiError/) is the error
class thrown by [`parse`](https://valibot.dev/api/parse/) and
[`parser`](https://valibot.dev/api/parser/). It extends `Error` with `name =
'ValiError'` and a typed `issues` array:

```ts
import * as v from "valibot";

try {
  v.parse(Schema, input);
} catch (error) {
  if (v.isValiError<typeof Schema>(error)) {
    // error is ValiError<typeof Schema>
    console.log(error.issues);
  }
}
```

## Schema tree traversal

Because schemas are plain objects, we can walk a schema tree by reading its properties (see chapter "Runtime properties" above). When traversing a piped schema, read the `pipe` tuple — its first item is the root schema and subsequent items are pipe actions or nested schemas.

Here is a simplified example inspired by [`getDefaults`](https://valibot.dev/api/getDefaults/) that extracts deeply nested default values from object and tuple schemas:

```ts
import * as v from "valibot";

function getDefaults<
  const TSchema extends
    | v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
    | v.ObjectSchema<v.ObjectEntries, v.ErrorMessage<v.ObjectIssue> | undefined>
    | v.TupleSchema<v.TupleItems, v.ErrorMessage<v.TupleIssue> | undefined>,
>(schema: TSchema): v.InferDefaults<TSchema> {
  // If it is an object schema, return defaults of entries
  if ("entries" in schema) {
    const object: Record<string, unknown> = {};
    for (const key in schema.entries) {
      object[key] = getDefaults(schema.entries[key]);
    }
    return object;
  }

  // If it is a tuple schema, return defaults of items
  if ("items" in schema) {
    return schema.items.map(getDefaults);
  }

  // Otherwise, return default or `undefined`
  return v.getDefault(schema);
}
```
