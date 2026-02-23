/**
 * AST (Abstract Syntax Tree) types for representing validation schemas as JSON.
 * This allows serialization, inspection, and reconstruction of schemas.
 * The types are designed to be validation library agnostic (Valibot, Zod, ArkType, etc.).
 */

/**
 * Supported validation libraries.
 */
export type ValidationLibrary = "valibot" | "zod" | "arktype" | "yup" | "custom";

/**
 * Version of the AST specification.
 * Format: MAJOR.MINOR.PATCH
 */
export type ASTVersion = string;

/**
 * Root AST document that wraps the schema and provides metadata.
 */
export interface ASTDocument {
  /**
   * Version of the AST specification used.
   */
  version: ASTVersion;

  /**
   * The source validation library.
   */
  library: ValidationLibrary;

  /**
   * The root schema node.
   */
  schema: ASTNode;

  /**
   * Optional dictionary of custom transformation keys.
   * Maps a unique key to metadata about the transformation.
   */
  customTransformations?: Record<string, CustomOperationMeta>;

  /**
   * Optional dictionary of custom validation keys.
   * Maps a unique key to metadata about the validation.
   */
  customValidations?: Record<string, CustomOperationMeta>;

  /**
   * Optional dictionary of custom instance keys.
   * Maps a unique key to metadata about the instance class.
   */
  customInstances?: Record<string, CustomOperationMeta>;

  /**
   * Optional dictionary of custom lazy schema keys.
   * Maps a unique key to metadata about the lazy schema getter function.
   */
  customLazy?: Record<string, CustomOperationMeta>;

  /**
   * Optional dictionary of closures used in custom operations.
   * Maps a unique key to metadata about the closure context.
   */
  customClosures?: Record<string, CustomOperationMeta>;

  /**
   * Optional metadata for the entire document.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Unified metadata for custom operations that cannot be automatically serialized.
 * The dictionary key serves as the unique identifier for lookup.
 * All fields are optional to provide flexibility in documentation.
 */
export interface CustomOperationMeta {
  /**
   * The function or class name of the custom operation.
   */
  name?: string;

  /**
   * Optional description of what the operation does.
   */
  description?: string;

  /**
   * Optional type categorization (e.g., 'validation', 'transformation', 'recursive').
   * Useful for filtering or grouping operations.
   */
  type?: string;

  /**
   * For instance schemas: the class constructor name.
   */
  className?: string;

