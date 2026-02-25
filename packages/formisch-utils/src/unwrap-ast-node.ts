/**
 * Re-export the canonical AST unwrap utility from valibot-ast.
 *
 * The implementation lives in `valibot-ast/utils` as `getWrappedASTNode`.
 * This module aliases it as `unwrapASTNode` for backward compatibility
 * within formisch-utils.
 */

export { getWrappedASTNode as unwrapASTNode } from "valibot-ast/utils";
