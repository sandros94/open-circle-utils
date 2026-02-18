/**
 * Peel all wrapper layers (optional/nullable/nullish/non_X/undefinedable/exact_optional)
 * from an ASTNode and return the innermost schema node together with flags that
 * describe the wrapping semantics.
 */

import type { ASTNode, WrappedASTNode } from "valibot-ast";
import type { UnwrappedASTNode } from "./types.ts";

const WRAPPER_TYPES = new Set([
  "optional",
  "nullable",
  "nullish",
  "non_optional",
  "non_nullable",
  "non_nullish",
  "exact_optional",
  "undefinedable",
]);

function isWrapped(node: ASTNode): node is WrappedASTNode {
  return node.kind === "schema" && WRAPPER_TYPES.has(node.type);
}

/**
 * Peel all wrapper layers off `node` and collect the wrapping semantics.
 *
 * Wrapper semantics (accumulated across layers, outer overrides inner for `non_*`):
 *   optional | exact_optional | undefinedable  →  required = false
 *   non_optional | non_nullish                 →  required = true  (override)
 *   nullable                                   →  nullable = true
 *   non_nullable | non_nullish                 →  nullable = false (override)
 *   nullish                                    →  required = false, nullable = true
 *
 * The `default` value is taken from the **outermost** wrapper that carries one,
 * matching Valibot's own resolution behaviour.
 */
export function unwrapASTNode(node: ASTNode): UnwrappedASTNode {
  let required = true;
  let nullable = false;
  let requiredLocked = false;
  let nullableLocked = false;
  let defaultValue: unknown = undefined;
  let hasDefault = false;
  let current: ASTNode = node;

  while (isWrapped(current)) {
    const wrapper = current as WrappedASTNode;

    // Capture default from the outermost wrapper that has one
    if (!hasDefault && "default" in wrapper && wrapper.default !== undefined) {
      defaultValue = wrapper.default;
      hasDefault = true;
    }

    switch (wrapper.type) {
      case "optional":
      case "exact_optional":
      case "undefinedable": {
        if (!requiredLocked) required = false;
        break;
      }
      case "nullable": {
        if (!nullableLocked) nullable = true;
        break;
      }
      case "nullish": {
        if (!requiredLocked) required = false;
        if (!nullableLocked) nullable = true;
        break;
      }
      case "non_optional": {
        required = true;
        requiredLocked = true;
        break;
      }
      case "non_nullable": {
        nullable = false;
        nullableLocked = true;
        break;
      }
      case "non_nullish": {
        required = true;
        nullable = false;
        requiredLocked = true;
        nullableLocked = true;
        break;
      }
    }

    current = wrapper.wrapped;
  }

  return {
    node: current,
    required,
    nullable,
    ...(hasDefault ? { default: defaultValue } : {}),
  };
}
