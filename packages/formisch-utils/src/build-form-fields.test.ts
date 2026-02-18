import { describe, test, expect } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import { buildFormFields, buildObjectFields } from "./build-form-fields.ts";
import type {
  LeafFormFieldConfig,
  ObjectFormFieldConfig,
  ArrayFormFieldConfig,
  TupleFormFieldConfig,
  UnionFormFieldConfig,
  VariantFormFieldConfig,
  UnsupportedFormFieldConfig,
} from "./types.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function leaf(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return buildFormFields(schema) as LeafFormFieldConfig;
}

function obj(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return buildFormFields(schema) as ObjectFormFieldConfig;
}

// ─── Leaf fields ──────────────────────────────────────────────────────────────

describe("buildFormFields — leaf: string variants", () => {
  test("plain string → kind:leaf, inputType:'text', nodeType:'string'", () => {
    const config = leaf(v.string());
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("text");
    expect(config.nodeType).toBe("string");
  });

  test("string + email → inputType:'email'", () => {
    const config = leaf(v.pipe(v.string(), v.email()));
    expect(config.inputType).toBe("email");
  });

  test("string + url → inputType:'url'", () => {
    const config = leaf(v.pipe(v.string(), v.url()));
    expect(config.inputType).toBe("url");
  });

  test("string + isoDate → inputType:'date'", () => {
    const config = leaf(v.pipe(v.string(), v.isoDate()));
    expect(config.inputType).toBe("date");
  });

  test("string + isoDateTime → inputType:'datetime-local'", () => {
    const config = leaf(v.pipe(v.string(), v.isoDateTime()));
    expect(config.inputType).toBe("datetime-local");
  });

  test("string + isoTime → inputType:'time'", () => {
    const config = leaf(v.pipe(v.string(), v.isoTime()));
    expect(config.inputType).toBe("time");
  });

  test("string + isoWeek → inputType:'week'", () => {
    const config = leaf(v.pipe(v.string(), v.isoWeek()));
    expect(config.inputType).toBe("week");
  });

  test("string + hexColor → inputType:'color'", () => {
    const config = leaf(v.pipe(v.string(), v.hexColor()));
    expect(config.inputType).toBe("color");
  });
});

describe("buildFormFields — leaf: numeric and boolean", () => {
  test("number → kind:leaf, inputType:'number'", () => {
    const config = leaf(v.number());
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("number");
    expect(config.nodeType).toBe("number");
  });

  test("bigint → kind:leaf, inputType:'number'", () => {
    const config = leaf(v.bigint());
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("number");
    expect(config.nodeType).toBe("bigint");
  });

  test("boolean → kind:leaf, inputType:'checkbox'", () => {
    const config = leaf(v.boolean());
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("checkbox");
    expect(config.nodeType).toBe("boolean");
  });

  test("date schema → kind:leaf, inputType:'date'", () => {
    const config = leaf(v.date());
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("date");
    expect(config.nodeType).toBe("date");
  });

  test("file → kind:leaf, inputType:'file'", () => {
    const config = leaf(v.file());
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("file");
  });

  test("blob → kind:leaf, inputType:'file'", () => {
    const config = leaf(v.blob());
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("file");
  });
});

// ─── Wrapper handling ─────────────────────────────────────────────────────────

describe("buildFormFields — wrapper handling", () => {
  test("optional(string) → required:false, kind:leaf", () => {
    const config = leaf(v.optional(v.string()));
    expect(config.kind).toBe("leaf");
    expect(config.required).toBe(false);
    expect(config.nullable).toBe(false);
  });

  test("nullable(string) → nullable:true, required:true", () => {
    const config = leaf(v.nullable(v.string()));
    expect(config.kind).toBe("leaf");
    expect(config.required).toBe(true);
    expect(config.nullable).toBe(true);
  });

  test("nullish(string) → required:false, nullable:true", () => {
    const config = leaf(v.nullish(v.string()));
    expect(config.kind).toBe("leaf");
    expect(config.required).toBe(false);
    expect(config.nullable).toBe(true);
  });

  test("optional(string, 'default') → default is captured", () => {
    const config = leaf(v.optional(v.string(), "hello"));
    expect(config.default).toBe("hello");
  });

  test("required string → required:true", () => {
    const config = leaf(v.string());
    expect(config.required).toBe(true);
  });
});

