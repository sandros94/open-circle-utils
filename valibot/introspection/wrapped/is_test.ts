import { assertEquals } from '@std/assert';
import * as v from 'valibot';

import { isWrappedSchema } from './is.ts';

Deno.test('isWrappedSchema - Wrapped schemas', () => {
  assertEquals(isWrappedSchema(v.exactOptional(v.string())), true);
  assertEquals(isWrappedSchema(v.nonNullable(v.number())), true);
  assertEquals(isWrappedSchema(v.nonNullish(v.boolean())), true);
  assertEquals(isWrappedSchema(v.nonOptional(v.string())), true);
  assertEquals(isWrappedSchema(v.nullable(v.number())), true);
  assertEquals(isWrappedSchema(v.nullish(v.boolean())), true);
  assertEquals(isWrappedSchema(v.optional(v.string())), true);
  assertEquals(isWrappedSchema(v.undefinedable(v.string())), true);
});

Deno.test('isWrappedSchema - Non-wrapped schemas', () => {
  assertEquals(isWrappedSchema(v.string()), false);
  assertEquals(isWrappedSchema(v.number()), false);
  assertEquals(isWrappedSchema(v.array(v.string())), false);
  assertEquals(isWrappedSchema(v.boolean()), false);
});
