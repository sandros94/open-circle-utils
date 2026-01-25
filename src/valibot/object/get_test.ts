import { assertEquals } from '@std/assert';
import * as v from 'valibot';
import { getObjectEntries, getObjectEntry, getObjectFields, getObjectField } from './get.ts';

Deno.test('getObjectEntries - With optional and nullable fields', () => {
  const schema = v.object({
    required: v.string(),
    optional: v.optional(v.string()),
    nullable: v.nullable(v.number()),
  });

  const entries = getObjectEntries(schema);
  assertEquals(entries?.length, 3);

  const optionalEntry = entries?.find(e => e[0] === 'optional');
  assertEquals(optionalEntry?.[1].type, 'optional');

  const nullableEntry = entries?.find(e => e[0] === 'nullable');
  assertEquals(nullableEntry?.[1].type, 'nullable');
});

Deno.test('getObjectEntry - Get specific entry', () => {
  const schema = v.object({
    name: v.string(),
    age: v.number(),
  });

  const nameSchema = getObjectEntry(schema, 'name');
  assertEquals(nameSchema.type, 'string');

  const ageSchema = getObjectEntry(schema, 'age');
  assertEquals(ageSchema.type, 'number');
});

Deno.test('getObjectEntry - Non-existent key returns null', () => {
  const schema = v.object({
    name: v.string(),
  });

  const result = getObjectEntry(schema, 'nonExistent');
  assertEquals(result, null);
});

Deno.test('getObjectEntry - Non-object schema returns null', () => {
  const schema = v.string();
  const result = getObjectEntry(schema, 'anything');
  assertEquals(result, null);
});

Deno.test('getObjectFields - With optional and nullable fields', () => {
  const schema = v.object({
    required: v.string(),
    optional: v.optional(v.string()),
    nullable: v.nullable(v.number()),
  });

  const entries = getObjectFields(schema);
  assertEquals(entries.length, 3);

  const optionalEntry = entries.find(e => e.key === 'optional');
  assertEquals(optionalEntry?.schema.type, 'optional');

  const nullableEntry = entries.find(e => e.key === 'nullable');
  assertEquals(nullableEntry?.schema.type, 'nullable');
});

Deno.test('getObjectField - Get specific entry', () => {
  const schema = v.object({
    name: v.string(),
    age: v.number(),
  });

  const nameSchema = getObjectField(schema, 'name');
  assertEquals(nameSchema !== null, true);
  assertEquals(nameSchema.key, 'name');
  assertEquals(nameSchema.schema.type, 'string');

  const ageSchema = getObjectField(schema, 'age');
  assertEquals(ageSchema !== null, true);
  assertEquals(ageSchema.key, 'age');
  assertEquals(ageSchema.schema.type, 'number');
});

Deno.test('getObjectField - Non-existent key returns null', () => {
  const schema = v.object({
    name: v.string(),
  });

  const result = getObjectField(schema, 'nonExistent');
  assertEquals(result, null);
});

Deno.test('getObjectField - Non-object schema returns null', () => {
  const schema = v.string();
  const result = getObjectField(schema, 'anything');
  assertEquals(result, null);
});