// ─── Metadata on leaves ───────────────────────────────────────────────────────

describe("buildFormFields — leaf metadata", () => {
  test("title → label", () => {
    const config = leaf(v.pipe(v.string(), v.title("Email Address")));
    expect(config.label).toBe("Email Address");
  });

  test("description → description", () => {
    const config = leaf(v.pipe(v.string(), v.description("Enter your email")));
    expect(config.description).toBe("Enter your email");
  });

  test("metadata({ placeholder }) → placeholder", () => {
    const config = leaf(
      v.pipe(v.string(), v.metadata({ placeholder: "user@example.com" })),
    );
    expect(config.placeholder).toBe("user@example.com");
  });
});

// ─── Constraints on leaves ────────────────────────────────────────────────────

describe("buildFormFields — leaf constraints", () => {
  test("minLength and maxLength constraints", () => {
    const config = leaf(v.pipe(v.string(), v.minLength(3), v.maxLength(50)));
    expect(config.constraints?.minLength).toBe(3);
    expect(config.constraints?.maxLength).toBe(50);
  });

  test("number min/max constraints", () => {
    const config = leaf(v.pipe(v.number(), v.minValue(0), v.maxValue(100)));
    expect(config.constraints?.min).toBe(0);
    expect(config.constraints?.max).toBe(100);
  });

  test("optional field constraints include required:false", () => {
    const config = leaf(v.optional(v.pipe(v.string(), v.maxLength(20))));
    expect(config.constraints?.required).toBe(false);
    expect(config.constraints?.maxLength).toBe(20);
  });
});

// ─── Path propagation ─────────────────────────────────────────────────────────

describe("buildFormFields — path propagation", () => {
  test("root field has empty path and key", () => {
    const config = buildFormFields(v.string());
    expect(config.path).toEqual([]);
    expect(config.key).toBe("");
  });

  test("object fields have correct paths", () => {
    const config = obj(v.object({ name: v.string(), email: v.string() }));
    const nameField = config.fields[0]!;
    const emailField = config.fields[1]!;
    expect(nameField.path).toEqual(["name"]);
    expect(nameField.key).toBe("name");
    expect(emailField.path).toEqual(["email"]);
    expect(emailField.key).toBe("email");
  });

  test("nested object paths are cumulative", () => {
    const config = obj(
      v.object({
        user: v.object({ name: v.string() }),
      }),
    );
    const userField = config.fields[0] as ObjectFormFieldConfig;
    expect(userField.path).toEqual(["user"]);
    const nameField = userField.fields[0]!;
    expect(nameField.path).toEqual(["user", "name"]);
    expect(nameField.key).toBe("name");
  });

  test("array item path contains index placeholder", () => {
    const config = buildFormFields(v.array(v.string())) as ArrayFormFieldConfig;
    expect(config.item.path).toEqual(["0"]);
  });
});

// ─── Key-to-label fallback ────────────────────────────────────────────────────

describe("buildFormFields — label fallback from key", () => {
  test("field with no title gets titleCase(key) as label", () => {
    const config = obj(v.object({ firstName: v.string() }));
    const field = config.fields[0]!;
    expect(field.label).toBe("First Name");
  });

  test("root field with no title and no key has no label", () => {
    const config = buildFormFields(v.string());
    expect(config.label).toBeUndefined();
  });

  test("title overrides key fallback", () => {
    const config = obj(
      v.object({
        email: v.pipe(v.string(), v.title("Email Address")),
      }),
    );
    expect(config.fields[0]!.label).toBe("Email Address");
  });
});

// ─── Object ───────────────────────────────────────────────────────────────────

