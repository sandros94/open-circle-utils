import { assertEquals } from "@std/assert";
import {
  bigint,
  number,
  string,
  boolean,
  date,
  blob,
  symbol,
  any,
  unknown,
  never,
  nan,
  null_,
  undefined_,
  void_,
} from "valibot";
import {
  isAnySchema,
  isBigintSchema,
  isBlobSchema,
  isBooleanSchema,
  isDateSchema,
  isNanSchema,
  isNeverSchema,
  isNullSchema,
  isNumberSchema,
  isStringSchema,
  isSymbolSchema,
  isUndefinedSchema,
  isUnknownSchema,
  isVoidSchema,
} from "./is.ts";

Deno.test("isStringSchema", () => {
  assertEquals(isStringSchema(string()), true);
  assertEquals(isStringSchema(number()), false);
});

Deno.test("isNumberSchema", () => {
  assertEquals(isNumberSchema(number()), true);
  assertEquals(isNumberSchema(string()), false);
});

Deno.test("isBooleanSchema", () => {
  assertEquals(isBooleanSchema(boolean()), true);
  assertEquals(isBooleanSchema(string()), false);
});

Deno.test("isBigintSchema", () => {
  assertEquals(isBigintSchema(bigint()), true);
  assertEquals(isBigintSchema(number()), false);
});

Deno.test("isDateSchema", () => {
  assertEquals(isDateSchema(date()), true);
  assertEquals(isDateSchema(string()), false);
});

Deno.test("isBlobSchema", () => {
  assertEquals(isBlobSchema(blob()), true);
  assertEquals(isBlobSchema(string()), false);
});

Deno.test("isSymbolSchema", () => {
  assertEquals(isSymbolSchema(symbol()), true);
  assertEquals(isSymbolSchema(string()), false);
});

Deno.test("isAnySchema", () => {
  assertEquals(isAnySchema(any()), true);
  assertEquals(isAnySchema(string()), false);
});

Deno.test("isUnknownSchema", () => {
  assertEquals(isUnknownSchema(unknown()), true);
  assertEquals(isUnknownSchema(string()), false);
});

Deno.test("isNeverSchema", () => {
  assertEquals(isNeverSchema(never()), true);
  assertEquals(isNeverSchema(string()), false);
});

Deno.test("isNanSchema", () => {
  assertEquals(isNanSchema(nan()), true);
  assertEquals(isNanSchema(number()), false);
});

Deno.test("isNullSchema", () => {
  assertEquals(isNullSchema(null_()), true);
  assertEquals(isNullSchema(string()), false);
});

Deno.test("isUndefinedSchema", () => {
  assertEquals(isUndefinedSchema(undefined_()), true);
  assertEquals(isUndefinedSchema(string()), false);
});

Deno.test("isVoidSchema", () => {
  assertEquals(isVoidSchema(void_()), true);
  assertEquals(isVoidSchema(string()), false);
});
