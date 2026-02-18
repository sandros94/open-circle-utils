/* eslint-disable unicorn/no-useless-switch-case */
/**
 * Derive a sensible initial value for a single AST node.
 *
 * The result is suitable for use as a single field's contribution to Formisch's
 * `initialInput`. For full-object generation use `generateInitialInput`.
 */

import type {
  ASTNode,
  EnumASTNode,
  LiteralASTNode,
  ObjectASTNode,
  PicklistASTNode,
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
 * Type defaults:
 *   `string`              → `""`
 *   `number` / `bigint`   → `0`
 *   `boolean`             → `false`
 *   `date`                → `new Date()`
 *   `literal`             → the literal value itself
 *   `enum`                → first enum value
 *   `picklist`            → first option
 *   `object` (all kinds)  → `{}` with each entry recursed
 *   `array`               → `[]`
 *   `tuple` (all kinds)   → `[]` (items start empty; consumers add them)
 *   `union`               → initial value of the first option
 *   `variant`             → initial value of the first branch
 *   `intersect`           → `{}` (merge is caller's concern)
 *   everything else       → `undefined`
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

function deriveDefault(node: ASTNode): unknown {
  switch (node.type) {
    case "string": {
      return "";
    }

    case "number":
    case "bigint": {
      return 0;
    }

    case "boolean": {
      return false;
    }

    case "date": {
      return new Date();
    }

    case "literal": {
      const literal = node as LiteralASTNode;
      return literal.literal;
    }

    case "enum": {
      const enumNode = node as EnumASTNode;
      const values = Object.values(enumNode.enum);
      return values.length > 0 ? values[0] : undefined;
    }

    case "picklist": {
      const picklist = node as PicklistASTNode;
      return picklist.options.length > 0 ? picklist.options[0] : undefined;
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
      // Start empty — Formisch consumers insert items with `insert()`
      return [];
    }

    case "union": {
      const options = (node as any).options as ASTNode[] | undefined;
      if (options && options.length > 0) {
        return inferInitialValue(options[0]!);
      }
      return undefined;
    }

    case "variant": {
      const options = (node as any).options as ASTNode[] | undefined;
      if (options && options.length > 0) {
        return inferInitialValue(options[0]!);
      }
      return undefined;
    }

    case "intersect": {
      // Best-effort: return an empty object; consumers merge
      return {};
    }

    case "null": {
      return null;
    }

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
