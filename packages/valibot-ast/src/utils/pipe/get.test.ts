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
  getSizeActions,
  getBytesActions,
} from "./get.ts";

describe("pipe", () => {
  describe("get", () => {
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

      it("includes both the base schema and actions", () => {
        const schema = v.pipe(v.string(), v.minLength(1), v.maxLength(10));
        const items = getPipeItems(schema);
        expect(items!.some((i) => i.kind === "schema")).toBe(true);
        expect(items!.some((i) => i.kind === "validation")).toBe(true);
      });
    });

    describe("getPipeActions", () => {
      it("returns null for schema without pipe", () => {
        expect(getPipeActions(v.string())).toBeNull();
      });

      it("filters out schema items, keeping only actions", () => {
        const schema = v.pipe(v.string(), v.minLength(3), v.title("test"));
        const actions = getPipeActions(schema);
        expect(actions).not.toBeNull();
        // getPipeActions filters out kind==="schema" but keeps validation, transformation, and metadata
        // @ts-expect-error - we want to check that no items have kind "schema"
        expect(actions!.every((a) => a.kind !== "schema")).toBe(true);
        expect(actions!.length).toBe(2); // minLength(validation) + title(metadata)
      });
    });

    describe("findPipeItems", () => {
      it("returns null for schema without pipe", () => {
        expect(findPipeItems(v.string(), { kind: ["validation"] })).toBeNull();
      });

      it("finds items by kind: validation", () => {
        const schema = v.pipe(v.string(), v.minLength(3), v.trim());
        const validations = findPipeItems(schema, { kind: ["validation"] });
        expect(validations!.length).toBe(1);
        expect(validations![0].kind).toBe("validation");
      });

      it("finds items by kind: transformation", () => {
        const schema = v.pipe(v.string(), v.minLength(3), v.trim());
        const transformations = findPipeItems(schema, { kind: ["transformation"] });
        expect(transformations!.length).toBe(1);
        expect(transformations![0].kind).toBe("transformation");
      });

      it("finds items by type", () => {
        const schema = v.pipe(v.string(), v.minLength(3), v.maxLength(10));
        const items = findPipeItems(schema, { type: ["min_length"] });
        expect(items!.length).toBe(1);
        expect(items![0].type).toBe("min_length");
      });

      it("finds items by multiple types", () => {
        const schema = v.pipe(v.string(), v.minLength(3), v.maxLength(10));
        const items = findPipeItems(schema, { type: ["min_length", "max_length"] });
        expect(items!.length).toBe(2);
      });

      it("combines kind and type filters with AND logic", () => {
        const schema = v.pipe(v.string(), v.minLength(3), v.maxLength(10), v.trim());
        const items = findPipeItems(schema, {
          kind: ["validation"],
          type: ["min_length"],
        });
        expect(items!.length).toBe(1);
        expect(items![0].type).toBe("min_length");
      });
    });

    describe("getValidationActions", () => {
      it("returns null for schema without pipe", () => {
        expect(getValidationActions(v.string())).toBeNull();
      });

      it("filters to only validation actions", () => {
        const schema = v.pipe(v.string(), v.minLength(3), v.trim());
        const actions = getValidationActions(schema);
        expect(actions).not.toBeNull();
        expect(actions!.every((a) => a.kind === "validation")).toBe(true);
        expect(actions!.length).toBe(1);
      });
    });

    describe("getTransformationActions", () => {
      it("returns null for schema without pipe", () => {
        expect(getTransformationActions(v.string())).toBeNull();
      });

      it("filters to only transformation actions", () => {
        const schema = v.pipe(v.string(), v.trim(), v.toLowerCase());
        const actions = getTransformationActions(schema);
        expect(actions).not.toBeNull();
        expect(actions!.every((a) => a.kind === "transformation")).toBe(true);
        expect(actions!.length).toBe(2);
      });
    });

    describe("getLengthActions", () => {
      it("returns null for schema without pipe", () => {
        expect(getLengthActions(v.string())).toBeNull();
      });

      it("returns minLength and maxLength actions", () => {
        const schema = v.pipe(v.string(), v.minLength(3), v.maxLength(10));
        const actions = getLengthActions(schema);
        expect(actions!.length).toBe(2);
        expect(actions!.some((a) => a.type === "min_length")).toBe(true);
        expect(actions!.some((a) => a.type === "max_length")).toBe(true);
      });

      it("returns exact length action", () => {
        const schema = v.pipe(v.string(), v.length(5));
        const actions = getLengthActions(schema);
        expect(actions!.length).toBe(1);
        expect(actions![0].type).toBe("length");
      });
    });

    describe("getValueActions", () => {
      it("returns null for schema without pipe", () => {
        expect(getValueActions(v.number())).toBeNull();
      });

      it("returns minValue and maxValue actions", () => {
        const schema = v.pipe(v.number(), v.minValue(1), v.maxValue(100));
        const actions = getValueActions(schema);
        expect(actions!.length).toBe(2);
        expect(actions!.some((a) => a.type === "min_value")).toBe(true);
        expect(actions!.some((a) => a.type === "max_value")).toBe(true);
      });
    });

    describe("getSizeActions", () => {
      it("returns null for schema without pipe", () => {
        expect(getSizeActions(v.set(v.string()))).toBeNull();
      });

      it("returns minSize and maxSize actions for set schema", () => {
        const schema = v.pipe(v.set(v.string()), v.minSize(1), v.maxSize(10));
        const actions = getSizeActions(schema);
        expect(actions!.length).toBe(2);
        expect(actions!.some((a) => a.type === "min_size")).toBe(true);
        expect(actions!.some((a) => a.type === "max_size")).toBe(true);
      });

      it("returns exact size action", () => {
        const schema = v.pipe(v.set(v.string()), v.size(5));
        const actions = getSizeActions(schema);
        expect(actions!.length).toBe(1);
        expect(actions![0].type).toBe("size");
      });
    });

    describe("getBytesActions", () => {
      it("returns null for schema without pipe", () => {
        expect(getBytesActions(v.string())).toBeNull();
      });

      it("returns minBytes and maxBytes actions", () => {
        const schema = v.pipe(v.string(), v.minBytes(1), v.maxBytes(100));
        const actions = getBytesActions(schema);
        expect(actions!.length).toBe(2);
        expect(actions!.some((a) => a.type === "min_bytes")).toBe(true);
        expect(actions!.some((a) => a.type === "max_bytes")).toBe(true);
      });

      it("returns exact bytes action", () => {
        const schema = v.pipe(v.string(), v.bytes(16));
        const actions = getBytesActions(schema);
        expect(actions!.length).toBe(1);
        expect(actions![0].type).toBe("bytes");
      });
    });
  });
});
