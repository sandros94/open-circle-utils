import type { ASTKind } from "./kind.ts";
import type { ASTNode } from "./kind.ts";
import type { SchemaInfoAST } from "./info.ts";

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
 * AST representation of a primitive schema (string, number, boolean, etc.).
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
  class: string;
  pipe?: ASTNode[];
  info?: SchemaInfoAST;
  /** Reference to a dictionary entry for reconstructing this instance. */
  dictionaryKey?: string;
}

/**
 * AST representation of a lazy/recursive schema.
 */
export interface LazyASTNode extends BaseASTNode {
  kind: "schema";
  type: "lazy";
  /** Reference to a dictionary entry for the lazy getter. */
  dictionaryKey?: string;
  /** Note for lazy schemas without dictionary key. */
  note?: string;
  info?: SchemaInfoAST;
}

/**
 * AST representation of wrapped schemas (optional, nullable, nullish, etc.).
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
  default?: unknown;
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
  type: string;
  locales?: Intl.LocalesArgument;
  requirement?: unknown;
  message?: string;
  /** Reference to a dictionary entry for custom validation. */
  dictionaryKey?: string;
}

/**
 * AST representation of transformation actions.
 */
export interface TransformationASTNode extends BaseASTNode {
  kind: "transformation";
  type: string;
  requirement?: unknown;
  message?: string;
  note?: string;
  /** Reference to a dictionary entry for custom transformation. */
  dictionaryKey?: string;
}

/**
 * AST representation of metadata actions.
 */
export interface MetadataASTNode extends BaseASTNode {
  kind: "metadata";
  type: string;
  value: unknown;
}
