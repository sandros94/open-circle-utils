import type { GenericSchema, GenericSchemaAsync } from "valibot";
import {
  type GetWrappedSchema,
  getWrappedSchema,
  hasPipe,
  getLengthActions,
  getValueActions,
  findPipeItems,
} from "valibot-introspection";

// ---- private type-level utility ----

/**
 * The deeply-unwrapped schema type (strips all optional/nullable/nullish wrappers).
 * Same pattern as used in `infer-input-type.ts`.
 */
type UnwrappedSchemaOf<TSchema extends GenericSchema | GenericSchemaAsync> =
  GetWrappedSchema<TSchema>["schema"];

// ---- public types ----

/**
 * The set of HTML input constraint attributes that can be inferred from a Valibot schema.
 *
 * - `required` — always present; `false` for optional/nullish wrappers, `true` otherwise
 * - `minLength` / `maxLength` — from `v.minLength()` / `v.maxLength()` / `v.length()` on string schemas;
 *   `v.nonEmpty()` sets `minLength: 1` as a fallback when no explicit `minLength` is present
 * - `min` / `max` — from `v.minValue()` / `v.maxValue()` / `v.value()` on number, bigint, and date schemas;
 *   dates are formatted as ISO date strings (`"YYYY-MM-DD"`)
 * - `step` — from `v.multipleOf()` (takes priority) or `v.integer()` → `1` on number schemas
 * - `pattern` — from `v.regex()` on string schemas (`.requirement.source`)
 * - `accept` — from `v.mimeType()` on file/blob schemas (comma-separated)
 * - `multiple` — not auto-inferred; returnable via `customConstraints`
 */
export type InputConstraints = {
  required: boolean;
  nullable?: boolean;
  defaultValue?: unknown;
  minLength?: number;
  maxLength?: number;
  min?: number | bigint | string;
  max?: number | bigint | string;
  step?: number | bigint;
  pattern?: string;
  accept?: string;
  multiple?: boolean;
};

/**
 * The precise return type of `inferInputConstraints<TSchema>`.
 *
 * The `required` field is type-narrowed:
 * - Wrapping schemas (optional, nullish, …) yield a precise boolean literal (`true` or `false`)
 * - Non-wrapped schemas always resolve to `true`
 *
 * All other constraint fields are always optional `number | bigint | string`.
 *
 * @example
 * ```typescript
 * type A = InferInputConstraintsResult<typeof v.optional(v.string())>
 * //   A["required"] is false
 * type B = InferInputConstraintsResult<typeof v.string()>
 * //   B["required"] is true
 * ```
 */
export type InferInputConstraintsResult<
  TSchema extends GenericSchema | GenericSchemaAsync,
> = {
  required: GetWrappedSchema<TSchema>["wasWrapped"] extends true
    ? GetWrappedSchema<TSchema>["required"]
    : true;
  nullable: GetWrappedSchema<TSchema>["wasWrapped"] extends true
    ? GetWrappedSchema<TSchema>["nullable"]
    : false;
  defaultValue: GetWrappedSchema<TSchema>["wasWrapped"] extends true
    ? GetWrappedSchema<TSchema>["defaultValue"]
    : undefined;
  minLength?: number;
  maxLength?: number;
  min?: number | bigint | string;
  max?: number | bigint | string;
  step?: number | bigint;
  pattern?: string;
  accept?: string;
  multiple?: boolean;
};

/**
 * Options for inferring HTML input constraints from a Valibot schema.
 */
export interface InferInputConstraintsOptions<
  TSchema extends GenericSchema | GenericSchemaAsync =
    | GenericSchema
    | GenericSchemaAsync,
> {
  /**
   * Custom constraints merged on top of (and overriding) the inferred result.
   *
   * The function receives the **already-unwrapped** schema (wrappers like optional,
   * nullable, nullish have already been stripped), so there is no need to call
   * `getWrappedSchema` inside this callback.
   *
   * Custom values **override** inferred ones. Return `undefined` to signal
   * "no custom constraints for this schema".
   *
   * Useful for adding constraints not expressible in Valibot (e.g. `multiple: true`
   * for file inputs, or a custom `step`).
   *
   * @param schema - The unwrapped, base schema
   * @returns Partial constraints to merge on top of inferred ones, or undefined
   *
   * @example
   * ```typescript
   * inferInputConstraints(v.pipe(v.file(), v.mimeType(["image/jpeg"])), {
   *   customConstraints: () => ({ multiple: true }),
   * });
   * // { required: true, accept: "image/jpeg", multiple: true }
   * ```
   */
  customConstraints?: (
    schema: UnwrappedSchemaOf<TSchema>,
  ) => Partial<InputConstraints> | undefined;
}

// ---- private runtime helpers ----

