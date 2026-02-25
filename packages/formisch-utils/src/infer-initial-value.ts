/* eslint-disable unicorn/no-useless-switch-case */
/**
 * Derive a sensible initial value for a single AST node.
 *
 * The result is suitable for use as a single field's contribution to Formisch's
 * `initialInput`. For full-object generation use `generateInitialInput`.
 */

import type {
  ASTNode,
  LiteralASTNode,
  ObjectASTNode,
  SerializedBigInt,
  UnionASTNode,
  VariantASTNode,
} from "valibot-ast";
import { unwrapASTNode } from "./unwrap-ast-node.ts";

/**
 * Infer the initial value for a schema node.
 *
 * Resolution order:
 *  1. If the outermost wrapper carries a `default` value → use it
 *  2. If the wrapper makes the field optional/undefinedable → `undefined`
 *  3. If the wrapper makes the field nullable (but not optional) → `null`
 *  4. Otherwise derive from the innermost node's type
 *
 * Type defaults (step 4):
 *   `string`              → `""`      (natural empty state for text inputs)
 *   `boolean`             → `false`   (natural unchecked checkbox state)
 *   `literal`             → the literal value itself (only valid option)
 *   `object` (all kinds)  → `{}` with each entry recursed
 *   `array`               → `[]`
 *   `tuple` (all kinds)   → `[]`
 *   `union`               → initial value of the first option
 *   `variant`             → initial value of the first branch
 *   `intersect`           → `{}`
 *   `null`                → `null`
 *   everything else       → `undefined` (user must explicitly fill)
 *
 * Notably, `number`, `bigint`, `date`, `enum`, and `picklist` return
 * `undefined` for required fields without explicit defaults. This avoids
 * pre-filling values (like `0` or the first enum member) that the user
 * may not notice, defeating the purpose of required-field validation.
 */
export function inferInitialValue(node: ASTNode): unknown {
  const unwrapped = unwrapASTNode(node);

  // 1. Explicit default value wins
  if ("default" in unwrapped && unwrapped.default !== undefined) {
    return unwrapped.default;
  }

  // 2. Optional/undefinedable wrapper without a default → undefined
  if (!unwrapped.required) {
    return undefined;
  }

  // 3. Nullable but required (nullable without optional) → null
  if (unwrapped.nullable) {
    return null;
  }

  // 4. Derive from the inner type
  return deriveDefault(unwrapped.node);
}

function deserializeBigInt(value: SerializedBigInt): bigint {
  return BigInt(value.value);
}

function isSerializedBigInt(value: unknown): value is SerializedBigInt {
  return (
    typeof value === "object" &&
    value !== null &&
    "__type" in value &&
    (value as SerializedBigInt).__type === "bigint"
  );
}

function deriveDefault(node: ASTNode): unknown {
  switch (node.type) {
    case "string": {
      return "";
    }

    case "boolean": {
      return false;
    }

    case "literal": {
      const literal = (node as LiteralASTNode).literal;
      return isSerializedBigInt(literal) ? deserializeBigInt(literal) : literal;
    }

    case "object":
    case "loose_object":
    case "strict_object":
    case "object_with_rest": {
      const obj = node as ObjectASTNode;
      const result: Record<string, unknown> = {};
      for (const [key, entryNode] of Object.entries(obj.entries)) {
        result[key] = inferInitialValue(entryNode);
      }
      return result;
    }

    case "array": {
      return [];
    }

    case "tuple":
    case "loose_tuple":
    case "strict_tuple":
    case "tuple_with_rest": {
      return [];
    }

    case "union": {
      const options = (node as UnionASTNode).options;
      if (options.length > 0) {
        return inferInitialValue(options[0]!);
      }
      return undefined;
    }

    case "variant": {
      const options = (node as VariantASTNode).options;
      if (options.length > 0) {
        return inferInitialValue(options[0]!);
      }
      return undefined;
    }

    case "intersect": {
      return {};
    }

    case "null": {
      return null;
    }

    // number, bigint, date, enum, picklist — intentionally undefined.
    // These types have no universally safe "empty" value; pre-filling
    // them (e.g. 0, first enum member) can silently pass validation
    // when the user hasn't actually made a choice.
    case "number":
    case "bigint":
    case "date":
    case "enum":
    case "picklist":
    case "undefined":
    case "void":
    case "never":
    case "nan":
    case "symbol":
    case "any":
    case "unknown":
    case "lazy":
    case "instance":
    case "function":
    case "map":
    case "set":
    case "record":
    case "blob":
    case "file":
    case "promise":
    default: {
      return undefined;
    }
  }
}
