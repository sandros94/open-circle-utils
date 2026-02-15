import type { GenericSchema, GenericSchemaAsync } from "valibot";
import {
  type GetWrappedSchema,
  type GetPipeItems,
  getWrappedSchema,
  hasPipe,
  getPipeActions,
} from "valibot-introspection";

// ---- private type-level utilities ----

/**
 * Check (at the type level) whether a pipe tuple contains at least one action
 * whose `.type` is assignable to `T`.
 */
type HasPipeActionType<TPipe extends readonly unknown[], T extends string> =
  Extract<TPipe[number], { type: T }> extends never ? false : true;

/**
 * Type-level mirror of `inferStringInputType()`.
 * Given a string-base schema (plain or piped), infers the HTML input type
 * by inspecting the pipe tuple in priority order.
 */
type InferStringInputTypeResult<
  TSchema extends GenericSchema | GenericSchemaAsync,
> =
  GetPipeItems<TSchema> extends infer TPipe
    ? TPipe extends readonly unknown[]
      ? HasPipeActionType<TPipe, "email"> extends true
        ? "email"
        : HasPipeActionType<TPipe, "url"> extends true
          ? "url"
          : HasPipeActionType<
                TPipe,
                "iso_date_time" | "iso_timestamp"
              > extends true
            ? "datetime-local"
            : HasPipeActionType<TPipe, "iso_date"> extends true
              ? "date"
              : HasPipeActionType<TPipe, "iso_time"> extends true
                ? "time"
                : HasPipeActionType<TPipe, "iso_week"> extends true
                  ? "week"
                  : HasPipeActionType<TPipe, "hex_color"> extends true
                    ? "color"
                    : "text"
      : "text" // null — no pipe
    : "text";

/**
 * The deeply-unwrapped schema type (strips all optional/nullable/nullish wrappers).
 * Reuses `GetWrappedSchema` from valibot-introspection which already has this
 * built into its return type via `DeepUnwrapSchema`.
 */
type UnwrappedSchemaOf<TSchema extends GenericSchema | GenericSchemaAsync> =
  GetWrappedSchema<TSchema>["schema"];

/**
 * The subset of schemas (after deep-unwrapping) that are NOT handled natively by
 * `inferInputType` and therefore reach the `customInferrer` callback.
 * Used to give `customInferrer` a precise parameter type.
 */
type CustomInferrerSchemaOf<
  TSchema extends GenericSchema | GenericSchemaAsync,
> = Exclude<
  UnwrappedSchemaOf<TSchema>,
  {
    type: "string" | "number" | "bigint" | "boolean" | "date" | "file" | "blob";
  }
>;

/**
 * Base inference result — purely schema-driven, ignoring any `customInferrer`.
 * Structural / non-scalar schemas resolve to `undefined`.
 */
type _BaseInferResult<TSchema extends GenericSchema | GenericSchemaAsync> =
  GetWrappedSchema<TSchema>["schema"] extends infer TUnwrapped
    ? TUnwrapped extends GenericSchema | GenericSchemaAsync
      ? TUnwrapped extends { type: "string" }
        ? InferStringInputTypeResult<TUnwrapped>
        : TUnwrapped extends { type: "number" | "bigint" }
          ? "number"
          : TUnwrapped extends { type: "boolean" }
            ? "checkbox"
            : TUnwrapped extends { type: "date" }
              ? "date"
              : TUnwrapped extends { type: "file" | "blob" }
                ? "file"
                : undefined
      : undefined
    : undefined;

// ---- public types ----

/**
 * The set of HTML input types that can be inferred from a Valibot schema.
 *
 * Types that require application-level semantic knowledge (`'password'`, `'range'`,
 * `'search'`, `'hidden'`) are intentionally excluded — use `InferInputTypeOptions.customInferrer`
 * for those.
 *
 * Note: `'tel'` is included as a valid return value but cannot be automatically inferred
 * from standard Valibot validators; return it from `customInferrer` when needed.
 */