describe("buildFormFields — object", () => {
  test("simple object → kind:'object', fields array", () => {
    const config = obj(v.object({ name: v.string(), age: v.number() }));
    expect(config.kind).toBe("object");
    expect(config.fields).toHaveLength(2);
  });

  test("fields are ordered (insertion order preserved)", () => {
    const config = obj(
      v.object({ z: v.string(), a: v.string(), m: v.string() }),
    );
    expect(config.fields.map((f) => f.key)).toEqual(["z", "a", "m"]);
  });

  test("nested object → ObjectFormFieldConfig inside fields", () => {
    const config = obj(
      v.object({
        address: v.object({ street: v.string(), city: v.string() }),
      }),
    );
    const addressField = config.fields[0] as ObjectFormFieldConfig;
    expect(addressField.kind).toBe("object");
    expect(addressField.fields).toHaveLength(2);
    expect(addressField.fields[0]!.key).toBe("street");
  });

  test("object with optional fields", () => {
    const config = obj(
      v.object({
        required: v.string(),
        optional: v.optional(v.string()),
      }),
    );
    expect(config.fields[0]!.required).toBe(true);
    expect(config.fields[1]!.required).toBe(false);
  });

  test("object metadata → label and description on object config", () => {
    const config = buildFormFields(
      v.pipe(
        v.object({ name: v.string() }),
        v.title("User Form"),
        v.description("Fill in your details"),
      ),
    );
    expect(config.label).toBe("User Form");
    expect(config.description).toBe("Fill in your details");
  });
});

// ─── Array ────────────────────────────────────────────────────────────────────

describe("buildFormFields — array", () => {
  test("array → kind:'array', item config", () => {
    const config = buildFormFields(v.array(v.string())) as ArrayFormFieldConfig;
    expect(config.kind).toBe("array");
    expect(config.item).toBeDefined();
  });

  test("array of strings → item is leaf with inputType:'text'", () => {
    const config = buildFormFields(v.array(v.string())) as ArrayFormFieldConfig;
    const item = config.item as LeafFormFieldConfig;
    expect(item.kind).toBe("leaf");
    expect(item.inputType).toBe("text");
  });

  test("array of objects → item is ObjectFormFieldConfig", () => {
    const config = buildFormFields(
      v.array(v.object({ label: v.string(), done: v.boolean() })),
    ) as ArrayFormFieldConfig;
    const item = config.item as ObjectFormFieldConfig;
    expect(item.kind).toBe("object");
    expect(item.fields).toHaveLength(2);
  });

  test("optional array → required:false", () => {
    const config = buildFormFields(
      v.optional(v.array(v.string())),
    ) as ArrayFormFieldConfig;
    expect(config.kind).toBe("array");
    expect(config.required).toBe(false);
  });
});

// ─── Tuple / multi-step ───────────────────────────────────────────────────────

describe("buildFormFields — tuple (multi-step)", () => {
  test("tuple → kind:'tuple', items array", () => {
    const config = buildFormFields(
      v.tuple([v.string(), v.number()]),
    ) as TupleFormFieldConfig;
    expect(config.kind).toBe("tuple");
    expect(config.items).toHaveLength(2);
  });

  test("tuple of objects (wizard pattern)", () => {
    const config = buildFormFields(
      v.tuple([
        v.pipe(v.object({ firstName: v.string() }), v.title("Step 1")),
        v.pipe(v.object({ email: v.string() }), v.title("Step 2")),
      ]),
    ) as TupleFormFieldConfig;

    expect(config.kind).toBe("tuple");
    expect(config.items).toHaveLength(2);

    const step1 = config.items[0] as ObjectFormFieldConfig;
    expect(step1.kind).toBe("object");
    expect(step1.label).toBe("Step 1");
    expect(step1.fields[0]!.key).toBe("firstName");

    const step2 = config.items[1] as ObjectFormFieldConfig;
    expect(step2.kind).toBe("object");
    expect(step2.label).toBe("Step 2");
    expect(step2.fields[0]!.key).toBe("email");
  });

  test("tuple items have index as key", () => {
    const config = buildFormFields(
      v.tuple([v.string(), v.number()]),
    ) as TupleFormFieldConfig;
    expect(config.items[0]!.key).toBe("0");
    expect(config.items[1]!.key).toBe("1");
  });
});

// ─── Enum ─────────────────────────────────────────────────────────────────────

