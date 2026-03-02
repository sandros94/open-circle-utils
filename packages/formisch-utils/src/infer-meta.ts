/**
 * Extract human-readable metadata from an AST node's `info` block.
 */

import type { ASTNode, SchemaInfoAST } from "valibot-ast";
import type { FormFieldMeta } from "./_types/index.ts";
import { unwrapASTNode } from "./unwrap-ast-node.ts";
import { titleCase } from "./_internal/title-case.ts";

function getNodeInfo(node: ASTNode): SchemaInfoAST | undefined {
  return "info" in node ? (node as { info?: SchemaInfoAST }).info : undefined;
}

/**
 * Infer label, description and placeholder from an AST node.
 *
 * Sources (in priority order):
 *   - `label`       → `info.title` (outer node first, then inner)
 *   - `description` → `info.description` (outer node first, then inner)
 *   - `placeholder` → `info.metadata.placeholder` (string), then `info.examples[0]` (stringified)
 *
 * The outer node is checked first so that metadata placed on a wrapper pipe
 * (e.g. `v.pipe(v.optional(v.string()), v.title("Name"))`) takes priority
 * over metadata on the innermost schema node.
 *
 * When `key` is provided and no title is found, `label` falls back to `titleCase(key)`.
 */
export function inferMeta(node: ASTNode, key?: string): FormFieldMeta {
  const { node: inner } = unwrapASTNode(node);

  // Check outer node first (wrapper-level metadata takes priority),
  // then fall back to the innermost node's info.
  const outerInfo = getNodeInfo(node);
  const innerInfo = node !== inner ? getNodeInfo(inner) : undefined;

  const label = outerInfo?.title ?? innerInfo?.title ?? (key ? titleCase(key) : undefined);
  const description = outerInfo?.description ?? innerInfo?.description;

  // Placeholder: check outer then inner for metadata.placeholder and examples
  let placeholder: string | undefined;
  for (const info of [outerInfo, innerInfo]) {
    if (!info) continue;
    if (typeof info.metadata?.placeholder === "string") {
      placeholder = info.metadata.placeholder;
      break;
    }
    if (info.examples && info.examples.length > 0) {
      const first = info.examples[0];
      if (first !== null && first !== undefined) {
        placeholder = String(first);
        break;
      }
    }
  }

  return {
    ...(label === undefined ? {} : { label }),
    ...(description === undefined ? {} : { description }),
    ...(placeholder === undefined ? {} : { placeholder }),
  };
}
