/**
 * Map an AST node to an HTML input `type` attribute value.
 *
 * Returns `undefined` for structural nodes (object, array, tuple, variant, union)
 * and for choice nodes (enum, picklist) — callers decide the appropriate widget
 * (select, radio group, combobox, etc.) by inspecting the `FormFieldConfig.kind`.
 */

import type { ASTNode, ValidationASTNode } from "valibot-ast";
import { unwrapASTNode } from "./unwrap-ast-node.ts";

/**
 * Walk the `pipe` of a schema node and find the first validation whose `type`
 * matches one of the provided type names.
 */
function findPipeValidation(
  node: ASTNode,
  ...types: string[]
): ValidationASTNode | undefined {
  const pipe = (node as any).pipe as ASTNode[] | undefined;
  if (!pipe) return undefined;
  return pipe.find(
    (item): item is ValidationASTNode =>
      item.kind === "validation" && types.includes(item.type),
  ) as ValidationASTNode | undefined;
}

/**
 * Infer the HTML `<input type="…">` value from an AST node.
 *
 * Unwraps any wrapper layers first, then inspects the innermost schema type
 * and its pipe validations.
 *
 * | Schema / pipe                          | Returns              |
 * |----------------------------------------|----------------------|
 * | `string` + `email`                     | `"email"`            |
 * | `string` + `url`                       | `"url"`              |
 * | `string` + `iso_date`                  | `"date"`             |
 * | `string` + `iso_date_time`/`timestamp` | `"datetime-local"`   |
 * | `string` + `iso_time`                  | `"time"`             |
 * | `string` + `iso_week`                  | `"week"`             |
 * | `string` + `hex_color`                 | `"color"`            |
 * | `string` (no format validation)        | `"text"`             |
 * | `number` / `bigint`                    | `"number"`           |
 * | `boolean`                              | `"checkbox"`         |
 * | `date`                                 | `"date"`             |
 * | `file` / `blob`                        | `"file"`             |
 * | `enum` / `picklist` / `literal`        | `undefined`          |
 * | `union` / `variant`                    | `undefined`          |
 * | `object` / `array` / `tuple`           | `undefined`          |
 * | everything else                        | `undefined`          |
 */
export function inferInputType(node: ASTNode): string | undefined {
  const { node: inner } = unwrapASTNode(node);

  switch (inner.type) {
    case "string": {
      if (findPipeValidation(inner, "email")) return "email";
      if (findPipeValidation(inner, "url")) return "url";
      if (findPipeValidation(inner, "iso_date")) return "date";
      if (findPipeValidation(inner, "iso_date_time", "iso_timestamp"))
        return "datetime-local";
      if (findPipeValidation(inner, "iso_time")) return "time";
      if (findPipeValidation(inner, "iso_week")) return "week";
      if (findPipeValidation(inner, "hex_color")) return "color";
      return "text";
    }

    case "number":
    case "bigint": {
      return "number";
    }

    case "boolean": {
      return "checkbox";
    }

    case "date": {
      return "date";
    }

    case "file":
    case "blob": {
      return "file";
    }

    // Choice / structural / unknown → caller decides the widget
    case "enum":
    case "picklist":
    case "literal":
    case "union":
    case "variant":
    case "object":
    case "loose_object":
    case "strict_object":
    case "object_with_rest":
    case "array":
    case "tuple":
    case "loose_tuple":
    case "strict_tuple":
    case "tuple_with_rest":
    case "intersect":
    case "record":
    case "map":
    case "set":
    case "lazy":
    case "instance":
    case "function":
    case "any":
    case "unknown":
    case "never":
    case "nan":
    case "null":
    case "undefined":
    case "void":
    case "symbol":
    case "promise": {
      return undefined;
    }

    default: {
      return undefined;
    }
  }
}
