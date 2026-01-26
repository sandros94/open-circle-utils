import { assertEquals } from '@std/assert';
import * as v from 'valibot';

import {
  getPipeItems,
  getPipeActions,
  findPipeItems,
  getTransformationActions,
  getValidationActions,
  getLengthActions,
  getValueActions,
  getSizeActions,
  getBytesActions,
} from './get.ts';

Deno.test('getPipeItems - Schema with pipe', () => {
  const schema = v.pipe(v.string(), v.email());
  const pipe = getPipeItems(schema);

  assertEquals(pipe !== null, true);
  assertEquals(Array.isArray(pipe), true);
});

Deno.test('getPipeItems - Schema without pipe', () => {
  const schema = v.string();
  const pipe = getPipeItems(schema);

  assertEquals(pipe, null);
});

Deno.test('getPipeActions - Get all actions', () => {
  const schema = v.pipe(v.string(), v.email(), v.minLength(5), v.maxLength(100));
  const actions = getPipeActions(schema);

  assertEquals(actions.length, 3);
  assertEquals(actions.some(a => a.type === 'email'), true);
  assertEquals(actions.some(a => a.type === 'min_length'), true);
  assertEquals(actions.some(a => a.type === 'max_length'), true);
});

Deno.test('getPipeActions - Return null for no pipe', () => {
  const schema = v.string();
  const actions = getPipeActions(schema);

  assertEquals(actions, null);
});

Deno.test('findPipeItems - Find by kind', () => {
  const schema = v.pipe(
    v.string(),
    v.email(),
    v.minLength(5),
    v.toLowerCase(),
  );
  const items = findPipeItems(schema, { kind: ['validation'] });

  assertEquals(items.length, 2);
  assertEquals(items.every(i => i.kind === 'validation'), true);
});

Deno.test('findPipeItems - Find by type', () => {
  const schema = v.pipe(
    v.string(),
    v.email(),
    v.minLength(5),
    v.toLowerCase(),
  );
  const items = findPipeItems(schema, { type: ['email'] });

  assertEquals(items.length, 1);
  assertEquals(items[0].type, 'email');
});

Deno.test('findPipeItems - Find by kind and type', () => {
  const schema = v.pipe(
    v.string(),
    v.email(),
    v.minLength(5),
    v.toLowerCase(),
  );
  const items = findPipeItems(schema, { kind: ['validation'], type: ['min_length'] });

  assertEquals(items.length, 1);
  assertEquals(items[0].type, 'min_length');
});

Deno.test('findPipeItems - No pipe returns null', () => {
  const schema = v.string();
  const items = findPipeItems(schema, { kind: ['validation'] });

  assertEquals(items, null);
});

Deno.test('getTransformationActions - Get transformation actions', () => {
  const schema = v.pipe(
    v.string(),
    v.trim(),
    v.toUpperCase(),
    v.minLength(5),
  );
  const actions = getTransformationActions(schema);

  assertEquals(actions.length, 2);
  assertEquals(actions.some(a => a.type === 'trim'), true);
  assertEquals(actions.some(a => a.type === 'to_upper_case'), true);
});

Deno.test('getTransformationActions - No pipe returns null', () => {
  const schema = v.string();
  const actions = getTransformationActions(schema);

  assertEquals(actions, null);
});

Deno.test('getValidationActions - Get validation actions', () => {
  const schema = v.pipe(
    v.string(),
    v.email(),
    v.minLength(5),
    v.trim(),
  );
  const actions = getValidationActions(schema);

  assertEquals(actions.length, 2);
  assertEquals(actions.some(a => a.type === 'email'), true);
  assertEquals(actions.some(a => a.type === 'min_length'), true);
});

Deno.test('getValidationActions - No pipe returns null', () => {
  const schema = v.string();
  const actions = getValidationActions(schema);

  assertEquals(actions, null);
});

Deno.test('getLengthActions - Get length constraint actions', () => {
  const schema1 = v.pipe(
    v.string(),
    v.minLength(5),
    v.maxLength(100),
    v.email(),
  );
  const schema2 = v.pipe(
    v.array(v.string()),
    v.length(10),
  )

  const actions1 = getLengthActions(schema1);
  const actions2 = getLengthActions(schema2);

  assertEquals(actions1.length, 2);
  assertEquals(actions1.some(a => a.type === 'min_length'), true);
  assertEquals(actions1.some(a => a.type === 'max_length'), true);
  assertEquals(actions2.length, 1);
  assertEquals(actions2[0].type, 'length');
});

Deno.test('getLengthActions - No pipe returns null', () => {
  const schema = v.string();
  const actions = getLengthActions(schema);

  assertEquals(actions, null);
});

Deno.test('getValueActions - Get value constraint actions', () => {
  const schema1 = v.pipe(
    v.number(),
    v.integer(),
    v.minValue(5),
    v.maxValue(100),
  );
  const schema2 = v.pipe(
    v.string(),
    v.value('fixedValue'),
  )

  const actions1 = getValueActions(schema1);
  const actions2 = getValueActions(schema2);

  assertEquals(actions1.length, 2);
  assertEquals(actions1.some(a => a.type === 'min_value'), true);
  assertEquals(actions1.some(a => a.type === 'max_value'), true);
  assertEquals(actions2.length, 1);
  assertEquals(actions2[0].type, 'value');
});

Deno.test('getValueActions - No pipe returns null', () => {
  const schema = v.string();
  const actions = getValueActions(schema);

  assertEquals(actions, null);
});

Deno.test('getSizeActions - Get size constraint actions', () => {
  const schema1 = v.pipe(
    v.set(v.string()),
    v.minSize(2),
    v.maxSize(10),
  );
  const schema2 = v.pipe(
    v.map(v.string(), v.number()),
    v.size(5),
  )

  const actions1 = getSizeActions(schema1);
  const actions2 = getSizeActions(schema2);

  assertEquals(actions1.length, 2);
  assertEquals(actions1.some(a => a.type === 'min_size'), true);
  assertEquals(actions1.some(a => a.type === 'max_size'), true);
  assertEquals(actions2.length, 1);
  assertEquals(actions2[0].type, 'size');
});

Deno.test('getSizeActions - No pipe returns null', () => {
  const schema = v.string();
  const actions = getSizeActions(schema);

  assertEquals(actions, null);
});

Deno.test('getBytesActions - Get bytes constraint actions', () => {
  const schema1 = v.pipe(
    v.string(),
    v.minBytes(10),
    v.maxBytes(100),
  );
  const schema2 = v.pipe(
    v.string(),
    v.bytes(50),
  )

  const actions1 = getBytesActions(schema1);
  const actions2 = getBytesActions(schema2);

  assertEquals(actions1.length, 2);
  assertEquals(actions1.some(a => a.type === 'min_bytes'), true);
  assertEquals(actions1.some(a => a.type === 'max_bytes'), true);
  assertEquals(actions2.length, 1);
  assertEquals(actions2[0].type, 'bytes');
});
