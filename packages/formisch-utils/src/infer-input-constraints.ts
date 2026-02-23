/**
 * Derive HTML input constraint attributes from the pipe validations of an AST node.
 */

import type { ASTNode, ValidationASTNode } from "valibot-ast";
import type { InputConstraints } from "./types.ts";
import { unwrapASTNode } from "./unwrap-ast-node.ts";

/**
 * Pull all `ValidationASTNode`s whose `type` matches any of the given names
 * from the node's pipe.
 */
function pipeValidations(node: ASTNode, ...types: string[]): ValidationASTNode[] {
  const pipe = (node as any).pipe as ASTNode[] | undefined;
  if (!pipe) return [];
  return pipe.filter(
    (item): item is ValidationASTNode => item.kind === "validation" && types.includes(item.type)
  ) as ValidationASTNode[];
}

function firstPipeValidation(node: ASTNode, ...types: string[]): ValidationASTNode | undefined {
  return pipeValidations(node, ...types)[0];
}

/**
 * Infer HTML `<input>` constraint attributes from a schema node's pipe validations.
 *
 * The `required` flag is derived from the wrapper analysis performed by `unwrapASTNode`;
 * pass `{ required }` from the unwrap result to include it in the output.
 *
 * Mapping:
 *   `min_length`, `length`, `non_empty` → `minLength`
 *   `max_length`, `length`              → `maxLength`
 *   `min_value`                         → `min`
 *   `max_value`                         → `max`
 *   `multiple_of`                       → `step`
 *   `integer`                           → `step: 1`
 *   `regex`                             → `pattern` (.requirement.source)
 *   `mime_type`                         → `accept` (comma-joined)
 */
export function inferInputConstraints(
  node: ASTNode,
  options?: { required?: boolean }
): InputConstraints {
  const { node: inner, required: wrapperRequired } = unwrapASTNode(node);
  const result: InputConstraints = {};

  // required: prefer caller-supplied override, then wrapper-derived value
  const required = options?.required ?? wrapperRequired;
  if (!required) {
    // Only set `required: false` explicitly when the field is optional; omit
    // the attribute entirely when required (browser default is false anyway).
    result.required = false;
  }

  // ── length constraints ────────────────────────────────────────────────────

  const lengthAction = firstPipeValidation(inner, "length");
  const minLengthAction = firstPipeValidation(inner, "min_length", "non_empty");
  const maxLengthAction = firstPipeValidation(inner, "max_length");

  if (lengthAction?.requirement !== undefined) {
    result.minLength = Number(lengthAction.requirement);
    result.maxLength = Number(lengthAction.requirement);
  }

  if (minLengthAction) {
    // `non_empty` has no numeric requirement — treat as minLength: 1
    const req = minLengthAction.requirement;
    result.minLength = req === undefined ? 1 : Number(req);
  }

  if (maxLengthAction?.requirement !== undefined) {
    result.maxLength = Number(maxLengthAction.requirement);
  }

  // ── value constraints (numbers and dates) ─────────────────────────────────

  const minValueAction = firstPipeValidation(inner, "min_value");
  const maxValueAction = firstPipeValidation(inner, "max_value");

  if (minValueAction?.requirement !== undefined) {
    const req = minValueAction.requirement;
    // Date objects are converted to ISO strings for date inputs
    result.min = req instanceof Date ? req.toISOString().split("T")[0] : Number(req);
  }

  if (maxValueAction?.requirement !== undefined) {
    const req = maxValueAction.requirement;
    result.max = req instanceof Date ? req.toISOString().split("T")[0] : Number(req);
  }

  // ── step ──────────────────────────────────────────────────────────────────

  const multipleOfAction = firstPipeValidation(inner, "multiple_of");
  const integerAction = firstPipeValidation(inner, "integer");

  if (multipleOfAction?.requirement !== undefined) {
    result.step = Number(multipleOfAction.requirement);
  } else if (integerAction) {
    result.step = 1;
  }

  // ── pattern ───────────────────────────────────────────────────────────────

  const regexAction = firstPipeValidation(inner, "regex");
  if (regexAction?.requirement instanceof RegExp) {
    result.pattern = regexAction.requirement.source;
  } else if (
    regexAction?.requirement &&
    typeof regexAction.requirement === "object" &&
    "source" in regexAction.requirement
  ) {
    // AST may serialise RegExp as { source, flags }
    result.pattern = String(regexAction.requirement.source);
  }

  // ── accept (file MIME types) ──────────────────────────────────────────────

  const mimeTypeAction = firstPipeValidation(inner, "mime_type");
  if (mimeTypeAction?.requirement) {
    const req = mimeTypeAction.requirement;
    result.accept = Array.isArray(req) ? req.join(",") : String(req);
  }

  return result;
}
