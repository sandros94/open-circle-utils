import type { GenericSchema, GenericSchemaAsync, InferInput } from "valibot";
import {
  isArraySchema,
  isObjectSchema,
  isTupleSchema,
  isTupleWithRestSchema,
  isLiteralSchema,
  isPicklistSchema,
  isEnumSchema,
  isRecordSchema,
  isUnionSchema,
  isVariantSchema,
  isLazySchema,
  isIntersectSchema,
  getObjectEntries,
  getTupleItems,
  getWrappedSchema,
  getLiteralValue,
  getPicklistOptions,
  getEnumOptions,
  getUnionOptions,
  getVariantOptions,
  getLazyGetter,
  getIntersectOptions,
} from "valibot-introspection";

/**
 * Options for generating initial input values
 */
export interface GenerateInitialInputOptions {
  /**
   * Custom generator function used as a fallback when the schema type is not recognized.
   * This is particularly useful for handling custom schemas (v.custom()) or any schema types
   * that are not natively supported.
   *
   * If not provided, the function will throw an error when encountering an unknown schema type.
   *
   * @param schema - The schema to generate a value for
   * @returns The generated initial value
   *
   * @example
   * ```typescript
   * const options = {
   *   customGenerator: (schema) => {
   *     if (schema.type === 'custom') {
   *       return 'custom-default';
   *     }
   *     return undefined;
   *   }
   * };
   * ```
   */
  customGenerator?: (schema: GenericSchema | GenericSchemaAsync) => unknown;
}

/**
 * @deprecated Use `GenerateInitialInputOptions` instead. This type is an alias for backward compatibility and will be removed in future versions.
 */
export type GenerateInitialValuesOptions = GenerateInitialInputOptions;

/**
 * Generates initial input values for a Valibot schema suitable for use with Formisch's initialInput.
 *
 * This function introspects a Valibot schema and generates appropriate default values
 * that can be directly used as the `initialInput` option when creating a Formisch form.
 *
 * The function properly handles wrapped schemas (optional, nullable, nullish, etc.) by:
 * - Using defaultValue if provided by the schema
 * - Returning undefined for optional schemas (required: false)
 * - Returning null for nullable schemas (nullable: true, required: true)
 * - Returning undefined for nullish schemas (nullable: true, required: false)
 * - Initializing nested values for required complex schemas
 *
 * @param schema - The Valibot schema to generate initial values for
 * @param options - Configuration options for value generation
 * @returns Initial values matching the schema's InferInput type
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import { generateInitialInput } from 'formisch-utils';
 *
 * const LoginSchema = v.object({
 *   email: v.pipe(v.string(), v.email()),
 *   password: v.pipe(v.string(), v.minLength(8)),
 *   rememberMe: v.optional(v.boolean()),
 * });
 *
 * const initialValues = generateInitialInput(LoginSchema);
 * // { email: '', password: '', rememberMe: undefined }
 *
 * const loginForm = useForm({
 *   schema: LoginSchema,
 *   initialInput: initialValues,
 * });
 * ```
 */
export function generateInitialInput<
  TSchema extends GenericSchema | GenericSchemaAsync,
