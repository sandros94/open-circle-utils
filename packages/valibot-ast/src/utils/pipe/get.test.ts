import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
  getPipeItems,
  getPipeActions,
  findPipeItems,
  getValidationActions,
  getTransformationActions,
  getLengthActions,
  getValueActions,
} from "./get.ts";

describe("getPipeItems", () => {
  it("returns null for schema without pipe", () => {
    expect(getPipeItems(v.string())).toBeNull();
  });

  it("returns pipe items for schema with pipe", () => {
    const schema = v.pipe(v.string(), v.minLength(3));
    const items = getPipeItems(schema);
    expect(items).not.toBeNull();
    expect(items!.length).toBeGreaterThan(0);
  });
});

describe("getPipeActions", () => {
  it("returns null for schema without pipe", () => {
    expect(getPipeActions(v.string())).toBeNull();
  });

  it("filters out schema items from pipe", () => {
    const schema = v.pipe(v.string(), v.minLength(3), v.title("test"));
    const actions = getPipeActions(schema);
    expect(actions).not.toBeNull();
    // getPipeActions filters out kind==="schema" but keeps validation, transformation, and metadata
    expect(actions!.every((a) => a.kind !== "schema")).toBe(true);
    expect(actions!.length).toBe(2); // minLength(validation) + title(metadata)
  });
});

describe("findPipeItems", () => {
  it("finds items by kind", () => {
    const schema = v.pipe(v.string(), v.minLength(3), v.trim());
    const validations = findPipeItems(schema, { kind: ["validation"] });
    expect(validations.length).toBe(1);
    const transformations = findPipeItems(schema, { kind: ["transformation"] });
    expect(transformations.length).toBe(1);
  });

  it("finds items by type", () => {
    const schema = v.pipe(v.string(), v.minLength(3), v.maxLength(10));
    const items = findPipeItems(schema, { type: ["min_length"] });
    expect(items.length).toBe(1);
  });

  it("finds items by type array", () => {
    const schema = v.pipe(v.string(), v.minLength(3), v.maxLength(10));
    const items = findPipeItems(schema, { type: ["min_length", "max_length"] });
    expect(items.length).toBe(2);
  });
});

describe("specialized extractors", () => {
  it("getValidationActions filters to validations", () => {
    const schema = v.pipe(v.string(), v.minLength(3), v.trim());
    const actions = getValidationActions(schema);
    expect(actions).not.toBeNull();
    expect(actions!.every((a) => a.kind === "validation")).toBe(true);
  });

  it("getTransformationActions filters to transformations", () => {
    const schema = v.pipe(v.string(), v.trim(), v.toLowerCase());
    const actions = getTransformationActions(schema);
    expect(actions).not.toBeNull();
    expect(actions!.every((a) => a.kind === "transformation")).toBe(true);
  });

  it("getLengthActions", () => {
    const schema = v.pipe(v.string(), v.minLength(3), v.maxLength(10));
    const actions = getLengthActions(schema);
    expect(actions.length).toBe(2);
  });

  it("getValueActions", () => {
    const schema = v.pipe(v.number(), v.minValue(1), v.maxValue(100));
    const actions = getValueActions(schema);
    expect(actions.length).toBe(2);
  });
});