describe("buildFormFields — enum", () => {
  enum Status {
    Active = "active",
    Inactive = "inactive",
    Pending = "pending",
  }

  test("enum → kind:'leaf', inputType:'select'", () => {
    const config = buildFormFields(v.enum(Status)) as LeafFormFieldConfig;
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("select");
    expect(config.nodeType).toBe("enum");
  });

  test("enum options have label (key) and value", () => {
    const config = buildFormFields(v.enum(Status)) as LeafFormFieldConfig;
    expect(config.options).toHaveLength(3);
    expect(config.options![0]).toEqual({ label: "Active", value: "active" });
    expect(config.options![1]).toEqual({
      label: "Inactive",
      value: "inactive",
    });
  });
});

// ─── Picklist ─────────────────────────────────────────────────────────────────

describe("buildFormFields — picklist", () => {
  test("picklist → kind:'leaf', inputType:'select', options", () => {
    const config = buildFormFields(
      v.picklist(["react", "vue", "solid"]),
    ) as LeafFormFieldConfig;
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("select");
    expect(config.nodeType).toBe("picklist");
    expect(config.options).toHaveLength(3);
    expect(config.options![0]).toEqual({ label: "react", value: "react" });
  });

  test("numeric picklist", () => {
    const config = buildFormFields(
      v.picklist([1, 2, 3]),
    ) as LeafFormFieldConfig;
    expect(config.options![0]).toEqual({ label: "1", value: 1 });
  });
});

// ─── Literal ──────────────────────────────────────────────────────────────────

describe("buildFormFields — literal", () => {
  test("literal string → kind:'leaf', inputType:'hidden'", () => {
    const config = buildFormFields(v.literal("fixed")) as LeafFormFieldConfig;
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("hidden");
    expect(config.nodeType).toBe("literal");
    expect(config.options![0]).toEqual({ label: "fixed", value: "fixed" });
  });

  test("literal number", () => {
    const config = buildFormFields(v.literal(42)) as LeafFormFieldConfig;
    expect(config.options![0]).toEqual({ label: "42", value: 42 });
  });
});

// ─── Union ────────────────────────────────────────────────────────────────────

describe("buildFormFields — union of literals → leaf", () => {
  test("all-literal union → kind:'leaf', inputType:'select'", () => {
    const config = buildFormFields(
      v.union([v.literal("a"), v.literal("b"), v.literal("c")]),
    ) as LeafFormFieldConfig;
    expect(config.kind).toBe("leaf");
    expect(config.inputType).toBe("select");
    expect(config.nodeType).toBe("union");
    expect(config.options).toHaveLength(3);
    expect(config.options![0]).toEqual({ label: "a", value: "a" });
  });

  test("mixed union (object + string) → kind:'union'", () => {
    const config = buildFormFields(
      v.union([
        v.object({ name: v.string() }),
        v.object({ title: v.string() }),
      ]),
    ) as UnionFormFieldConfig;
    expect(config.kind).toBe("union");
    expect(config.options).toHaveLength(2);
    expect(config.options[0]).toHaveLength(1); // { name } → 1 field
    expect(config.options[1]).toHaveLength(1); // { title } → 1 field
  });
});

// ─── Variant ──────────────────────────────────────────────────────────────────

describe("buildFormFields — variant (discriminated union)", () => {
  const schema = v.variant("type", [
    v.object({
      type: v.literal("text"),
      content: v.string(),
    }),
    v.object({
      type: v.literal("image"),
      url: v.pipe(v.string(), v.url()),
      alt: v.optional(v.string()),
    }),
  ]);

  test("variant → kind:'variant', discriminatorKey", () => {
    const config = buildFormFields(schema) as VariantFormFieldConfig;
    expect(config.kind).toBe("variant");
    expect(config.discriminatorKey).toBe("type");
  });

  test("variant has correct branch count", () => {
    const config = buildFormFields(schema) as VariantFormFieldConfig;
    expect(config.branches).toHaveLength(2);
  });

  test("branches have correct discriminator values", () => {
    const config = buildFormFields(schema) as VariantFormFieldConfig;
    expect(config.branches[0]!.value).toBe("text");
    expect(config.branches[1]!.value).toBe("image");
  });

  test("branch fields include the discriminator field", () => {
    const config = buildFormFields(schema) as VariantFormFieldConfig;
    const textBranch = config.branches[0]!;
    const fieldKeys = textBranch.fields.map((f) => f.key);
    expect(fieldKeys).toContain("type");
    expect(fieldKeys).toContain("content");
  });

  test("branch fields are correctly typed", () => {
    const config = buildFormFields(schema) as VariantFormFieldConfig;
    const imageBranch = config.branches[1]!;
    const urlField = imageBranch.fields.find(
      (f) => f.key === "url",
    ) as LeafFormFieldConfig;
    expect(urlField?.inputType).toBe("url");
    const altField = imageBranch.fields.find((f) => f.key === "alt")!;
    expect(altField.required).toBe(false);
  });
});

