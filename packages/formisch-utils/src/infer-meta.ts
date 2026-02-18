/**
 * Extract human-readable metadata from an AST node's `info` block.
 */

import type { ASTNode } from "valibot-ast";
import type { FormFieldMeta } from "./types.ts";
import { unwrapASTNode } from "./unwrap-ast-node.ts";
import { titleCase } from "./_internal/title-case.ts";

/**
 * Infer label, description and placeholder from an AST node.
 *
 * Sources (in priority order):
 *   - `label`       → `info.title` on the innermost node after unwrapping
 *   - `description` → `info.description`
 *   - `placeholder` → `info.metadata.placeholder` (string), then `info.examples[0]` (stringified)
 *
 * When `key` is provided and no title is found, `label` falls back to `titleCase(key)`.
 */
export function inferMeta(node: ASTNode, key?: string): FormFieldMeta {
  // Unwrap to reach the node that carries the schema info
  const { node: inner } = unwrapASTNode(node);

  // `info` may exist on any schema node
  const info = (inner as any).info as
    | {
        title?: string;
        description?: string;
        examples?: readonly unknown[];
        metadata?: Record<string, unknown>;
      }
    | undefined;

  const label = info?.title ?? (key ? titleCase(key) : undefined);
  const description = info?.description;

  let placeholder: string | undefined;
  if (typeof info?.metadata?.placeholder === "string") {
    placeholder = info.metadata.placeholder;
  } else if (info?.examples && info.examples.length > 0) {
    const first = info.examples[0];
    if (first !== null && first !== undefined) {
      placeholder = String(first);
    }
  }

  return {
    ...(label === undefined ? {} : { label }),
    ...(description === undefined ? {} : { description }),
    ...(placeholder === undefined ? {} : { placeholder }),
  };
}
