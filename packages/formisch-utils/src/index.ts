/**
 * formisch-utils
 *
 * Utility functions for working with Formisch forms and Valibot schemas.
 *
 * @module formisch-utils
 */

export {
  generateInitialInput,
  type GenerateInitialInputOptions,

  // Deprecated exports - will be removed in future versions
  generateInitialValues,
  type GenerateInitialValuesOptions,
} from "./generate-initial-input.js";

export {
  inferInputType,
  type InferredInputType,
  type InferInputTypeOptions,
  type InferInputTypeResult,
} from "./infer-input-type.js";
