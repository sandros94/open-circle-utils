import { assertEquals } from '@std/assert';
import * as v from 'valibot';

import { isObjectSchema } from './is.ts';

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
