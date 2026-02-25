import type { GenericSchema, GenericSchemaAsync, Class } from "valibot";

/**
 * Union of all value types that can be stored in a dictionary.
 * The node's `kind` and `type` determine how the value is used during deserialization.
 */
export type DictionaryValue = Class | Function | (() => GenericSchema | GenericSchemaAsync);

/**
 * A map of string keys to dictionary values.
 * Used for both serialization (find key by value via reference equality)
 * and deserialization (get value by key).
 */
export type DictionaryMap = Map<string, DictionaryValue>;

/**
 * Creates a dictionary map from a plain object of entries.
 *
 * @param entries Object mapping string keys to dictionary values.
 * @returns A DictionaryMap instance.
 */
// @__NO_SIDE_EFFECTS__
export function createDictionary(entries: Record<string, DictionaryValue>): DictionaryMap {
  return new Map(Object.entries(entries));
}

/**
 * Finds the key for a given value in a dictionary using reference equality.
 *
 * @param dictionary The dictionary to search.
 * @param value The value to find.
 * @returns The key if found, undefined otherwise.
 */
// @__NO_SIDE_EFFECTS__
export function findKeyByValue<T>(dictionary: Map<string, T>, value: T): string | undefined {
  for (const [key, dictValue] of dictionary.entries()) {
    if (dictValue === value) return key;
  }
  return undefined;
}
