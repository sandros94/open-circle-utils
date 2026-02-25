import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { getSchemaInfo } from "./get.ts";

describe("info", () => {
  describe("get", () => {
    describe("getSchemaInfo", () => {
      it("returns undefined title/description and empty examples/metadata for a plain schema", () => {
        const schema = v.string();
        const info = getSchemaInfo(schema);
        expect(info.title).toBeUndefined();
        expect(info.description).toBeUndefined();
        // valibot's getExamples returns [] and getMetadata returns {} when not piped
        expect(info.examples).toEqual([]);
        expect(info.metadata).toEqual({});
      });

      it("extracts title from a piped schema", () => {
        const schema = v.pipe(v.string(), v.title("My Title"));
        const info = getSchemaInfo(schema);
        expect(info.title).toBe("My Title");
      });

      it("extracts description from a piped schema", () => {
        const schema = v.pipe(v.string(), v.description("A description"));
        const info = getSchemaInfo(schema);
        expect(info.description).toBe("A description");
      });

      it("extracts examples from a piped schema", () => {
        const schema = v.pipe(v.string(), v.examples(["foo", "bar"]));
        const info = getSchemaInfo(schema);
        expect(info.examples).toEqual(["foo", "bar"]);
      });

      it("extracts metadata from a piped schema", () => {
        const schema = v.pipe(v.string(), v.metadata({ custom: "value" }));
        const info = getSchemaInfo(schema);
        expect(info.metadata).toEqual({ custom: "value" });
      });

      it("extracts info from the inner schema when wrapped in optional", () => {
        const inner = v.pipe(v.string(), v.title("Wrapped Title"));
        const schema = v.optional(inner);
        const info = getSchemaInfo(schema);
        expect(info.title).toBe("Wrapped Title");
      });

      it("extracts info from the inner schema when wrapped in nullable", () => {
        const inner = v.pipe(v.number(), v.description("Nullable desc"));
        const schema = v.nullable(inner);
        const info = getSchemaInfo(schema);
        expect(info.description).toBe("Nullable desc");
      });

      it("extracts all fields together when all are present", () => {
        const schema = v.pipe(
          v.string(),
          v.title("Full Title"),
          v.description("Full desc"),
          v.examples(["ex1"]),
          v.metadata({ key: "val" })
        );
        const info = getSchemaInfo(schema);
        expect(info.title).toBe("Full Title");
        expect(info.description).toBe("Full desc");
        expect(info.examples).toEqual(["ex1"]);
        expect(info.metadata).toEqual({ key: "val" });
      });
    });
  });
});
