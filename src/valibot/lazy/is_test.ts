import { assertEquals } from '@std/assert';
import { lazy, string, object } from 'valibot';
import { isLazySchema } from './is.ts';
import { getLazyGetter } from './get.ts';

Deno.test('isLazySchema', () => {
  const lazySchema = lazy(() => string());
  assertEquals(isLazySchema(lazySchema), true);
  assertEquals(isLazySchema(string()), false);
});

Deno.test('getLazyGetter', () => {
  const lazySchema = lazy(() => string());
  const getter = getLazyGetter(lazySchema);

  assertEquals(getter !== null, true);
  assertEquals(typeof getter, 'function');

  // Test that the getter returns a schema
  if (getter) {
    const resolved = getter();
    assertEquals(resolved.type, 'string');
  }
});

Deno.test('getLazyGetter - circular reference', () => {
  type Node = {
    value: string;
    children?: Node[];
  };

  const NodeSchema: any = object({
    value: string(),
    children: lazy(() => NodeSchema),
  });

  const childrenSchema = NodeSchema.entries.children;
  assertEquals(isLazySchema(childrenSchema), true);

  const getter = getLazyGetter(childrenSchema);
  assertEquals(getter !== null, true);
});

Deno.test('getLazyGetter - not a lazy schema', () => {
  assertEquals(getLazyGetter(string()), null);
});
