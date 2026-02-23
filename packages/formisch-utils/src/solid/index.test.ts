import { describe, test, expect, vi, beforeEach } from "vitest";
import * as v from "valibot";

vi.mock("@formisch/solid", () => ({
  createForm: vi.fn((opts: unknown) => opts),
}));

import { createFormFields } from "./index.ts";
import { createForm } from "@formisch/solid";

const mockedCreateForm = vi.mocked(createForm);

// ─── createFormFields ─────────────────────────────────────────────────────────

describe("createFormFields", () => {
  beforeEach(() => mockedCreateForm.mockClear());

  test("returns root FormFieldConfig as config", () => {
    const schema = v.object({ name: v.string() });
    const { config } = createFormFields(schema);
    expect(config.kind).toBe("object");
  });

  test("passes schema to createForm", () => {
    const schema = v.object({ name: v.string() });
    createFormFields(schema);
    expect(mockedCreateForm).toHaveBeenCalledWith(expect.objectContaining({ schema }));
  });

  test("generates initialInput from schema", () => {
    const schema = v.object({ name: v.string(), active: v.boolean() });
    createFormFields(schema);
    expect(mockedCreateForm).toHaveBeenCalledWith(
      expect.objectContaining({ initialInput: { name: "", active: false } })
    );
  });

  test("merges user initialInput override on top of generated defaults", () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    createFormFields(schema, { initialInput: { age: 25 } });
    expect(mockedCreateForm).toHaveBeenCalledWith(
      expect.objectContaining({ initialInput: { name: "", age: 25 } })
    );
  });

  test("forwards validate option", () => {
    const schema = v.object({ name: v.string() });
    createFormFields(schema, { validate: "blur" });
    expect(mockedCreateForm).toHaveBeenCalledWith(expect.objectContaining({ validate: "blur" }));
  });

  test("forwards revalidate option", () => {
    const schema = v.object({ name: v.string() });
    createFormFields(schema, { revalidate: "submit" });
    expect(mockedCreateForm).toHaveBeenCalledWith(
      expect.objectContaining({ revalidate: "submit" })
    );
  });

  test("validate is undefined when not provided", () => {
    const schema = v.object({ name: v.string() });
    createFormFields(schema);
    expect(mockedCreateForm).toHaveBeenCalledWith(expect.objectContaining({ validate: undefined }));
  });

  test("revalidate is undefined when not provided", () => {
    const schema = v.object({ name: v.string() });
    createFormFields(schema);
    expect(mockedCreateForm).toHaveBeenCalledWith(
      expect.objectContaining({ revalidate: undefined })
    );
  });
});
