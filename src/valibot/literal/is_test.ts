import { assertEquals } from '@std/assert';
import { literal, string } from 'valibot';
import { isLiteralSchema } from './is.ts';
import { getLiteralValue } from './get.ts';

Deno.test('isLiteralSchema', () => {
  assertEquals(isLiteralSchema(literal('hello')), true);
  assertEquals(isLiteralSchema(literal(42)), true);
  assertEquals(isLiteralSchema(literal(true)), true);
  assertEquals(isLiteralSchema(string()), false);
});

Deno.test('getLiteralValue', () => {
  assertEquals(getLiteralValue(literal('hello')), 'hello');
  assertEquals(getLiteralValue(literal(42)), 42);
  assertEquals(getLiteralValue(literal(true)), true);
  assertEquals(getLiteralValue(literal(false)), false);
  assertEquals(getLiteralValue(string()), null);
});
