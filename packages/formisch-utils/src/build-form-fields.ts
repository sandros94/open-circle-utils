/**
 * Build a `FormFieldConfig` tree from a Valibot schema or AST.
 *
 * This is the primary high-level utility in formisch-utils. The resulting tree
 * is framework-agnostic and drives both static rendering and dynamic form
 * generation in framework adapters.
 */

import type { GenericSchema, GenericSchemaAsync } from "valibot";
import type {
  ASTDocument,
  ASTNode,
  ArrayASTNode,
  EnumASTNode,
  IntersectASTNode,
  LiteralASTNode,
  ObjectASTNode,
  PicklistASTNode,
  RecordASTNode,
  SchemaToASTResult,
  SerializedBigInt,
  TupleASTNode,
  UnionASTNode,
  VariantASTNode,
} from "valibot-ast";
import type {
  ArrayFormFieldConfig,
  FormFieldConfig,
  FormFieldOption,
  LeafFormFieldConfig,
  ObjectFormFieldConfig,
  RecordFormFieldConfig,
  TupleFormFieldConfig,
  UnionFormFieldConfig,
  UnsupportedFormFieldConfig,
  VariantFormFieldConfig,
} from "./types.ts";
import { resolveInput } from "./_internal/resolve-input.ts";
import { unwrapASTNode } from "./unwrap-ast-node.ts";
import { inferMeta } from "./infer-meta.ts";
import { inferInputType } from "./infer-input-type.ts";
import { inferInputConstraints } from "./infer-input-constraints.ts";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a single `FormFieldConfig` for a Valibot schema.
 * The return type is fully inferred.
 */
export function buildFormFields<TSchema extends GenericSchema | GenericSchemaAsync>(
  schema: TSchema,
  options?: BuildFormFieldsOptions
): FormFieldConfig;

/**
 * Build a single `FormFieldConfig` for a valibot-ast result, document, or node.
 */
export function buildFormFields(
  input: SchemaToASTResult | ASTDocument | ASTNode,
  options?: BuildFormFieldsOptions
): FormFieldConfig;

export function buildFormFields(
  input: GenericSchema | GenericSchemaAsync | SchemaToASTResult | ASTDocument | ASTNode,
  options: BuildFormFieldsOptions = {}
): FormFieldConfig {
  const node = resolveInput(input);
  return buildNode(node, "", [], options);
}

/**
 * Convenience alias: build the `FormFieldConfig[]` entries of an object node
 * (rather than the wrapper config for the object itself).
 *
 * Useful when you already have a handle on the root object node and just want
 * the flat field list for a form body.
 */