  /**
   * For closures: captured context (for documentation purposes).
   */
  context?: Record<string, unknown>;
}

export type ASTKind = "schema" | "validation" | "transformation" | "metadata";

/**
 * Base AST node that all schema representations inherit from.
 */
export interface BaseASTNode {
  kind: ASTKind;
  type: string;
  async?: boolean;
  expects?: string;
}

/**
 * AST representation of a primitive schema (string, number, boolean, etc.)
 */
export interface PrimitiveASTNode extends BaseASTNode {
  kind: "schema";
  type:
    | "string"
    | "number"
    | "boolean"
    | "bigint"
    | "date"
    | "blob"
    | "symbol"
    | "any"
    | "unknown"
    | "never"
    | "nan"
    | "null"
    | "undefined"
    | "void"
    | "file"
    | "promise";
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of a literal schema.
 */
export interface LiteralASTNode extends BaseASTNode {
  kind: "schema";
  type: "literal";
  literal: string | number | bigint | boolean;
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of an object schema.
 */
export interface ObjectASTNode extends BaseASTNode {
  kind: "schema";
  type: "object" | "loose_object" | "strict_object" | "object_with_rest";
  entries: Record<string, ASTNode>;
  rest?: ASTNode;
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of an array schema.
 */
export interface ArrayASTNode extends BaseASTNode {
  kind: "schema";
  type: "array";
  item: ASTNode;
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of a tuple schema.
 */
export interface TupleASTNode extends BaseASTNode {
  kind: "schema";
  type: "tuple" | "loose_tuple" | "strict_tuple" | "tuple_with_rest";
  items: ASTNode[];
  rest?: ASTNode;
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of a union schema.
 */
export interface UnionASTNode extends BaseASTNode {
  kind: "schema";
  type: "union";
  options: ASTNode[];
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of a variant (discriminated union) schema.
 */
export interface VariantASTNode extends BaseASTNode {
  kind: "schema";
  type: "variant";
  key: string;
  options: ASTNode[];
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of an enum schema.
 */
export interface EnumASTNode extends BaseASTNode {
  kind: "schema";
  type: "enum";
  enum: Record<string, string | number>;
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of a picklist schema.
 */
export interface PicklistASTNode extends BaseASTNode {
  kind: "schema";
  type: "picklist";
  options: readonly (string | number | bigint | boolean)[];
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of a record schema.
 */
export interface RecordASTNode extends BaseASTNode {
  kind: "schema";
  type: "record";
  key: ASTNode;
  value: ASTNode;
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of a map schema.
 */
export interface MapASTNode extends BaseASTNode {
  kind: "schema";
  type: "map";
  key: ASTNode;
  value: ASTNode;
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of a set schema.
 */
export interface SetASTNode extends BaseASTNode {
  kind: "schema";
  type: "set";
  item: ASTNode;
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of an intersect schema.
 */
export interface IntersectASTNode extends BaseASTNode {
  kind: "schema";
  type: "intersect";
  options: ASTNode[];
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of an instance schema.
 */
export interface InstanceASTNode extends BaseASTNode {
  kind: "schema";
  type: "instance";
  class: string; // Class name as string (cannot serialize constructor)
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
  /**
   * Reference to a custom instance in the document's dictionary.
   * If present, this instance requires a custom implementation.
   */
  customKey?: string;
}

/**
 * AST representation of a lazy/recursive schema.
 */
export interface LazyASTNode extends BaseASTNode {
  kind: "schema";
  type: "lazy";
  /**
   * Reference to a custom lazy schema in the document's dictionary.
   * If present, this lazy schema requires a custom getter implementation.
   */
  customKey?: string;
  /**
   * Note for lazy schemas without custom key.
   */
  note?: "lazy-schema-requires-runtime-getter";
  info?: SchemaInfoAST;
}

/**
 * AST representation of wrapped schemas (optional, nullable, nullish).
 */
export interface WrappedASTNode extends BaseASTNode {
  kind: "schema";
  type:
    | "optional"
    | "nullable"
    | "nullish"
    | "non_optional"
    | "non_nullable"
    | "non_nullish"
    | "exact_optional"
    | "undefinedable";
  wrapped: ASTNode;
  default?: any;
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of a function schema.
 */
export interface FunctionASTNode extends BaseASTNode {
  kind: "schema";
  type: "function";
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
}

/**
 * AST representation of validation actions.
 */
export interface ValidationASTNode extends BaseASTNode {
  kind: "validation";
  type: string; // e.g., 'email', 'min_length', 'max_value'
  locales?: Intl.LocalesArgument;
  requirement?: any;
  message?: string;
  /**
   * Reference to a custom validation in the document's dictionary.
   * If present, this validation requires a custom implementation.
   */
  customKey?: string;
}

/**
 * AST representation of transformation actions.
 */
export interface TransformationASTNode extends BaseASTNode {
  kind: "transformation";
  type: string; // e.g., 'to_lowercase', 'trim'
  requirement?: any;
  message?: string;
  note?: string; // For custom transformations that can't be serialized
  /**
   * Reference to a custom transformation in the document's dictionary.
   * If present, this transformation requires a custom implementation.
   */
  customKey?: string;
}

/**
 * AST representation of metadata actions.
 */
export interface MetadataASTNode extends BaseASTNode {
  kind: "metadata";
  type: string; // e.g., 'title', 'description', 'examples'
  value: any;
}

/**
 * Schema info extracted from metadata.
 */
export interface SchemaInfoAST {
  title?: string;
  description?: string;
  examples?: readonly any[];
  metadata?: Record<string, unknown>;
}

/**
 * Union of all possible AST node types.
 */
export type ASTNode =
  | PrimitiveASTNode
  | LiteralASTNode
  | ObjectASTNode
  | ArrayASTNode
  | TupleASTNode
  | UnionASTNode
  | VariantASTNode
  | EnumASTNode
  | PicklistASTNode
  | RecordASTNode
  | MapASTNode
  | SetASTNode
  | IntersectASTNode
  | InstanceASTNode
  | LazyASTNode
  | WrappedASTNode
  | FunctionASTNode
  | ValidationASTNode
  | TransformationASTNode
  | MetadataASTNode;