// Typed aliases for action arrays (getLengthActions / getValueActions return `never[]`
// when called with the generic `GenericSchema | GenericSchemaAsync` union).
type LengthAction = {
  type: "length" | "min_length" | "max_length";
  requirement: number;
};
type NumberValueAction = {
  type: "value" | "min_value" | "max_value";
  requirement: number | bigint;
};
type DateValueAction = {
  type: "value" | "min_value" | "max_value";
  requirement: Date;
};

/**
 * Extract constraint attributes from a string base schema by inspecting its pipe.
 */
function extractStringConstraints(
  schema: GenericSchema | GenericSchemaAsync,
): Partial<InputConstraints> {
  if (!hasPipe(schema)) return {};

  const result: Partial<InputConstraints> = {};

  // length(n) expresses an exact length constraint — it takes full precedence over
  // any min_length/max_length in the same pipe, because the value MUST be that
  // exact count for validation to pass regardless of what min/max also say.
  // If multiple length() actions exist (a contradictory schema), last one wins.
  const lengthActions = getLengthActions(schema) as LengthAction[] | null;
  if (lengthActions && lengthActions.length > 0) {
    // Reverse scan for the last length() action.
    let exactLength: LengthAction | undefined;
    for (let i = lengthActions.length - 1; i >= 0; i--) {
      if (lengthActions[i].type === "length") {
        exactLength = lengthActions[i];
        break;
      }
    }

    if (exactLength) {
      result.minLength = exactLength.requirement;
      result.maxLength = exactLength.requirement;
    } else {
      // No exact length — apply min_length/max_length individually (last wins).
      for (const action of lengthActions) {
        if (action.type === "min_length") result.minLength = action.requirement;
        else if (action.type === "max_length")
          result.maxLength = action.requirement;
      }
    }
  }

  // non_empty → implicit minLength: 1, only if no explicit min_length/length already set.
  const nonEmptyItems = findPipeItems(schema, { type: ["non_empty"] });
  if (
    nonEmptyItems &&
    nonEmptyItems.length > 0 &&
    result.minLength === undefined
  ) {
    result.minLength = 1;
  }

  // regex → pattern from the last regex action's .source
  const regexItems = findPipeItems(schema, { type: ["regex"] });
  if (regexItems && regexItems.length > 0) {
    const lastRegex = regexItems.at(-1) as unknown as {
      requirement: RegExp;
    };
    result.pattern = lastRegex.requirement.source;
  }

  return result;
}

/**
 * Extract constraint attributes from a number or bigint base schema by inspecting its pipe.
 */
function extractNumberConstraints(
  schema: GenericSchema | GenericSchemaAsync,
): Partial<InputConstraints> {
  if (!hasPipe(schema)) return {};

  const result: Partial<InputConstraints> = {};

  // value(n) expresses an exact value constraint — it takes full precedence over
  // any min_value/max_value in the same pipe, because the value MUST be exactly n.
  // If multiple value() actions exist (a contradictory schema), last one wins.
  const valueActions = getValueActions(schema) as NumberValueAction[] | null;
  if (valueActions && valueActions.length > 0) {
    // Reverse scan for the last value() action.
    let exactValue: NumberValueAction | undefined;
    for (let i = valueActions.length - 1; i >= 0; i--) {
      if (valueActions[i].type === "value") {
        exactValue = valueActions[i];
        break;
      }
    }

    if (exactValue) {
      result.min = exactValue.requirement;
      result.max = exactValue.requirement;
    } else {
      // No exact value — apply min_value/max_value individually (last wins).
      for (const action of valueActions) {
        if (action.type === "min_value") result.min = action.requirement;
        else if (action.type === "max_value") result.max = action.requirement;
      }
    }
  }

  // Step: multiple_of takes priority over integer regardless of pipe order.
  const multipleOfItems = findPipeItems(schema, { type: ["multiple_of"] });
  if (multipleOfItems && multipleOfItems.length > 0) {
    const lastMultipleOf = multipleOfItems.at(-1) as unknown as {
      requirement: number | bigint;
    };
    result.step = lastMultipleOf.requirement;
  } else {
    const integerItems = findPipeItems(schema, { type: ["integer"] });
    if (integerItems && integerItems.length > 0) {
      result.step = 1;
    }
  }

  return result;
}

/**
 * Extract constraint attributes from a date base schema by inspecting its pipe.
 * Date values from min_value/max_value are formatted as ISO date strings ("YYYY-MM-DD").
 */
function extractDateConstraints(
  schema: GenericSchema | GenericSchemaAsync,
): Partial<InputConstraints> {
  if (!hasPipe(schema)) return {};

  const result: Partial<InputConstraints> = {};

  // Same precedence rule as extractNumberConstraints: value() wins over min/max.
  const valueActions = getValueActions(schema) as DateValueAction[] | null;
  if (valueActions && valueActions.length > 0) {
    // Reverse scan for the last value() action.
    let exactValue: DateValueAction | undefined;
    for (let i = valueActions.length - 1; i >= 0; i--) {
      if (valueActions[i].type === "value") {
        exactValue = valueActions[i];
        break;
      }
    }

    if (exactValue) {
      const iso = exactValue.requirement.toISOString().slice(0, 10);
      result.min = iso;
      result.max = iso;
    } else {
      // No exact value — apply min_value/max_value individually (last wins).
      for (const action of valueActions) {
        const iso = action.requirement.toISOString().slice(0, 10);
        if (action.type === "min_value") result.min = iso;
        else if (action.type === "max_value") result.max = iso;
      }
    }
  }

  return result;
}

