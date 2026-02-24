import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  isStringSchema,
  isNumberSchema,
  isBooleanSchema,
  isBigintSchema,
  isDateSchema,
  isSymbolSchema,
  isAnySchema,
  isUnknownSchema,
  isNeverSchema,
  isNanSchema,
  isNullSchema,
  isUndefinedSchema,
  isVoidSchema,
  isBlobSchema,
} from "./is.ts";
import { isArraySchema, isTupleSchema, isTupleWithRestSchema } from "../array/is.ts";
import { isObjectSchema, isObjectWithRestSchema } from "../object/is.ts";
import { isUnionSchema, isVariantSchema, isEnumSchema, isPicklistSchema } from "../choice/is.ts";
import { isRecordSchema } from "../record/is.ts";
import {
  isMapSchema,
  isSetSchema,
  isIntersectSchema,
  isInstanceSchema,
  isFunctionSchema,
} from "../special/is.ts";
import { isLazySchema } from "../lazy/is.ts";
import { isLiteralSchema } from "../literal/is.ts";

describe("type guards: primitives", () => {
  it("isStringSchema", () => {
    expect(isStringSchema(v.string())).toBe(true);
    expect(isStringSchema(v.number())).toBe(false);
  });
  it("isNumberSchema", () => {
    expect(isNumberSchema(v.number())).toBe(true);
    expect(isNumberSchema(v.string())).toBe(false);
  });
  it("isBooleanSchema", () => expect(isBooleanSchema(v.boolean())).toBe(true));
  it("isBigintSchema", () => expect(isBigintSchema(v.bigint())).toBe(true));
  it("isDateSchema", () => expect(isDateSchema(v.date())).toBe(true));
  it("isSymbolSchema", () => expect(isSymbolSchema(v.symbol())).toBe(true));
  it("isAnySchema", () => expect(isAnySchema(v.any())).toBe(true));
  it("isUnknownSchema", () => expect(isUnknownSchema(v.unknown())).toBe(true));
  it("isNeverSchema", () => expect(isNeverSchema(v.never())).toBe(true));
  it("isNanSchema", () => expect(isNanSchema(v.nan())).toBe(true));
  it("isNullSchema", () => expect(isNullSchema(v.null_())).toBe(true));
  it("isUndefinedSchema", () => expect(isUndefinedSchema(v.undefined_())).toBe(true));
  it("isVoidSchema", () => expect(isVoidSchema(v.void_())).toBe(true));
  it("isBlobSchema", () => expect(isBlobSchema(v.blob())).toBe(true));
});

describe("type guards: compound schemas", () => {
  it("isArraySchema", () => {
    expect(isArraySchema(v.array(v.string()))).toBe(true);
    expect(isArraySchema(v.string())).toBe(false);
  });
  it("isTupleSchema", () => {
    expect(isTupleSchema(v.tuple([v.string()]))).toBe(true);
    expect(isTupleSchema(v.looseTuple([v.string()]))).toBe(true);
    expect(isTupleSchema(v.strictTuple([v.string()]))).toBe(true);
  });
  it("isTupleWithRestSchema", () => {
    expect(isTupleWithRestSchema(v.tupleWithRest([v.string()], v.number()))).toBe(true);
    expect(isTupleWithRestSchema(v.tuple([v.string()]))).toBe(false);
  });
  it("isObjectSchema", () => {
    expect(isObjectSchema(v.object({}))).toBe(true);
    expect(isObjectSchema(v.looseObject({}))).toBe(true);
    expect(isObjectSchema(v.strictObject({}))).toBe(true);
    expect(isObjectSchema(v.string())).toBe(false);
  });
  it("isObjectWithRestSchema", () => {
    expect(isObjectWithRestSchema(v.objectWithRest({}, v.string()))).toBe(true);
    expect(isObjectWithRestSchema(v.object({}))).toBe(false);
  });
  it("isUnionSchema", () => expect(isUnionSchema(v.union([v.string(), v.number()]))).toBe(true));
  it("isVariantSchema", () => {
    expect(isVariantSchema(v.variant("type", [v.object({ type: v.literal("a") })]))).toBe(true);
  });
  it("isRecordSchema", () => expect(isRecordSchema(v.record(v.string(), v.number()))).toBe(true));
  it("isMapSchema", () => expect(isMapSchema(v.map(v.string(), v.number()))).toBe(true));
  it("isSetSchema", () => expect(isSetSchema(v.set(v.string()))).toBe(true));
  it("isIntersectSchema", () => expect(isIntersectSchema(v.intersect([v.object({})]))).toBe(true));
  it("isLiteralSchema", () => expect(isLiteralSchema(v.literal("x"))).toBe(true));
  it("isEnumSchema", () => {
    enum E {
      A = "a",
    }
    expect(isEnumSchema(v.enum(E))).toBe(true);
  });
  it("isPicklistSchema", () => expect(isPicklistSchema(v.picklist(["a", "b"]))).toBe(true));
  it("isInstanceSchema", () => expect(isInstanceSchema(v.instance(Date))).toBe(true));
  it("isLazySchema", () => expect(isLazySchema(v.lazy(() => v.string()))).toBe(true));
  it("isFunctionSchema", () => expect(isFunctionSchema(v.function())).toBe(true));
});
