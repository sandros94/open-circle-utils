import { describe, test, expect, expectTypeOf, vi, beforeEach } from "vitest";
import * as v from "valibot";
import type { LeafFormFieldConfig, ObjectFormFieldConfig } from "../_types/index.ts";

vi.mock("@formisch/qwik", () => ({
  useForm$: vi.fn((opts: unknown) => opts),
}));

import { useFormFields$ } from "./index.ts";
import { useForm$ } from "@formisch/qwik";

const mockedUseForm$ = vi.mocked(useForm$);

// ─── useFormFields$ ───────────────────────────────────────────────────────────

describe("useFormFields$", () => {
  beforeEach(() => mockedUseForm$.mockClear());

  test("returns root FormFieldConfig as config", () => {
    const schema = v.object({ name: v.string() });
    const { config } = useFormFields$(schema);
    expect(config.kind).toBe("object");
  });

  test("passes schema to useForm$", () => {
    const schema = v.object({ name: v.string() });
    useFormFields$(schema);
    expect(mockedUseForm$).toHaveBeenCalledWith(expect.objectContaining({ schema }));
  });

  test("generates initialInput from schema", () => {
    const schema = v.object({ title: v.string(), count: v.number() });
    useFormFields$(schema);
    expect(mockedUseForm$).toHaveBeenCalledWith(
      expect.objectContaining({ initialInput: { title: "", count: undefined } })
    );
  });

  test("merges user initialInput override on top of generated defaults", () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    useFormFields$(schema, { initialInput: { age: 30 } });
    expect(mockedUseForm$).toHaveBeenCalledWith(
      expect.objectContaining({ initialInput: { name: "", age: 30 } })
    );
  });

  test("forwards validate option", () => {
    const schema = v.object({ name: v.string() });
    useFormFields$(schema, { validate: "blur" });
    expect(mockedUseForm$).toHaveBeenCalledWith(expect.objectContaining({ validate: "blur" }));
  });

  test("forwards revalidate option", () => {
    const schema = v.object({ name: v.string() });
    useFormFields$(schema, { revalidate: "input" });
    expect(mockedUseForm$).toHaveBeenCalledWith(expect.objectContaining({ revalidate: "input" }));
  });

  test("validate is undefined when not provided", () => {
    const schema = v.object({ name: v.string() });
    useFormFields$(schema);
    expect(mockedUseForm$).toHaveBeenCalledWith(expect.objectContaining({ validate: undefined }));
  });

  test("revalidate is undefined when not provided", () => {
    const schema = v.object({ name: v.string() });
    useFormFields$(schema);
    expect(mockedUseForm$).toHaveBeenCalledWith(expect.objectContaining({ revalidate: undefined }));
  });

  // ─── Config structure tests ─────────────────────────────────────────────

  test("config reflects nested object with fields", () => {
    const schema = v.object({
      user: v.object({ name: v.string(), age: v.number() }),
    });
    const { config } = useFormFields$(schema);
    expect(config.kind).toBe("object");
    if (config.kind !== "object") return;
    const userField = config.fields[0];
    expect(userField.kind).toBe("object");
    expect(userField.key).toBe("user");
    expect(userField.fields).toHaveLength(2);
  });

  test("config field paths are correct", () => {
    const schema = v.object({
      address: v.object({ street: v.string(), city: v.string() }),
    });
    const { config } = useFormFields$(schema);
    if (config.kind !== "object") return;
    const address = config.fields[0];
    expect(address.path).toEqual(["address"]);
    expect(address.fields[0]!.path).toEqual(["address", "street"]);
  });

  test("config handles array of objects", () => {
    const schema = v.object({
      items: v.array(v.object({ label: v.string(), done: v.boolean() })),
    });
    const { config } = useFormFields$(schema);
    if (config.kind !== "object") return;
    const items = config.fields[0];
    expect(items.kind).toBe("array");
    expect(items.item.kind).toBe("object");
  });

  test("config handles variant schema", () => {
    const schema = v.variant("type", [
      v.object({ type: v.literal("a"), name: v.string() }),
      v.object({ type: v.literal("b"), value: v.number() }),
    ]);
    const { config } = useFormFields$(schema);
    expect(config.kind).toBe("variant");
    if (config.kind !== "variant") return;
    expect(config.branches).toHaveLength(2);
  });

  test("config handles optional and nullable wrappers", () => {
    const schema = v.object({
      required: v.string(),
      optional: v.optional(v.string()),
      nullable: v.nullable(v.number()),
    });
    const { config } = useFormFields$(schema);
    if (config.kind !== "object") return;
    expect(config.fields[0]!.required).toBe(true);
    expect(config.fields[1]!.required).toBe(false);
    expect(config.fields[2]!.nullable).toBe(true);
  });

  test("config type narrows to ObjectFormFieldConfig<LeafFormFieldConfig>", () => {
    const schema = v.object({ name: v.string() });
    const { config } = useFormFields$(schema);
    expectTypeOf(config).toEqualTypeOf<
      ObjectFormFieldConfig<LeafFormFieldConfig<readonly ["name"]>, readonly []>
    >();
  });

  test("config type narrows to LeafFormFieldConfig for string", () => {
    const schema = v.string();
    const { config } = useFormFields$(schema);
    expectTypeOf(config).toEqualTypeOf<LeafFormFieldConfig<readonly []>>();
  });
});
