/**
 * AST (Abstract Syntax Tree) utilities for validation schemas.
 *
 * This module provides bidirectional conversion between validation schemas (like Valibot)
 * and JSON-serializable AST representations. The AST format is library-agnostic,
 * allowing for future support of other validation libraries like Zod and ArkType.
 */

export * from './to-ast.ts';
export * from './to-schema.ts';
export * from './to-schema-async.ts';
export { ASTDocumentSchema } from './schema.ts';