/**
 * Extract constraint attributes from a file or blob base schema by inspecting its pipe.
 * The `accept` attribute is a comma-separated string of MIME types.
 */
function extractFileConstraints(
  schema: GenericSchema | GenericSchemaAsync,
): Partial<InputConstraints> {
  if (!hasPipe(schema)) return {};

  const result: Partial<InputConstraints> = {};

  // Valibot's MimeType.requirement is always readonly string[] (not string | string[])
  const mimeTypeItems = findPipeItems(schema, { type: ["mime_type"] });
  if (mimeTypeItems && mimeTypeItems.length > 0) {
    const lastMimeType = mimeTypeItems.at(-1) as unknown as {
      requirement: readonly string[];
    };
    result.accept = lastMimeType.requirement.join(", ");
  }

  return result;
}

// ---- public API ----

/**
 * Infers HTML `<input>` constraint attributes from a Valibot schema.
 *
 * Inspects the schema's pipe validation actions and wrapping type to produce
 * the HTML constraint attributes (`required`, `minLength`, `maxLength`, `min`,
 * `max`, `step`, `pattern`, `accept`) that should be applied to the input element.
 *
 * - `required` is always present — it is `false` for schemas wrapped in `optional`,
 *   `nullish`, etc., and `true` otherwise.
 * - All other fields are only present when a corresponding validator is found in the pipe.
 * - For structural schemas (object, array, union, picklist, …) only `required` is set.
 * - Date `min`/`max` values are formatted as ISO date strings (`"YYYY-MM-DD"`).
 *
 * @param schema - The Valibot schema to inspect
 * @param options - Configuration options
 * @returns An object with the inferred HTML constraint attributes
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import { inferInputConstraints } from 'formisch-utils';
 *
 * inferInputConstraints(v.pipe(v.string(), v.minLength(3), v.maxLength(50)))
 * // { required: true, minLength: 3, maxLength: 50 }
 *
 * inferInputConstraints(v.optional(v.pipe(v.number(), v.minValue(0), v.integer())))
 * // { required: false, min: 0, step: 1 }
 *
 * inferInputConstraints(v.pipe(v.file(), v.mimeType(["image/jpeg", "image/png"])))
 * // { required: true, accept: "image/jpeg, image/png" }
 *
 * inferInputConstraints(v.pipe(v.string(), v.email(), v.maxLength(255)))
 * // { required: true, maxLength: 255 }
 * ```
 */
export function inferInputConstraints<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema,
  options: InferInputConstraintsOptions<TSchema> = {},
): InferInputConstraintsResult<TSchema> {
  // Step 1: Unwrap wrapper schemas (optional, nullable, nullish, …) and determine required.
  const unwrapped = getWrappedSchema(schema);
  const required = unwrapped.wasWrapped ? unwrapped.required : true;
  const nullable = unwrapped.wasWrapped ? unwrapped.nullable : false;
  const defaultValue = unwrapped.wasWrapped
    ? unwrapped.defaultValue
    : undefined;

  // Step 2: Start building constraints with the required flag.
  const constraints: Partial<InputConstraints> & { required: boolean } = {
    required,
    nullable,
    defaultValue,
  };

  // Step 3: Dispatch to per-type helpers to extract pipe-based constraints.
  const baseSchema = unwrapped.schema;

  switch (baseSchema.type) {
    case "string": {
      Object.assign(constraints, extractStringConstraints(baseSchema));
      break;
    }

    case "number":
    case "bigint": {
      Object.assign(constraints, extractNumberConstraints(baseSchema));
      break;
    }

    case "date": {
      Object.assign(constraints, extractDateConstraints(baseSchema));
      break;
    }

    case "file":
    case "blob": {
      Object.assign(constraints, extractFileConstraints(baseSchema));
      break;
    }

    // All other types (object, array, tuple, record, union, variant, intersect, lazy,
    // literal, picklist, enum, symbol, map, set, nan, null, undefined, any, unknown,
    // never, promise, function, void, instance, custom) have no inferable constraints
    // beyond `required`. Use customConstraints for additional attributes if needed.
    default: {
      break;
    }
  }

  // Step 4: Apply custom constraints — they override any inferred values.
  if (options.customConstraints) {
    const custom = options.customConstraints(
      baseSchema as UnwrappedSchemaOf<TSchema>,
    );
    if (custom !== undefined) {
      Object.assign(constraints, custom);
    }
  }

  return constraints as InferInputConstraintsResult<TSchema>;
}
