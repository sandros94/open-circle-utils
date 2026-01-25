import { assertEquals } from '@std/assert';
import * as v from 'valibot';

import { isEnumSchema, isPicklistSchema, isUnionSchema, isVariantSchema } from './is.ts';

enum TestEnum {
  A = 'a',
  B = 'b',
  C = 'c',
}

Deno.test('isEnumSchema - Enum schemas', () => {
  const schema = v.enum_(TestEnum);

  assertEquals(isEnumSchema(schema), true);
});

Deno.test('isEnumSchema - Non-enum schemas', () => {
  assertEquals(isEnumSchema(v.string()), false);
  assertEquals(isEnumSchema(v.picklist(['a', 'b', 'c'])), false);
  assertEquals(isEnumSchema(v.union([v.string(), v.number()])), false);
});

Deno.test('isPicklistSchema - Picklist schemas', () => {
  const schema = v.picklist(['a', 'b', 'c']);

  assertEquals(isPicklistSchema(schema), true);
});

Deno.test('isPicklistSchema - Non-picklist schemas', () => {
  assertEquals(isPicklistSchema(v.string()), false);
  assertEquals(isPicklistSchema(v.enum_(TestEnum)), false);
  assertEquals(isPicklistSchema(v.union([v.string(), v.number()])), false);
});

Deno.test('isUnionSchema - Union schemas', () => {
  const schema = v.union([v.string(), v.number()]);

  assertEquals(isUnionSchema(schema), true);
});

Deno.test('isUnionSchema - Non-union schemas', () => {
  assertEquals(isUnionSchema(v.string()), false);
  assertEquals(isUnionSchema(v.picklist(['a', 'b', 'c'])), false);
  assertEquals(isUnionSchema(v.variant('type', [
    v.object({ type: v.literal('a'), value: v.string() }),
    v.object({ type: v.literal('b'), value: v.number() }),
  ])), false);
});

Deno.test('isVariantSchema - Variant schemas', () => {
  const schema = v.variant('type', [
    v.object({ type: v.literal('a'), value: v.string() }),
    v.object({ type: v.literal('b'), value: v.number() }),
  ]);

  assertEquals(isVariantSchema(schema), true);
});

Deno.test('isVariantSchema - Non-variant schemas', () => {
  assertEquals(isVariantSchema(v.string()), false);
  assertEquals(isVariantSchema(v.union([v.string(), v.number()])), false);
});
