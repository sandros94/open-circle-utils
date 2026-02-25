/**
 * Schema info extracted from metadata actions in the pipe.
 * Library-agnostic representation of schema documentation.
 */
export interface SchemaInfoAST {
  title?: string;
  description?: string;
  examples?: readonly unknown[];
  metadata?: Record<string, unknown>;
}
