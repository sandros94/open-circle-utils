import { assertEquals } from '@std/assert';
import * as v from 'valibot';

import { getSchemaInfo } from './get.ts';

Deno.test('getSchemaInfo - Schema with title', () => {
  const schema = v.pipe(
    v.string(),
    v.title('User Email')
  );

  const info = getSchemaInfo(schema);

  assertEquals(info.title, 'User Email');
  assertEquals(info.description, undefined);
  assertEquals(info.examples, []);
  assertEquals(info.metadata, {});
});

Deno.test('getSchemaInfo - Schema with description', () => {
  const schema = v.pipe(
    v.number(),
    v.description('Enter your age')
  );

  const info = getSchemaInfo(schema);

  assertEquals(info.title, undefined);
  assertEquals(info.description, 'Enter your age');
});

Deno.test('getSchemaInfo - Schema with examples', () => {
  const schema = v.pipe(
    v.string(),
    v.examples(['example1', 'example2', 'example3'])
  );

  const info = getSchemaInfo(schema);

  assertEquals(info.examples, ['example1', 'example2', 'example3']);
});

Deno.test('getSchemaInfo - Schema with metadata', () => {
  const schema = v.pipe(
    v.string(),
    v.metadata({
      label: 'Username',
      placeholder: 'Enter username',
      customProp: 'custom value',
    })
  );

  const info = getSchemaInfo(schema);

  assertEquals(info.metadata.label, 'Username');
  assertEquals(info.metadata.placeholder, 'Enter username');
  assertEquals(info.metadata.customProp, 'custom value');
});

Deno.test('getSchemaInfo - Schema with all info', () => {
  const schema = v.pipe(
    v.string(),
    v.title('Email Address'),
    v.description('Your primary email'),
    v.examples(['user@example.com', 'admin@example.com']),
    v.metadata({
      placeholder: 'user@example.com',
      icon: 'email',
    })
  );

  const info = getSchemaInfo(schema);

  assertEquals(info.title, 'Email Address');
  assertEquals(info.description, 'Your primary email');
  assertEquals(info.examples, ['user@example.com', 'admin@example.com']);
  assertEquals(info.metadata.placeholder, 'user@example.com');
  assertEquals(info.metadata.icon, 'email');
});

Deno.test('getSchemaInfo - Schema without any info', () => {
  const schema = v.string();
  const info = getSchemaInfo(schema);

  assertEquals(info.title, undefined);
  assertEquals(info.description, undefined);
  assertEquals(info.examples, []);
  assertEquals(info.metadata, {});
});

Deno.test('getSchemaInfo - Multiple metadata actions merge', () => {
  const schema = v.pipe(
    v.string(),
    v.metadata({ first: 'value1' }),
    v.metadata({ second: 'value2' })
  );

  const info = getSchemaInfo(schema);

  assertEquals(info.metadata.first, 'value1');
  assertEquals(info.metadata.second, 'value2');
});
