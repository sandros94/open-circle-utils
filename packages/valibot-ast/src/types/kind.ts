import type {
  PrimitiveASTNode,
  LiteralASTNode,
  ObjectASTNode,
  ArrayASTNode,
  TupleASTNode,
  UnionASTNode,
  VariantASTNode,
  EnumASTNode,
  PicklistASTNode,
  RecordASTNode,
  MapASTNode,
  SetASTNode,
  IntersectASTNode,
  InstanceASTNode,
  LazyASTNode,
  WrappedASTNode,
  FunctionASTNode,
  CustomASTNode,
  ValidationASTNode,
  TransformationASTNode,
  MetadataASTNode,
} from "./nodes.ts";

export type ASTKind = "schema" | "validation" | "transformation" | "metadata";

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
  | CustomASTNode
  | ValidationASTNode
  | TransformationASTNode
  | MetadataASTNode;