>(
  schema: TSchema,
  options: GenerateInitialInputOptions = {},
): InferInput<TSchema> {
  // ALWAYS unwrap first to check for default values and required/nullable metadata
  const unwrapped = getWrappedSchema(schema);

  if (unwrapped.wasWrapped) {
    // If schema has a default value, use it
    if (unwrapped.defaultValue !== undefined) {
      return unwrapped.defaultValue;
    }

    // Determine the value based on required and nullable flags
    const { required, nullable } = unwrapped;

    // Optional (required: false, nullable: false) -> undefined
    if (!required && !nullable) {
      return undefined;
    }

    // Nullable (required: true, nullable: true) -> null
    if (required && nullable) {
      return null;
    }

    // Nullish (required: false, nullable: true) -> undefined
    if (!required && nullable) {
      return undefined;
    }

    // Required (required: true, nullable: false) -> generate value from unwrapped schema
    // Fall through to generate value from unwrapped.schema
  }

  // Use the unwrapped schema for further introspection
  const targetSchema = unwrapped.schema;

  // Handle literal schemas
  if (isLiteralSchema(targetSchema)) {
    return getLiteralValue(targetSchema);
  }

  // Handle picklist schemas
  if (isPicklistSchema(targetSchema)) {
    const picklistOptions = getPicklistOptions(targetSchema);
    return picklistOptions && picklistOptions.length > 0
      ? picklistOptions[0]
      : undefined;
  }

  // Handle enum schemas
  if (isEnumSchema(targetSchema)) {
    const enumObj = getEnumOptions(targetSchema);
    const values = Object.values(enumObj);
    return values.length > 0 ? values[0] : undefined;
  }

  // Handle object schemas
  if (isObjectSchema(targetSchema)) {
    const entries = getObjectEntries(targetSchema);
    const result: Record<string, unknown> = {};

    if (entries) {
      for (const [key, fieldSchema] of entries) {
        result[key] = generateInitialInput(fieldSchema, options);
      }
    }

    return result;
  }

  // Handle array schemas
  if (isArraySchema(targetSchema)) {
    return [];
  }

  // Handle tuple schemas
  if (isTupleSchema(targetSchema)) {
    const items = getTupleItems(targetSchema);
    const result: unknown[] = [];

    if (items) {
      for (const itemSchema of items) {
        result.push(generateInitialInput(itemSchema, options));
      }
    }

    return result;
  }

  // Handle tuple with rest schemas
  if (isTupleWithRestSchema(targetSchema)) {
    const items = getTupleItems(targetSchema);
    const result: unknown[] = [];

    if (items) {
      for (const itemSchema of items) {
        result.push(generateInitialInput(itemSchema, options));
      }
    }

    return result;
  }

  // Handle record schemas
  if (isRecordSchema(targetSchema)) {
    return {};
  }

  // Handle union schemas - take the first option
  if (isUnionSchema(targetSchema)) {
    const unionOptions = getUnionOptions(targetSchema);
    if (unionOptions && unionOptions.length > 0) {
      return generateInitialInput(unionOptions[0], options);
    }
    return undefined;
  }

  // Handle variant schemas - take the first option
  if (isVariantSchema(targetSchema)) {
    const variantOptions = getVariantOptions(targetSchema);
    if (variantOptions.length > 0) {
      return generateInitialInput(variantOptions[0], options);
    }
    return undefined;
  }

  // Handle lazy schemas - evaluate the getter and process the result
  if (isLazySchema(targetSchema)) {
    const getter = getLazyGetter(targetSchema);
    if (getter) {
      const lazySchema = getter();
      return generateInitialInput(lazySchema, options);
    }
    return undefined;
  }

  // Handle intersect schemas - merge initial values from all options
  if (isIntersectSchema(targetSchema)) {
    const intersectOptions = getIntersectOptions(targetSchema);
    if (intersectOptions && intersectOptions.length > 0) {
      // Merge all intersected schemas by generating values for each and merging
      const merged: Record<string, unknown> = {};
      for (const option of intersectOptions) {
        const value = generateInitialInput(option, options);
        // Merge objects, otherwise take the last value
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          Object.assign(merged, value);
        }
      }
      return Object.keys(merged).length > 0
        ? merged
        : ({} as InferInput<TSchema>);
    }
    return {};
  }

  // Handle primitive types
  switch (targetSchema.type) {
    case "string": {
      return "";
    }
    case "number":
    case "bigint": {
      return 0;
    }
    case "boolean": {
      return false;
    }
    case "date": {
      return new Date();
    }
    case "blob": {
      return new Blob();
    }
    case "file": {
      return new File([], "");
    }
    case "symbol": {
      return Symbol();
    }
    case "map": {
      return new Map();
    }
    case "set": {
      return new Set();
    }
    case "nan": {
      return Number.NaN;
    }
    case "null": {
      return null;
    }
    case "undefined":
    case "any":
    case "unknown": {
      return undefined;
    }
    // The following schemas do not make sense in a form context, return undefined
    case "never":
    case "promise":
    case "function":
    case "void":
    case "instance": {
      return undefined;
    }
    default: {
      // Handle custom schemas and any unknown types
      if (options.customGenerator) {
        return options.customGenerator(targetSchema) as InferInput<TSchema>;
      }

      // If no custom generator is provided, throw an error
      throw new Error(
        `Unable to generate initial value for schema type "${targetSchema.type}". Please provide a customGenerator function in options to handle this schema type.`,
      );
    }
  }
}

/**
 * @deprecated Use `generateInitialInput` instead. This function is an alias for backward compatibility and will be removed in future versions.
 */
export const generateInitialValues: typeof generateInitialInput =
  generateInitialInput;