export type InferredInputType =
  | "text"
  | "email"
  | "url"
  | "number"
  | "tel"
  | "date"
  | "datetime-local"
  | "time"
  | "week"
  | "color"
  | "checkbox"
  | "file";

/**
 * The precise return type of `inferInputType<TSchema, TCustomReturn>`.
 *
 * - Wrapping schemas (optional, nullable, nullish, …) are transparent — the result
 *   is determined by the innermost base schema.
 * - For `string` base schemas the pipe is also inspected: format validators such as
 *   `v.email()`, `v.url()`, `v.isoDate()`, etc. narrow the result further.
 * - Structural schemas (object, array, picklist, enum, union, variant, …) resolve to
 *   `undefined` when no `customInferrer` is provided.
 * - When `TCustomReturn` is provided (via `customInferrer`), schemas that would normally
 *   resolve to `undefined` instead resolve to `TCustomReturn` (the `undefined` slot is
 *   replaced by whatever the custom inferrer can return, including `undefined` itself).
 *
 * @example
 * ```typescript
 * // No custom inferrer — structural schemas resolve to undefined
 * type A = InferInputTypeResult<typeof v.pipe(v.string(), v.email())>
 * //   ^? 'email'
 * type B = InferInputTypeResult<typeof v.optional(v.number())>
 * //   ^? 'number'
 * type C = InferInputTypeResult<typeof v.picklist(['a', 'b'])>
 * //   ^? undefined
 *
 * // With a custom inferrer — return type reflects what it can return
 * type D = InferInputTypeResult<typeof v.picklist(['a', 'b']), 'text'>
 * //   ^? 'text'
 * type E = InferInputTypeResult<typeof v.picklist(['a', 'b']), 'text' | undefined>
 * //   ^? 'text' | undefined
 * ```
 */
export type InferInputTypeResult<
  TSchema extends GenericSchema | GenericSchemaAsync,
  TCustomReturn extends string | undefined = undefined,
> = [TCustomReturn] extends [undefined]
  ? _BaseInferResult<TSchema>
  : CustomInferrerSchemaOf<TSchema> extends never
    ? _BaseInferResult<TSchema> // customInferrer provided but schema is always native — never called
    : NonNullable<_BaseInferResult<TSchema>> | TCustomReturn;

/**
 * Options for inferring the HTML input type from a Valibot schema.
 */
export interface InferInputTypeOptions<
  TSchema extends GenericSchema | GenericSchemaAsync =
    | GenericSchema
    | GenericSchemaAsync,
  TCustomReturn extends string | undefined = undefined,
> {
  /**
   * Custom inferrer used as a fallback when the schema type cannot be automatically
   * mapped to an HTML input type (i.e. structural schemas such as object, array,
   * picklist, enum, union, variant, …).
   *
   * The function receives the **already-unwrapped** schema (wrappers like optional,
   * nullable, nullish have already been stripped), so there is no need to call
   * `getWrappedSchema` inside this callback.
   *
   * TypeScript infers `TCustomReturn` from this callback's return type and propagates
   * it to the return type of `inferInputType` — so returning `'tel' as const` will
   * make `inferInputType` resolve to `'tel'` for schemas that reach this callback.
   *
   * Return `undefined` to signal "not inferable" for that schema. Any string is
   * accepted, though using values from `InferredInputType` is recommended.
   *
   * TypeScript will narrow the parameter type to only the schemas that actually
   * reach this callback. If `TSchema` is always handled natively (e.g. `v.number()`),
   * the parameter type will be `never`.
   *
   * @param schema - The unwrapped, non-natively-handled schema
   * @returns The inferred HTML input type (any string), or undefined
   *
   * @example
   * ```typescript
   * // Treat picklist as a plain text input backed by a <datalist>
   * inferInputType(v.picklist(['a', 'b']), {
   *   customInferrer: (s) => s.type === 'picklist' ? 'text' : undefined,
   * });
   *
   * // Return a custom string for a proprietary schema type
   * inferInputType(myCustomSchema, {
   *   customInferrer: () => 'color-picker',
   * });
   * ```
   */
  customInferrer?: (schema: CustomInferrerSchemaOf<TSchema>) => TCustomReturn;
}