// ─── Intersect ────────────────────────────────────────────────────────────────

describe("buildFormFields — intersect", () => {
  test("intersect of objects → kind:'object' with merged fields", () => {
    const config = buildFormFields(
      v.intersect([
        v.object({ name: v.string() }),
        v.object({ age: v.number() }),
      ]),
    ) as ObjectFormFieldConfig;
    expect(config.kind).toBe("object");
    expect(config.fields).toHaveLength(2);
    const keys = config.fields.map((f) => f.key);
    expect(keys).toContain("name");
    expect(keys).toContain("age");
  });

  test("intersect deduplicates overlapping keys (first wins)", () => {
    const config = buildFormFields(
      v.intersect([
        v.object({ shared: v.string(), unique1: v.string() }),
        v.object({ shared: v.number(), unique2: v.number() }),
      ]),
    ) as ObjectFormFieldConfig;
    const sharedField = config.fields.find(
      (f) => f.key === "shared",
    ) as LeafFormFieldConfig;
    // First definition of 'shared' (string) wins
    expect(sharedField.nodeType).toBe("string");
    expect(config.fields).toHaveLength(3); // shared, unique1, unique2
  });
});

// ─── Unsupported ──────────────────────────────────────────────────────────────

describe("buildFormFields — unsupported types", () => {
  test("lazy schema → kind:'unsupported'", () => {
    const schema = v.lazy(() => v.string());
    const config = buildFormFields(schema) as UnsupportedFormFieldConfig;
    expect(config.kind).toBe("unsupported");
  });

  test("function schema → kind:'unsupported'", () => {
    const config = buildFormFields(v.function()) as UnsupportedFormFieldConfig;
    expect(config.kind).toBe("unsupported");
    expect(config.nodeType).toBe("function");
  });
});

// ─── buildObjectFields convenience ───────────────────────────────────────────

describe("buildObjectFields", () => {
  test("object schema → flat fields array", () => {
    const fields = buildObjectFields(
      v.object({ name: v.string(), age: v.number() }),
    );
    expect(Array.isArray(fields)).toBe(true);
    expect(fields).toHaveLength(2);
    expect(fields[0]!.key).toBe("name");
    expect(fields[1]!.key).toBe("age");
  });

  test("ASTDocument input → flat fields array", () => {
    const doc = schemaToAST(v.object({ x: v.string() }));
    const fields = buildObjectFields(doc);
    expect(fields).toHaveLength(1);
    expect(fields[0]!.key).toBe("x");
  });

  test("non-object root → single-element array wrapping the root config", () => {
    const fields = buildObjectFields(v.string());
    expect(fields).toHaveLength(1);
    expect(fields[0]!.kind).toBe("leaf");
  });
});

// ─── AST input ────────────────────────────────────────────────────────────────

describe("buildFormFields — AST inputs", () => {
  test("ASTDocument input produces same result as schema", () => {
    const schema = v.object({ name: v.string() });
    const fromSchema = buildFormFields(schema);
    const fromDoc = buildFormFields(schemaToAST(schema));
    // Deep structural equality (Date objects aside)
    expect(JSON.stringify(fromSchema)).toBe(JSON.stringify(fromDoc));
  });

  test("ASTNode input produces same result as schema", () => {
    const schema = v.string();
    const fromSchema = buildFormFields(schema);
    const fromNode = buildFormFields(schemaToAST(schema).schema);
    expect(JSON.stringify(fromSchema)).toBe(JSON.stringify(fromNode));
  });
});