export function buildObjectFields(
  input: GenericSchema | GenericSchemaAsync | SchemaToASTResult | ASTDocument | ASTNode,
  options: BuildFormFieldsOptions = {}
): FormFieldConfig[] {
  const root = buildFormFields(input as SchemaToASTResult | ASTDocument | ASTNode, options);
  if (root.kind === "object") return root.fields;
  // If the root was wrapped, unwrap result may also be object
  return [root];
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface BuildFormFieldsOptions {
  /**
   * Override the path prefix used when building sub-configs.
   * Useful when you resolve a sub-schema independently and need the correct path context.
   */
  basePath?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSerializedBigInt(value: unknown): value is SerializedBigInt {
  return (
    typeof value === "object" &&
    value !== null &&
    "__type" in value &&
    (value as SerializedBigInt).__type === "bigint"
  );
}

/** Resolve a potentially serialized bigint value to its native form. */
function resolveLiteralValue(
  value: string | number | SerializedBigInt | boolean
): string | number | boolean | bigint {
  return isSerializedBigInt(value) ? BigInt(value.value) : value;
}

function isObjectType(type: string): boolean {
  return (
    type === "object" ||
    type === "loose_object" ||
    type === "strict_object" ||
    type === "object_with_rest"
  );
}

// ─── Internal builder ─────────────────────────────────────────────────────────

function buildNode(
  node: ASTNode,
  key: string,
  path: string[],
  options: BuildFormFieldsOptions
): FormFieldConfig {
  const unwrapped = unwrapASTNode(node);
  const { node: inner, required, nullable } = unwrapped;
  const defaultValue = "default" in unwrapped ? unwrapped.default : undefined;
  const hasDefault = "default" in unwrapped;

  const meta = inferMeta(node, key || undefined);

  const base = {
    key,
    path,
    ...meta,
    required,
    nullable,
    ...(hasDefault ? { default: defaultValue } : {}),
  };

  // ── Object ────────────────────────────────────────────────────────────────
  if (isObjectType(inner.type)) {
    const obj = inner as ObjectASTNode;
    const fields: FormFieldConfig[] = Object.entries(obj.entries).map(([entryKey, entryNode]) =>
      buildNode(entryNode, entryKey, [...path, entryKey], options)
    );

    return { ...base, kind: "object", fields } satisfies ObjectFormFieldConfig;
  }

  // ── Array ─────────────────────────────────────────────────────────────────
  if (inner.type === "array") {
    const itemNode = (inner as ArrayASTNode).item;
    const itemConfig = itemNode
      ? buildNode(itemNode, "", [...path, "0"], options)
      : unsupported(base, "unknown", "Array item schema is missing");

    return {
      ...base,
      kind: "array",
      item: itemConfig,
    } satisfies ArrayFormFieldConfig;
  }

  // ── Tuple / multi-step ────────────────────────────────────────────────────
  if (
    inner.type === "tuple" ||
    inner.type === "loose_tuple" ||
    inner.type === "strict_tuple" ||
    inner.type === "tuple_with_rest"
  ) {
    const tupleItems = (inner as TupleASTNode).items ?? [];
    const items: FormFieldConfig[] = tupleItems.map((itemNode, index) =>
      buildNode(itemNode, String(index), [...path, String(index)], options)
    );

    return { ...base, kind: "tuple", items } satisfies TupleFormFieldConfig;
  }

  // ── Variant (discriminated union) ─────────────────────────────────────────
  if (inner.type === "variant") {
    const variantNode = inner as VariantASTNode;
    const discriminatorKey = variantNode.key;

    const branches = variantNode.options.map((branchNode) => {
      const unwrappedBranch = unwrapASTNode(branchNode);
      const branchMeta = inferMeta(branchNode);

      let discriminatorValue: string | number = "";
      let branchFields: FormFieldConfig[] = [];

      if (isObjectType(unwrappedBranch.node.type)) {
        const branchObj = unwrappedBranch.node as ObjectASTNode;
        branchFields = Object.entries(branchObj.entries).map(([entryKey, entryNode]) =>
          buildNode(entryNode, entryKey, [...path, entryKey], options)
        );

        // Extract the discriminator field's literal value
        const discriminatorEntry = branchObj.entries[discriminatorKey];
        if (discriminatorEntry) {
          const unwrappedDisc = unwrapASTNode(discriminatorEntry);
          if (unwrappedDisc.node.type === "literal") {
            const raw = (unwrappedDisc.node as LiteralASTNode).literal;
            discriminatorValue = resolveLiteralValue(raw) as string | number;
          }
        }
      } else {
        branchFields = [buildNode(branchNode, "", path, options)];
      }

      return {
        value: discriminatorValue,
        ...(branchMeta.label ? { label: branchMeta.label } : {}),
        fields: branchFields,
      };
    });

    return {
      ...base,
      kind: "variant",
      discriminatorKey,
      branches,
    } satisfies VariantFormFieldConfig;
  }

  // ── Non-discriminated union ───────────────────────────────────────────────
  if (inner.type === "union") {
    const unionOptions = (inner as UnionASTNode).options ?? [];

    // If all options are literals → treat as a leaf with options (select/radio)
    const allLiterals = unionOptions.every((opt) => unwrapASTNode(opt).node.type === "literal");

    if (allLiterals) {
      const options_: FormFieldOption[] = unionOptions.map((opt) => {
        const innerOpt = unwrapASTNode(opt).node as LiteralASTNode;
        const metaOpt = inferMeta(opt);
        const value = resolveLiteralValue(innerOpt.literal);
        return {
          value,
          label: metaOpt.label ?? String(value),
        };
      });

      return {
        ...base,
        kind: "leaf",
        inputType: "select",
        nodeType: "union",
        options: options_,
      } satisfies LeafFormFieldConfig;
    }

    // Mixed or object union → tab-based sub-form
    const unionFieldSets: FormFieldConfig[][] = unionOptions.map((optNode) => {
      const innerOpt = unwrapASTNode(optNode).node;
      if (isObjectType(innerOpt.type)) {
        return Object.entries((innerOpt as ObjectASTNode).entries).map(([entryKey, entryNode]) =>
          buildNode(entryNode, entryKey, [...path, entryKey], options)
        );
      }
      return [buildNode(optNode, "", path, options)];
    });

    return {
      ...base,
      kind: "union",
      options: unionFieldSets,
    } satisfies UnionFormFieldConfig;
  }

  // ── Record (dynamic key-value) ──────────────────────────────────────────
  if (inner.type === "record") {
    const recordNode = inner as RecordASTNode;
    const keyField = buildNode(recordNode.key, "key", [...path, "key"], options);
    const valueField = buildNode(recordNode.value, "value", [...path, "value"], options);

    return {
      ...base,
      kind: "record",
      keyField,
      valueField,
    } satisfies RecordFormFieldConfig;
  }

  // ── Intersect ─────────────────────────────────────────────────────────────
  if (inner.type === "intersect") {
    const intersectOptions = (inner as IntersectASTNode).options ?? [];
    const mergedFields: FormFieldConfig[] = [];
    const seenKeys = new Set<string>();

    for (const optNode of intersectOptions) {
      const innerOpt = unwrapASTNode(optNode).node;
      if (isObjectType(innerOpt.type)) {
        for (const [entryKey, entryNode] of Object.entries((innerOpt as ObjectASTNode).entries)) {
          if (!seenKeys.has(entryKey)) {
            seenKeys.add(entryKey);
            mergedFields.push(buildNode(entryNode, entryKey, [...path, entryKey], options));
          }
        }
      }
    }

    if (mergedFields.length > 0) {
      return {
        ...base,
        kind: "object",
        fields: mergedFields,
      } satisfies ObjectFormFieldConfig;
    }

    return unsupported(base, "intersect", "Could not merge intersect options");
  }

  // ── Enum → leaf with options ───────────────────────────────────────────────
  if (inner.type === "enum") {
    const enumNode = inner as EnumASTNode;
    const enumOptions: FormFieldOption[] = Object.entries(enumNode.enum).map(
      ([enumKey, value]) => ({
        value,
        label: enumKey,
      })
    );

    return {
      ...base,
      kind: "leaf",
      inputType: "select",
      nodeType: "enum",
      options: enumOptions,
    } satisfies LeafFormFieldConfig;
  }

  // ── Picklist → leaf with options ──────────────────────────────────────────
  if (inner.type === "picklist") {
    const picklistNode = inner as PicklistASTNode;
    const picklistOptions: FormFieldOption[] = picklistNode.options.map((raw) => {
      const value = isSerializedBigInt(raw) ? BigInt(raw.value) : raw;
      return {
        value,
        label: String(value),
      };
    });

    return {
      ...base,
      kind: "leaf",
      inputType: "select",
      nodeType: "picklist",
      options: picklistOptions,
    } satisfies LeafFormFieldConfig;
  }

  // ── Literal → leaf (typically a hidden/read-only field) ───────────────────
  if (inner.type === "literal") {
    const literalNode = inner as LiteralASTNode;
    const value = resolveLiteralValue(literalNode.literal);
    return {
      ...base,
      kind: "leaf",
      inputType: "hidden",
      nodeType: "literal",
      options: [
        {
          value,
          label: String(value),
        },
      ],
    } satisfies LeafFormFieldConfig;
  }

  // ── Scalar primitives → leaf ──────────────────────────────────────────────
  const inputType = inferInputType(inner);
  if (inputType !== undefined) {
    const constraints = inferInputConstraints(node, { required });
    return {
      ...base,
      kind: "leaf",
      inputType,
      nodeType: inner.type,
      constraints,
    } satisfies LeafFormFieldConfig;
  }

  // ── Unsupported ───────────────────────────────────────────────────────────
  return unsupported(base, inner.type, `No form mapping for schema type "${inner.type}"`);
}

function unsupported(
  base: Omit<UnsupportedFormFieldConfig, "kind" | "nodeType" | "reason">,
  nodeType: string,
  reason: string
): UnsupportedFormFieldConfig {
  return {
    ...base,
    kind: "unsupported",
    nodeType,
    reason,
  };
}
