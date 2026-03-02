// Fork from Formisch

/**
 * Checks if a type is `any`.
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Checks if a type is `never`.
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Constructs a type that is maybe a promise.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Makes all properties deeply optional.
 */
export type DeepPartial<TValue> = TValue extends Record<PropertyKey, unknown> | readonly unknown[]
  ? { [TKey in keyof TValue]?: DeepPartial<TValue[TKey]> | undefined }
  : TValue | undefined;

/**
 * Path key type.
 */
export type PathKey = string | number;

/**
 * Path type.
 */
export type Path = readonly PathKey[];

/**
 * Required path type.
 */
export type RequiredPath = readonly [PathKey, ...Path];

/**
 * Extracts the exact keys of a tuple, array or object.
 */
export type KeyOf<TValue> =
  IsAny<TValue> extends true
    ? never
    : TValue extends readonly unknown[]
      ? number extends TValue["length"]
        ? number
        : {
            [TKey in keyof TValue]: TKey extends `${infer TIndex extends number}` ? TIndex : never;
          }[number]
      : TValue extends Record<string, unknown>
        ? keyof TValue & PathKey
        : never;

/**
 * Merges array and object unions into a single object.
 *
 * Hint: This is necessary to make any property accessible. By default,
 * properties that do not exist in all union options are not accessible
 * and result in "any" when accessed.
 */
export type MergeUnion<TValue> = {
  [TKey in KeyOf<TValue>]: TValue extends Record<TKey, infer TItem> ? TItem : never;
};

/**
 * Lazily evaluates only the first valid path segment based on the given value.
 */
export type LazyPath<
  TValue,
  TPathToCheck extends Path,
  TValidPath extends Path = readonly [],
> = TPathToCheck extends readonly []
  ? TValidPath
  : TPathToCheck extends readonly [
        infer TFirstKey extends KeyOf<TValue>,
        ...infer TPathRest extends Path,
      ]
    ? LazyPath<
        Required<MergeUnion<TValue>[TFirstKey]>,
        TPathRest,
        readonly [...TValidPath, TFirstKey]
      >
    : IsNever<KeyOf<TValue>> extends false
      ? readonly [...TValidPath, KeyOf<TValue>]
      : TValidPath;

/**
 * Returns the path if valid, otherwise the first possible valid path based on
 * the given value.
 */
export type ValidPath<TValue, TPath extends RequiredPath> =
  TPath extends LazyPath<Required<TValue>, TPath> ? TPath : LazyPath<Required<TValue>, TPath>;
