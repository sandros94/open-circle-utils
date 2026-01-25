import { assertEquals } from '@std/assert';
import * as v from 'valibot';

import { getRecordKey, getRecordValue } from './get.ts';

Deno.test('getRecordKey - Get key schema', () => {
  const schema = v.record(v.string(), v.number());
  const key = getRecordKey(schema);

  assertEquals(key !== null, true);
  assertEquals(key.type, 'string');
});

Deno.test('getRecordKey - Complex key schema', () => {
  const schema = v.record(v.picklist(['a', 'b', 'c']), v.number());
  const key = getRecordKey(schema);

  assertEquals(key !== null, true);
  assertEquals(key.type, 'picklist');
});

Deno.test('getRecordKey - Non-record schema returns null', () => {
  const schema = v.string();
  const key = getRecordKey(schema);

  assertEquals(key, null);
});

Deno.test('getRecordValue - Get value schema', () => {
  const schema = v.record(v.string(), v.number());
  const value = getRecordValue(schema);

  assertEquals(value !== null, true);
  assertEquals(value.type, 'number');
});

Deno.test('getRecordValue - Complex value schema', () => {
  const schema = v.record(v.string(), v.object({ name: v.string(), age: v.number() }));
  const value = getRecordValue(schema);

  assertEquals(value !== null, true);
  assertEquals(value.type, 'object');
});

Deno.test('getRecordValue - Non-record schema returns null', () => {
  const schema = v.string();
  const value = getRecordValue(schema);

  assertEquals(value, null);
});
