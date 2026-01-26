import { assertEquals } from '@std/assert';
import * as v from 'valibot';

import { isObjectSchema, isObjectWithRestSchema } from './is.ts';

Deno.test('isObjectSchema - Object schemas', () => {
  const schema = v.object({ name: v.string() });

  assertEquals(isObjectSchema(schema), true);
});

Deno.test('isObjectSchema - Non-object schemas', () => {
  assertEquals(isObjectSchema(v.string()), false);
  assertEquals(isObjectSchema(v.number()), false);
  assertEquals(isObjectSchema(v.array(v.string())), false);
  assertEquals(isObjectSchema(v.boolean()), false);
});

Deno.test('isObjectWithRestSchema - Object with rest schemas', () => {
  const schema = v.objectWithRest({ name: v.string() }, v.number());

  assertEquals(isObjectWithRestSchema(schema), true);
});

Deno.test('isObjectWithRestSchema - Non-tuple with rest schemas', () => {
  assertEquals(isObjectWithRestSchema(v.tuple([v.string()])), false);
  assertEquals(isObjectWithRestSchema(v.looseTuple([v.string()])), false);
  assertEquals(isObjectWithRestSchema(v.strictTuple([v.string()])), false);
  assertEquals(isObjectWithRestSchema(v.array(v.string())), false);
});
