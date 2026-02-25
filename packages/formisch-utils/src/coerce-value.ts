/**
 * Coerce raw HTML input values to the typed values expected by the schema.
 *
 * HTML inputs always deliver `string` values (even `type="number"`). This
 * utility converts the raw string to the type the schema expects, based on
 * the field's `nodeType` (the innermost AST type after unwrapping wrappers).
 *
 * Framework adapters re-export this; consumers can also use it directly when
 * building custom field renderers.
 */

import type { LeafFormFieldConfig } from "./types.ts";

/**
 * Coerce a raw HTML input value to the typed value expected by the field's schema.
 *
 * @param field    - The leaf field config (provides `nodeType`, `required`, `nullable`).
 * @param rawValue - The raw value from the input element (e.g. `event.target.value`).
 * @returns The coerced value ready to pass to Formisch's `field.onChange()`.
 *
 * @example
 * // In a React field renderer:
 * <Field of={form} path={field.path}>
 *   {(f) => (
 *     <input
 *       {...f.props}
 *       type={field.inputType}
 *       onChange={(e) => f.onChange(coerceValue(field, e.target.value))}
 *     />
 *   )}
 * </Field>
 */
export function coerceValue(field: LeafFormFieldConfig, rawValue: unknown): unknown {
  // Non-string values (boolean from checkbox, File from file input) pass through
  if (typeof rawValue !== "string") return rawValue;

  const empty = rawValue === "";
  // An optional field's empty input means "not provided" → undefined.
  // A required-but-nullable field's empty input means "explicitly null" → null.
  const fallback = field.nullable && field.required ? null : undefined;

  // For fields with options (enum, picklist, union-of-literals), match the raw
  // string against option values to preserve the original type (number, boolean, bigint).
  if (field.options && field.options.length > 0) {
    if (empty) return fallback;
    const match = field.options.find((opt) => String(opt.value) === rawValue);
    return match ? match.value : rawValue;
  }

  switch (field.nodeType) {
    case "number": {
      if (empty) return fallback;
      const n = Number(rawValue);
      return Number.isNaN(n) ? fallback : n;
    }

    case "bigint": {
      if (empty) return fallback;
      try {
        return BigInt(rawValue);
      } catch {
        return fallback;
      }
    }

    case "boolean": {
      // Checkbox raw values are typically booleans already, but handle string edge cases
      return rawValue === "true" || rawValue === "on" || rawValue === "1";
    }

    case "date": {
      if (empty) return fallback;
      const d = new Date(rawValue);
      return Number.isNaN(d.getTime()) ? fallback : d;
    }

    default: {
      return rawValue;
    }
  }
}
