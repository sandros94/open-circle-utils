import { describe, test, expect, vi, beforeEach } from "vitest";
import * as v from "valibot";

vi.mock("@formisch/vue", () => ({
  useForm: vi.fn((opts: unknown) => opts),
}));

import { useFormFields } from "./index.ts";
import { useForm } from "@formisch/vue";

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
      expect.objectContaining({ initialInput: { name: "", age: undefined } })
    );
  });

  test("merges user initialInput override on top of generated defaults", () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    useFormFields(schema, { initialInput: { name: "Alice" } });
    expect(mockedUseForm).toHaveBeenCalledWith(
      expect.objectContaining({ initialInput: { name: "Alice", age: undefined } })
    );
  });

  test("forwards validate option", () => {
    const schema = v.object({ name: v.string() });
    useFormFields(schema, { validate: "input" });
    expect(mockedUseForm).toHaveBeenCalledWith(expect.objectContaining({ validate: "input" }));
  });

  test("forwards revalidate option", () => {
    const schema = v.object({ name: v.string() });
    useFormFields(schema, { revalidate: "blur" });
    expect(mockedUseForm).toHaveBeenCalledWith(expect.objectContaining({ revalidate: "blur" }));
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
});
