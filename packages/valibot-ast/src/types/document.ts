import type { ASTNode } from "./kind.ts";

/**
 * Supported validation libraries.
 */
export type ValidationLibrary = "valibot" | (string & {});

/**
 * AST specification version. Follows MAJOR.MINOR.PATCH format.
 */
export type ASTVersion = `${number}.${number}.${number}`;

/**
 * Metadata for a dictionary entry — describes an unserializable operation.
 * Stored in the AST document as documentation for consumers.
 */
export interface DictionaryEntryMeta {
  /** The function or class name of the custom operation. */
  name?: string;
  /** Description of what the operation does. */
  description?: string;
  /** Categorization hint (e.g., 'validation', 'transformation', 'recursive', 'instance'). */
  category?: string;
  /** For instance schemas: the class constructor name. */
  className?: string;
}

/**
 * Root AST document wrapping the schema tree and dictionary manifest.
 */
export interface ASTDocument {
  /** Version of the AST specification used. */
  version: ASTVersion;
  /** The source validation library. */
  library: ValidationLibrary;
  /** The root schema node. */
  schema: ASTNode;
  /**
   * Unified dictionary manifest. Each key references an entry from
   * the dictionary provided at serialization/deserialization time.
   * The value is documentation-only metadata for the AST consumer.
   */
  dictionary?: Record<string, DictionaryEntryMeta>;
  /** Arbitrary document-level metadata. */
  metadata?: Record<string, unknown>;
}
