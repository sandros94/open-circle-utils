import { describe, test, expect, vi, beforeEach } from "vitest";
import * as v from "valibot";

// vi.mock is hoisted above imports — @formisch/react is mocked before the
// adapter loads, so the adapter's own import gets the mocked version.
vi.mock("@formisch/react", () => ({
  useForm: vi.fn((opts: unknown) => opts),
}));

import { useFormFields } from "./index.ts";
import { useForm } from "@formisch/react";

const mockedUseForm = vi.mocked(useForm);

// ─── useFormFields ────────────────────────────────────────────────────────────

describe("useFormFields", () => {
  beforeEach(() => mockedUseForm.mockClear());

  test("returns root FormFieldConfig as config", () => {
    const schema = v.object({ name: v.string() });
    const { config } = useFormFields(schema);
    expect(config.kind).toBe("object");
  });

  test("passes schema to useForm", () => {
    const schema = v.object({ name: v.string() });
    useFormFields(schema);
    expect(mockedUseForm).toHaveBeenCalledWith(expect.objectContaining({ schema }));
  });

  test("generates initialInput from schema", () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    useFormFields(schema);
    expect(mockedUseForm).toHaveBeenCalledWith(
      expect.objectContaining({ initialInput: { name: "", age: 0 } })
    );
  });

  test("merges user initialInput override on top of generated defaults", () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    useFormFields(schema, { initialInput: { name: "John" } });
    expect(mockedUseForm).toHaveBeenCalledWith(
      expect.objectContaining({ initialInput: { name: "John", age: 0 } })
    );
  });

  test("forwards validate option", () => {
    const schema = v.object({ name: v.string() });
    useFormFields(schema, { validate: "blur" });
    expect(mockedUseForm).toHaveBeenCalledWith(expect.objectContaining({ validate: "blur" }));
  });

  test("forwards revalidate option", () => {
    const schema = v.object({ name: v.string() });
    useFormFields(schema, { revalidate: "submit" });
    expect(mockedUseForm).toHaveBeenCalledWith(expect.objectContaining({ revalidate: "submit" }));
  });

  test("validate is undefined when not provided", () => {
    const schema = v.object({ name: v.string() });
    useFormFields(schema);
    expect(mockedUseForm).toHaveBeenCalledWith(expect.objectContaining({ validate: undefined }));
  });

  test("revalidate is undefined when not provided", () => {
    const schema = v.object({ name: v.string() });
    useFormFields(schema);
    expect(mockedUseForm).toHaveBeenCalledWith(expect.objectContaining({ revalidate: undefined }));
  });

  test("config reflects schema structure (nested object)", () => {
    const schema = v.object({
      user: v.object({ name: v.string(), age: v.number() }),
    });
    const { config } = useFormFields(schema);
    expect(config.kind).toBe("object");
    if (config.kind === "object") {
      expect(config.fields[0].kind).toBe("object");
      expect(config.fields[0].key).toBe("user");
    }
  });
});