// ---- private runtime helper ----

/**
 * Infer the HTML input type for a string-base schema by inspecting its pipe actions.
 *
 * Priority order (highest to lowest):
 * email > url > datetime-local (iso_date_time | iso_timestamp) > date (iso_date) >
 * time (iso_time) > week (iso_week) > color (hex_color) > text
 */
function inferStringInputType(
  schema: GenericSchema | GenericSchemaAsync,
): InferredInputType {
  if (!hasPipe(schema)) return "text";

  const actions = getPipeActions(schema);
  if (!actions || actions.length === 0) return "text";

  const types = new Set(actions.map((a) => a.type));

  if (types.has("email")) return "email";
  if (types.has("url")) return "url";
  if (types.has("iso_date_time") || types.has("iso_timestamp"))
    return "datetime-local";
  if (types.has("iso_date")) return "date";
  if (types.has("iso_time")) return "time";
  if (types.has("iso_week")) return "week";
  if (types.has("hex_color")) return "color";

  return "text";
}

// ---- public API ----

/**
 * Infers the appropriate HTML `<input type>` attribute value from a Valibot schema.
 *
 * The function inspects the base schema type and, for string schemas, examines pipe
 * validation actions to determine the most specific format.
 *
 * Returns `undefined` for schemas that do not correspond to a scalar `<input>` field
 * (e.g. objects, arrays, picklist/enum — which should use a `<select>` instead).
 * This makes it safe to call on every field of an object schema and skip non-input fields.
 *
 * The return type is narrowed based on both the `TSchema` and the `TCustomReturn` inferred
 * from the `customInferrer` callback, giving callers accurate type information without
 * extra casting.
 *
 * @param schema - The Valibot schema to inspect
 * @param options - Configuration options
 * @returns The inferred HTML input type, or `undefined` if the schema is not a scalar input
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import { inferInputType } from 'formisch-utils';
 *
 * inferInputType(v.pipe(v.string(), v.email()))              // 'email'
 * inferInputType(v.pipe(v.string(), v.url()))                // 'url'
 * inferInputType(v.number())                                 // 'number'
 * inferInputType(v.boolean())                                // 'checkbox'
 * inferInputType(v.optional(v.pipe(v.string(), v.email())))  // 'email'
 * inferInputType(v.picklist(['a', 'b']))                     // undefined  (use <select>)
 * inferInputType(v.picklist(['a', 'b']), {
 *   customInferrer: (s) => 'text' as const,                  // 'text'
 * })
 * ```
 */
export function inferInputType<
  TSchema extends GenericSchema | GenericSchemaAsync,
  TCustomReturn extends string | undefined = undefined,
>(
  schema: TSchema,
  options: InferInputTypeOptions<TSchema, TCustomReturn> = {},
): InferInputTypeResult<TSchema, TCustomReturn> {
  // Always unwrap optional/nullable/nullish wrappers first.
  // We only care about the base schema type — wrapper flags are intentionally ignored.
  const unwrapped = getWrappedSchema(schema);
  const targetSchema = unwrapped.schema;

  type R = InferInputTypeResult<TSchema, TCustomReturn>;

  switch (targetSchema.type) {
    case "string": {
      return inferStringInputType(targetSchema) as unknown as R;
    }

    case "number":
    case "bigint": {
      return "number" as unknown as R;
    }

    case "boolean": {
      return "checkbox" as unknown as R;
    }

    case "date": {
      return "date" as unknown as R;
    }

    case "file":
    case "blob": {
      return "file" as unknown as R;
    }

    // All other types (object, array, tuple, record, union, variant, intersect, lazy,
    // literal, picklist, enum, symbol, map, set, nan, null, undefined, any, unknown,
    // never, promise, function, void, instance, custom) are not scalar input fields.
    default: {
      if (options.customInferrer) {
        return options.customInferrer(
          targetSchema as CustomInferrerSchemaOf<TSchema>,
        ) as unknown as R;
      }
      return undefined as unknown as R;
    }
  }
}
