import { assertEquals } from '@std/assert';
import { intersect, instance, map, set, string, number, object, function_ } from 'valibot';
import {
  isIntersectSchema,
  isInstanceSchema,
  isMapSchema,
  isSetSchema,
  isFunctionSchema,
} from './is.ts';

Deno.test('isIntersectSchema', () => {
  const schema = intersect([
    object({ name: string() }),
    object({ age: number() }),
  ]);
  assertEquals(isIntersectSchema(schema), true);
  assertEquals(isIntersectSchema(string()), false);
});

Deno.test('isInstanceSchema', () => {
  class MyClass {}
  const schema = instance(MyClass);
  assertEquals(isInstanceSchema(schema), true);
  assertEquals(isInstanceSchema(string()), false);
});

Deno.test('isMapSchema', () => {
  const schema = map(string(), number());
  assertEquals(isMapSchema(schema), true);
  assertEquals(isMapSchema(string()), false);
});

Deno.test('isSetSchema', () => {
  const schema = set(string());
  assertEquals(isSetSchema(schema), true);
  assertEquals(isSetSchema(string()), false);
});

Deno.test('isFunctionSchema', () => {
  const schema = function_();
  assertEquals(isFunctionSchema(schema), true);
  assertEquals(isFunctionSchema(string()), false);
});
