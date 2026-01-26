import { test, expect } from "vitest";
import * as v from "valibot";
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

test("isStringSchema", () => {
  expect(isStringSchema(v.string())).toBe(true);
  expect(isStringSchema(v.number())).toBe(false);
});

test("isNumberSchema", () => {
  expect(isNumberSchema(v.number())).toBe(true);
  expect(isNumberSchema(v.string())).toBe(false);
});

test("isBooleanSchema", () => {
  expect(isBooleanSchema(v.boolean())).toBe(true);
  expect(isBooleanSchema(v.string())).toBe(false);
});

test("isBigintSchema", () => {
  expect(isBigintSchema(v.bigint())).toBe(true);
  expect(isBigintSchema(v.number())).toBe(false);
});

test("isDateSchema", () => {
  expect(isDateSchema(v.date())).toBe(true);
  expect(isDateSchema(v.string())).toBe(false);
});

test("isBlobSchema", () => {
  expect(isBlobSchema(v.blob())).toBe(true);
  expect(isBlobSchema(v.string())).toBe(false);
});

test("isSymbolSchema", () => {
  expect(isSymbolSchema(v.symbol())).toBe(true);
  expect(isSymbolSchema(v.string())).toBe(false);
});

test("isAnySchema", () => {
  expect(isAnySchema(v.any())).toBe(true);
  expect(isAnySchema(v.string())).toBe(false);
});

test("isUnknownSchema", () => {
  expect(isUnknownSchema(v.unknown())).toBe(true);
  expect(isUnknownSchema(v.string())).toBe(false);
});

test("isNeverSchema", () => {
  expect(isNeverSchema(v.never())).toBe(true);
  expect(isNeverSchema(v.string())).toBe(false);
});

test("isNanSchema", () => {
  expect(isNanSchema(v.nan())).toBe(true);
  expect(isNanSchema(v.number())).toBe(false);
});

test("isNullSchema", () => {
  expect(isNullSchema(v.null_())).toBe(true);
  expect(isNullSchema(v.string())).toBe(false);
});

test("isUndefinedSchema", () => {
  expect(isUndefinedSchema(v.undefined_())).toBe(true);
  expect(isUndefinedSchema(v.string())).toBe(false);
});

test("isVoidSchema", () => {
  expect(isVoidSchema(v.void_())).toBe(true);
  expect(isVoidSchema(v.string())).toBe(false);
});
