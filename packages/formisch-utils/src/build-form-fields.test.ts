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
  RecordFormFieldConfig,
  UnsupportedFormFieldConfig,
} from "./types.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function leaf(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return buildFormFields(schema) as LeafFormFieldConfig;
}

function obj(schema: v.GenericSchema | v.GenericSchemaAsync) {
  return buildFormFields(schema) as ObjectFormFieldConfig;
}

// ─── buildFormFields ──────────────────────────────────────────────────────────

describe("buildFormFields", () => {
  // ─── Leaf fields ────────────────────────────────────────────────────────────

  describe("leaf: string variants", () => {
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

  describe("leaf: numeric and boolean", () => {
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

  describe("wrapper handling", () => {
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

  describe("leaf metadata", () => {
    test("title → label", () => {
      const config = leaf(v.pipe(v.string(), v.title("Email Address")));
      expect(config.label).toBe("Email Address");
    });

    test("description → description", () => {
      const config = leaf(v.pipe(v.string(), v.description("Enter your email")));
      expect(config.description).toBe("Enter your email");
    });

    test("metadata({ placeholder }) → placeholder", () => {
      const config = leaf(v.pipe(v.string(), v.metadata({ placeholder: "user@example.com" })));
      expect(config.placeholder).toBe("user@example.com");
    });
  });

  // ─── Constraints on leaves ────────────────────────────────────────────────────

  describe("leaf constraints", () => {
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

    test("optional field constraints omit required (not set)", () => {
      const config = leaf(v.optional(v.pipe(v.string(), v.maxLength(20))));
      expect("required" in (config.constraints ?? {})).toBe(false);
      expect(config.constraints?.maxLength).toBe(20);
    });

    test("required field constraints include required:true", () => {
      const config = leaf(v.pipe(v.string(), v.maxLength(20)));
      expect(config.constraints?.required).toBe(true);
      expect(config.constraints?.maxLength).toBe(20);
    });
  });

  // ─── Path propagation ─────────────────────────────────────────────────────────

  describe("path propagation", () => {
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
        })
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

  describe("label fallback from key", () => {
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
        })
      );
      expect(config.fields[0]!.label).toBe("Email Address");
    });
  });

  // ─── Object ───────────────────────────────────────────────────────────────────

  describe("object", () => {
    test("simple object → kind:'object', fields array", () => {
      const config = obj(v.object({ name: v.string(), age: v.number() }));
      expect(config.kind).toBe("object");
      expect(config.fields).toHaveLength(2);
    });

    test("fields are ordered (insertion order preserved)", () => {
      const config = obj(v.object({ z: v.string(), a: v.string(), m: v.string() }));
      expect(config.fields.map((f) => f.key)).toEqual(["z", "a", "m"]);
    });

    test("nested object → ObjectFormFieldConfig inside fields", () => {
      const config = obj(
        v.object({
          address: v.object({ street: v.string(), city: v.string() }),
        })
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
        })
      );
      expect(config.fields[0]!.required).toBe(true);
      expect(config.fields[1]!.required).toBe(false);
    });

    test("object metadata → label and description on object config", () => {
      const config = buildFormFields(
        v.pipe(
          v.object({ name: v.string() }),
          v.title("User Form"),
          v.description("Fill in your details")
        )
      );
      expect(config.label).toBe("User Form");
      expect(config.description).toBe("Fill in your details");
    });
  });

  // ─── Array ────────────────────────────────────────────────────────────────────

  describe("array", () => {
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
        v.array(v.object({ label: v.string(), done: v.boolean() }))
      ) as ArrayFormFieldConfig;
      const item = config.item as ObjectFormFieldConfig;
      expect(item.kind).toBe("object");
      expect(item.fields).toHaveLength(2);
    });

    test("optional array → required:false", () => {
      const config = buildFormFields(v.optional(v.array(v.string()))) as ArrayFormFieldConfig;
      expect(config.kind).toBe("array");
      expect(config.required).toBe(false);
    });
  });

  // ─── Tuple / multi-step ───────────────────────────────────────────────────────

  describe("tuple (multi-step)", () => {
    test("tuple → kind:'tuple', items array", () => {
      const config = buildFormFields(v.tuple([v.string(), v.number()])) as TupleFormFieldConfig;
      expect(config.kind).toBe("tuple");
      expect(config.items).toHaveLength(2);
    });

    test("tuple of objects (wizard pattern)", () => {
      const config = buildFormFields(
        v.tuple([
          v.pipe(v.object({ firstName: v.string() }), v.title("Step 1")),
          v.pipe(v.object({ email: v.string() }), v.title("Step 2")),
        ])
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
      const config = buildFormFields(v.tuple([v.string(), v.number()])) as TupleFormFieldConfig;
      expect(config.items[0]!.key).toBe("0");
      expect(config.items[1]!.key).toBe("1");
    });
  });

  // ─── Enum ─────────────────────────────────────────────────────────────────────

  describe("enum", () => {
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

  describe("picklist", () => {
    test("picklist → kind:'leaf', inputType:'select', options", () => {
      const config = buildFormFields(v.picklist(["react", "vue", "solid"])) as LeafFormFieldConfig;
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("select");
      expect(config.nodeType).toBe("picklist");
      expect(config.options).toHaveLength(3);
      expect(config.options![0]).toEqual({ label: "react", value: "react" });
    });

    test("numeric picklist", () => {
      const config = buildFormFields(v.picklist([1, 2, 3])) as LeafFormFieldConfig;
      expect(config.options![0]).toEqual({ label: "1", value: 1 });
    });
  });

  // ─── Literal ──────────────────────────────────────────────────────────────────

  describe("literal", () => {
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

    test("literal SerializedBigInt → converted to native BigInt", () => {
      const literalNode = {
        kind: "schema" as const,
        type: "literal" as const,
        literal: { __type: "bigint" as const, value: "99" },
      };
      const config = buildFormFields(literalNode as any) as LeafFormFieldConfig;
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("hidden");
      expect(config.nodeType).toBe("literal");
      expect(config.options![0]).toEqual({ value: BigInt(99), label: "99" });
    });
  });

  // ─── Union ────────────────────────────────────────────────────────────────────

  describe("union of literals → leaf", () => {
    test("all-literal union → kind:'leaf', inputType:'select'", () => {
      const config = buildFormFields(
        v.union([v.literal("a"), v.literal("b"), v.literal("c")])
      ) as LeafFormFieldConfig;
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("select");
      expect(config.nodeType).toBe("union");
      expect(config.options).toHaveLength(3);
      expect(config.options![0]).toEqual({ label: "a", value: "a" });
    });

    test("mixed union (object + string) → kind:'union'", () => {
      const config = buildFormFields(
        v.union([v.object({ name: v.string() }), v.object({ title: v.string() })])
      ) as UnionFormFieldConfig;
      expect(config.kind).toBe("union");
      expect(config.options).toHaveLength(2);
      expect(config.options[0]).toHaveLength(1); // { name } → 1 field
      expect(config.options[1]).toHaveLength(1); // { title } → 1 field
    });
  });

  // ─── Variant ──────────────────────────────────────────────────────────────────

  describe("variant (discriminated union)", () => {
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
      const urlField = imageBranch.fields.find((f) => f.key === "url") as LeafFormFieldConfig;
      expect(urlField?.inputType).toBe("url");
      const altField = imageBranch.fields.find((f) => f.key === "alt")!;
      expect(altField.required).toBe(false);
    });
  });

  // ─── Intersect ────────────────────────────────────────────────────────────────

  describe("intersect", () => {
    test("intersect of objects → kind:'object' with merged fields", () => {
      const config = buildFormFields(
        v.intersect([v.object({ name: v.string() }), v.object({ age: v.number() })])
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
        ])
      ) as ObjectFormFieldConfig;
      const sharedField = config.fields.find((f) => f.key === "shared") as LeafFormFieldConfig;
      // First definition of 'shared' (string) wins
      expect(sharedField.nodeType).toBe("string");
      expect(config.fields).toHaveLength(3); // shared, unique1, unique2
    });
  });

  // ─── Unsupported ──────────────────────────────────────────────────────────────

  describe("unsupported types", () => {
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
});

