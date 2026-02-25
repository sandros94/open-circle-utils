/**
 * Normalise the supported input forms into a single ASTNode.
 *
 * Consumers can pass:
 *   - A Valibot `GenericSchema*`  → converted to AST via `schemaToAST()`
 *   - A `SchemaToASTResult`       → `.document.schema` is extracted
 *   - An `ASTDocument`            → `.schema` is extracted
 *   - An `ASTNode`                → returned as-is
 */

import { schemaToAST } from "valibot-ast";
import type { ASTDocument, ASTNode, SchemaToASTResult } from "valibot-ast";
import type { GenericSchema, GenericSchemaAsync, StandardProps } from "valibot";

export type ResolveInput =
  | GenericSchema
  | GenericSchemaAsync
  | SchemaToASTResult
  | ASTDocument
  | ASTNode;

/**
 * Returns true when the value is a Valibot schema (has the Standard Schema marker).
 */
export function isValibotSchema(value: unknown): value is GenericSchema | GenericSchemaAsync {
  return (
    typeof value === "object" &&
    value !== null &&
    "~standard" in value &&
    typeof (value as GenericSchema)["~standard"] === "object" &&
    !!value["~standard"] &&
    "vendor" in (value["~standard"] as StandardProps<any, any>) &&
    (value["~standard"] as StandardProps<any, any>).vendor === "valibot"
  );
}

/**
 * Returns true when the value is a `SchemaToASTResult` from `schemaToAST()`.
 */
export function isSchemaToASTResult(value: unknown): value is SchemaToASTResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "document" in value &&
    "referencedDictionary" in value
  );
}

/**
 * Returns true when the value is a valibot-ast `ASTDocument`.
 */
export function isASTDocument(value: unknown): value is ASTDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    "library" in value &&
    "schema" in value
  );
}

/**
 * Returns true when the value is a valibot-ast `ASTNode`.
 *
 * Valibot schemas also carry a `kind` property (e.g. `"schema"`) so we
 * additionally require the absence of `~standard`, which is the Standard
 * Schema marker present on every Valibot schema but never on AST nodes.
 */
export function isASTNode(value: unknown): value is ASTNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    typeof (value as any).kind === "string" &&
    // Valibot schemas carry ~standard; ASTNode objects never do
    !("~standard" in value)
  );
}

/**
 * Normalise any supported input into an `ASTNode`.
 * When a Valibot schema is provided it is converted to AST first.
 */
export function resolveInput(input: ResolveInput): ASTNode {
  if (isSchemaToASTResult(input)) {
    return input.document.schema;
  }
  if (isASTDocument(input)) {
    return input.schema;
  }
  if (isASTNode(input)) {
    return input;
  }
  // Valibot schema
  return schemaToAST(input).document.schema;
}
