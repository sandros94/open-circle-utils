import { describe, test, expect, expectTypeOf, vi, beforeEach } from "vitest";
import * as v from "valibot";
import type { LeafFormFieldConfig, ObjectFormFieldConfig } from "../_types/index.ts";

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

  // ─── Config structure tests ─────────────────────────────────────────────

  test("config reflects nested object with fields", () => {
    const schema = v.object({
      user: v.object({ name: v.string(), age: v.number() }),
    });
    const { config } = useFormFields(schema);
    expect(config.kind).toBe("object");
    if (config.kind !== "object") return;
    expect(config.fields).toHaveLength(1);
    const userField = config.fields[0];
    expect(userField.kind).toBe("object");
    expect(userField.key).toBe("user");
    expect(userField.fields).toHaveLength(2);
    expect(userField.fields[0]!.key).toBe("name");
  });

  test("config field paths are correct", () => {
    const schema = v.object({
      address: v.object({ street: v.string(), city: v.string() }),
    });
    const { config } = useFormFields(schema);
    if (config.kind !== "object") return;
    const address = config.fields[0];
    expect(address.path).toEqual(["address"]);
    expect(address.fields[0]!.path).toEqual(["address", "street"]);
    expect(address.fields[1]!.path).toEqual(["address", "city"]);
  });

  test("config handles array of objects", () => {
    const schema = v.object({
      items: v.array(v.object({ label: v.string(), done: v.boolean() })),
    });
    const { config } = useFormFields(schema);
    if (config.kind !== "object") return;
    const items = config.fields[0];
    expect(items.kind).toBe("array");
    expect(items.item.kind).toBe("object");
    expect(items.item.fields).toHaveLength(2);
  });

  test("config handles variant schema", () => {
    const schema = v.variant("type", [
      v.object({ type: v.literal("a"), name: v.string() }),
      v.object({ type: v.literal("b"), value: v.number() }),
    ]);
    const { config } = useFormFields(schema);
    expect(config.kind).toBe("variant");
    if (config.kind !== "variant") return;
    expect(config.discriminatorKey).toBe("type");
    expect(config.branches).toHaveLength(2);
  });

  test("config handles optional and nullable wrappers", () => {
    const schema = v.object({
      required: v.string(),
      optional: v.optional(v.string()),
      nullable: v.nullable(v.number()),
      nullish: v.nullish(v.boolean()),
    });
    const { config } = useFormFields(schema);
    if (config.kind !== "object") return;
    expect(config.fields[0]!.required).toBe(true);
    expect(config.fields[0]!.nullable).toBe(false);
    expect(config.fields[1]!.required).toBe(false);
    expect(config.fields[2]!.nullable).toBe(true);
    expect(config.fields[3]!.required).toBe(false);
    expect(config.fields[3]!.nullable).toBe(true);
  });

  test("config handles record schema", () => {
    const schema = v.record(v.string(), v.number());
    const { config } = useFormFields(schema);
    expect(config.kind).toBe("record");
    if (config.kind !== "record") return;
    expect(config.keyField.kind).toBe("leaf");
    expect(config.valueField.kind).toBe("leaf");
  });

  test("config type narrows to ObjectFormFieldConfig<LeafFormFieldConfig> for object schemas", () => {
    const schema = v.object({ name: v.string() });
    const { config } = useFormFields(schema);
    expectTypeOf(config).toEqualTypeOf<
      ObjectFormFieldConfig<LeafFormFieldConfig<readonly ["name"]>, readonly []>
    >();
  });

  test("config type narrows to LeafFormFieldConfig for string schemas", () => {
    const schema = v.string();
    const { config } = useFormFields(schema);
    expectTypeOf(config).toEqualTypeOf<LeafFormFieldConfig<readonly []>>();
  });
});
