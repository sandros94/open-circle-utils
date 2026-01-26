import { assertEquals } from '@std/assert';
import * as v from 'valibot';

import {
  getEnumOptions,
  getPicklistOptions,
  getUnionOptions,
  getVariantOptions,
  getVariantKey,
} from './get.ts';

enum TestEnum {
  A = 'a',
  B = 'b',
  C = 'c',
}

Deno.test('getEnumOptions - Get enum object', () => {
  const schema = v.enum_(TestEnum);
  const options = getEnumOptions(schema);

  assertEquals(options !== null, true);
  assertEquals(options, TestEnum);
});

Deno.test('getEnumOptions - Non-enum schema returns null', () => {
  const schema = v.string();
  const options = getEnumOptions(schema);

  assertEquals(options, null);
});

Deno.test('getPicklistOptions - Get picklist options', () => {
  const schema = v.picklist(['a', 'b', 'c']);
  const options = getPicklistOptions(schema);

  assertEquals(options !== null, true);
  assertEquals(options, ['a', 'b', 'c']);
});

Deno.test('getPicklistOptions - Non-picklist schema returns null', () => {
  const schema = v.string();
  const options = getPicklistOptions(schema);

  assertEquals(options, null);
});

Deno.test('getUnionOptions - Get union options', () => {
  const stringSchema = v.string();
  const numberSchema = v.number();
  const schema = v.union([stringSchema, numberSchema]);
  const options = getUnionOptions(schema);

  assertEquals(options !== null, true);
  assertEquals(options.length, 2);
  assertEquals(options[0].type, 'string');
  assertEquals(options[1].type, 'number');
});

Deno.test('getUnionOptions - Non-union schema returns null', () => {
  const schema = v.string();
  const options = getUnionOptions(schema);

  assertEquals(options, null);
});

Deno.test('getVariantOptions - Get variant options', () => {
  const schema = v.variant('type', [
    v.object({ type: v.literal('a'), value: v.string() }),
    v.object({ type: v.literal('b'), value: v.number() }),
  ]);
  const options = getVariantOptions(schema);

  assertEquals(options !== null, true);
  assertEquals(options.length, 2);
});

Deno.test('getVariantOptions - Non-variant schema returns null', () => {
  const schema = v.string();
  const options = getVariantOptions(schema);

  assertEquals(options, null);
});

Deno.test('getVariantKey - Get discriminator key', () => {
  const schema = v.variant('type', [
    v.object({ type: v.literal('a'), value: v.string() }),
    v.object({ type: v.literal('b'), value: v.number() }),
  ]);
  const key = getVariantKey(schema);

  assertEquals(key !== null, true);
  assertEquals(key, 'type');
});

Deno.test('getVariantKey - Non-variant schema returns null', () => {
  const schema = v.string();
  const key = getVariantKey(schema);

  assertEquals(key, null);
});
