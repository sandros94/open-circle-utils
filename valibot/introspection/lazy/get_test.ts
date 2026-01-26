import { assertEquals } from '@std/assert';
import { lazy, string } from 'valibot';
import { getLazyGetter } from './get.ts';

Deno.test('getLazyGetter - basic usage', () => {
  const lazySchema = lazy(() => string());
  const getter = getLazyGetter(lazySchema);

  assertEquals(getter !== null, true);
  assertEquals(typeof getter, 'function');
});

Deno.test('getLazyGetter - returns correct schema', () => {
  const lazySchema = lazy(() => string());
  const getter = getLazyGetter(lazySchema);

  if (getter) {
    const resolved = getter();
    assertEquals(resolved.type, 'string');
  }
});

Deno.test('getLazyGetter - not a lazy schema', () => {
  assertEquals(getLazyGetter(string()), null);
});