// ─── buildObjectFields ───────────────────────────────────────────────────────

describe("buildObjectFields", () => {
  test("object schema → flat fields array", () => {
    const fields = buildObjectFields(v.object({ name: v.string(), age: v.number() }));
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

describe("buildFormFields", () => {
  describe("AST inputs", () => {
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
      const fromNode = buildFormFields(schemaToAST(schema).document.schema);
      expect(JSON.stringify(fromSchema)).toBe(JSON.stringify(fromNode));
    });
  });

  // ─── Coverage: mixed union with non-object option (line 250) ──────────────────

  describe("mixed union with non-object option", () => {
    test("union with object and string options → non-object option renders as single-element fieldset", () => {
      const config = buildFormFields(
        v.union([v.object({ name: v.string() }), v.string()])
      ) as UnionFormFieldConfig;
      expect(config.kind).toBe("union");
      expect(config.options).toHaveLength(2);
      // First option: object with 1 field
      expect(config.options[0]).toHaveLength(1);
      // Second option: non-object (string) → single-element fieldset
      expect(config.options[1]).toHaveLength(1);
      expect((config.options[1]![0] as LeafFormFieldConfig).kind).toBe("leaf");
    });
  });

  // ─── Coverage: intersect with non-object schemas (line 292) ───────────────────

  describe("intersect with non-object schemas", () => {
    test("intersect of non-object schemas → kind:'unsupported'", () => {
      const config = buildFormFields(
        v.intersect([v.string(), v.number()])
      ) as UnsupportedFormFieldConfig;
      expect(config.kind).toBe("unsupported");
    });
  });

  // ─── Coverage: variant with non-object branch (line 193) ─────────────────────

  describe("variant with non-object branch", () => {
    test("variant whose option is not an object → branch fields is single-element array", () => {
      // Manually construct a variant AST node where the option is non-object
      const variantNode = {
        kind: "schema" as const,
        type: "variant" as const,
        key: "type",
        options: [{ kind: "schema" as const, type: "string" as const }],
      };
      const config = buildFormFields(variantNode as any) as VariantFormFieldConfig;
      expect(config.kind).toBe("variant");
      expect(config.branches).toHaveLength(1);
      // Non-object branch: fields is a single-item array containing a leaf config
      expect(config.branches[0]!.fields).toHaveLength(1);
      expect(config.branches[0]!.fields[0]!.kind).toBe("leaf");
    });
  });

  // ─── Coverage: variant branch with label (line 198) ──────────────────────────

  describe("variant branch with label", () => {
    test("variant branch with v.title() → branch has label", () => {
      const schema = v.variant("type", [
        v.pipe(v.object({ type: v.literal("a"), name: v.string() }), v.title("Option A")),
        v.object({ type: v.literal("b"), value: v.number() }),
      ]);
      const config = buildFormFields(schema) as VariantFormFieldConfig;
      expect(config.kind).toBe("variant");
      expect(config.branches[0]!.label).toBe("Option A");
      expect(config.branches[1]!.label).toBeUndefined();
    });
  });

  // ─── Coverage: union/intersect without options property (lines 213, 263) ──────

  describe("union/intersect missing options property", () => {
    test("union node without options → treated as empty all-literal union → leaf with no options", () => {
      const unionNode = { kind: "schema" as const, type: "union" as const };
      const config = buildFormFields(unionNode as any) as LeafFormFieldConfig;
      expect(config.kind).toBe("leaf");
      expect(config.options).toHaveLength(0);
    });

    test("intersect node without options → unsupported (empty merge)", () => {
      const intersectNode = { kind: "schema" as const, type: "intersect" as const };
      const config = buildFormFields(intersectNode as any) as UnsupportedFormFieldConfig;
      expect(config.kind).toBe("unsupported");
    });
  });

  // ─── Coverage: tuple without items property (line 150) ────────────────────────

  describe("tuple without items property", () => {
    test("tuple node without items → empty items array", () => {
      const tupleNode = { kind: "schema" as const, type: "tuple" as const };
      const config = buildFormFields(tupleNode as any) as TupleFormFieldConfig;
      expect(config.kind).toBe("tuple");
      expect(config.items).toHaveLength(0);
    });
  });

  // ─── Coverage: variant discriminator edge cases (lines 185, 187) ─────────────

  describe("variant discriminator edge cases", () => {
    test("variant branch without the discriminator key → discriminatorValue stays empty string", () => {
      // Object branch that doesn't contain the discriminator key "type"
      const variantNode = {
        kind: "schema" as const,
        type: "variant" as const,
        key: "type",
        options: [
          {
            kind: "schema" as const,
            type: "object" as const,
            entries: {
              name: { kind: "schema" as const, type: "string" as const },
              // "type" discriminator key intentionally omitted
            },
          },
        ],
      };
      const config = buildFormFields(variantNode as any) as VariantFormFieldConfig;
      expect(config.kind).toBe("variant");
      expect(config.branches[0]!.value).toBe(""); // stays default empty string
    });

    test("variant branch where discriminator entry is not a literal → discriminatorValue stays empty string", () => {
      // Discriminator entry exists but is a string schema, not a literal
      const variantNode = {
        kind: "schema" as const,
        type: "variant" as const,
        key: "type",
        options: [
          {
            kind: "schema" as const,
            type: "object" as const,
            entries: {
              type: { kind: "schema" as const, type: "string" as const }, // not a literal
              name: { kind: "schema" as const, type: "string" as const },
            },
          },
        ],
      };
      const config = buildFormFields(variantNode as any) as VariantFormFieldConfig;
      expect(config.kind).toBe("variant");
      expect(config.branches[0]!.value).toBe(""); // stays default empty string
    });
  });

  // ─── Coverage: picklist with SerializedBigInt option ───────────────────────────

  describe("picklist with SerializedBigInt option", () => {
    test("picklist node with a SerializedBigInt option → converted to native BigInt", () => {
      const picklistNode = {
        kind: "schema" as const,
        type: "picklist" as const,
        options: [{ __type: "bigint" as const, value: "42" }, "hello"],
      };
      const config = buildFormFields(picklistNode as any) as LeafFormFieldConfig;
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("select");
      expect(config.nodeType).toBe("picklist");
      expect(config.options).toHaveLength(2);
      expect(config.options![0]).toEqual({ value: BigInt(42), label: "42" });
      expect(config.options![1]).toEqual({ value: "hello", label: "hello" });
    });
  });

  // ─── Coverage: array without item property (line 132) ────────────────────────

  describe("array without item property", () => {
    test("array node without item → kind:'array', item is unsupported", () => {
      const arrayNode = { kind: "schema" as const, type: "array" as const };
      const config = buildFormFields(arrayNode as any) as ArrayFormFieldConfig;
      expect(config.kind).toBe("array");
      expect((config.item as UnsupportedFormFieldConfig).kind).toBe("unsupported");
    });
  });

  // ─── Record ──────────────────────────────────────────────────────────────────

  describe("record", () => {
    test("record(string, string) → kind:'record' with keyField and valueField", () => {
      const config = buildFormFields(v.record(v.string(), v.string())) as RecordFormFieldConfig;
      expect(config.kind).toBe("record");
      expect((config.keyField as LeafFormFieldConfig).kind).toBe("leaf");
      expect((config.keyField as LeafFormFieldConfig).inputType).toBe("text");
      expect((config.valueField as LeafFormFieldConfig).kind).toBe("leaf");
      expect((config.valueField as LeafFormFieldConfig).inputType).toBe("text");
    });

    test("record(string, number) → valueField has inputType:'number'", () => {
      const config = buildFormFields(v.record(v.string(), v.number())) as RecordFormFieldConfig;
      expect(config.kind).toBe("record");
      expect((config.valueField as LeafFormFieldConfig).inputType).toBe("number");
    });

    test("record(picklist, object) → keyField is select, valueField is object", () => {
      const config = buildFormFields(
        v.record(v.picklist(["a", "b"]), v.object({ x: v.string() }))
      ) as RecordFormFieldConfig;
      expect(config.kind).toBe("record");
      expect((config.keyField as LeafFormFieldConfig).inputType).toBe("select");
      expect((config.valueField as ObjectFormFieldConfig).kind).toBe("object");
    });

    test("record keyField path and valueField path", () => {
      const config = buildFormFields(v.record(v.string(), v.string())) as RecordFormFieldConfig;
      expect(config.keyField.path).toEqual(["key"]);
      expect(config.valueField.path).toEqual(["value"]);
    });

    test("optional record → required:false", () => {
      const config = buildFormFields(v.optional(v.record(v.string(), v.string()))) as RecordFormFieldConfig;
      expect(config.kind).toBe("record");
      expect(config.required).toBe(false);
    });
  });
});
