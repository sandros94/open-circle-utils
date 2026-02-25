/**
 * Generate a complete `initialInput` object from a Valibot schema or AST.
 *
 * The result is ready to pass directly to Formisch's `useForm`/`createForm`
 * `initialInput` option.
 */

import type { GenericSchema, GenericSchemaAsync, InferInput } from "valibot";
import type { ASTDocument, ASTNode, SchemaToASTResult } from "valibot-ast";
import { resolveInput } from "./_internal/resolve-input.ts";
import { inferInitialValue } from "./infer-initial-value.ts";

/**
 * Generate a typed `initialInput` from a Valibot schema.
 *
 * The return type is inferred from the schema, giving full type-safety when
 * passing the result to `useForm({ schema, initialInput })`.
 *
 * @example
 * ```ts
 * const schema = v.object({ name: v.string(), age: v.optional(v.number()) });
 * const initial = generateInitialInput(schema);
 * // → { name: "", age: undefined }
 * ```
 */
export function generateInitialInput<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema
): InferInput<TSchema>;

/**
 * Generate an `initialInput` from a valibot-ast `ASTDocument` or `ASTNode`.
 *
 * Type information is not available at this point, so the return type defaults
 * to `unknown`. Provide an explicit type parameter when you know the shape:
 *
 * @example
 * ```ts
 * const doc = schemaToAST(MySchema);
 * const initial = generateInitialInput<InferInput<typeof MySchema>>(doc);
 * ```
 */
export function generateInitialInput<T = unknown>(
  input: SchemaToASTResult | ASTDocument | ASTNode
): T;

export function generateInitialInput(
  input: GenericSchema | GenericSchemaAsync | SchemaToASTResult | ASTDocument | ASTNode
): unknown {
  const node = resolveInput(input);
  return inferInitialValue(node);
}
