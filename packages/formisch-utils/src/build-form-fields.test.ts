import { describe, test, expect, expectTypeOf } from "vitest";
import * as v from "valibot";
import { schemaToAST } from "valibot-ast";
import type { ASTNode, InferASTNode } from "valibot-ast";
import { buildFormFields, buildObjectFields } from "./build-form-fields.ts";
import type {
  FormFieldConfig,
  InferFormFieldConfig,
  LeafFormFieldConfig,
  ObjectFormFieldConfig,
  ArrayFormFieldConfig,
  TupleFormFieldConfig,
  UnionFormFieldConfig,
  VariantFormFieldConfig,
  RecordFormFieldConfig,
  UnsupportedFormFieldConfig,
} from "./types.ts";

// ─── buildFormFields ──────────────────────────────────────────────────────────

describe("buildFormFields", () => {
  // ─── Leaf fields ────────────────────────────────────────────────────────────

  describe("leaf: string variants", () => {
    test("plain string → kind:leaf, inputType:'text', nodeType:'string'", () => {
      const config = buildFormFields(v.string());
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("text");
      expect(config.nodeType).toBe("string");
    });

    test("string + email → inputType:'email'", () => {
      const config = buildFormFields(v.pipe(v.string(), v.email()));
      expect(config.inputType).toBe("email");
    });

    test("string + url → inputType:'url'", () => {
      const config = buildFormFields(v.pipe(v.string(), v.url()));
      expect(config.inputType).toBe("url");
    });

    test("string + isoDate → inputType:'date'", () => {
      const config = buildFormFields(v.pipe(v.string(), v.isoDate()));
      expect(config.inputType).toBe("date");
    });

    test("string + isoDateTime → inputType:'datetime-local'", () => {
      const config = buildFormFields(v.pipe(v.string(), v.isoDateTime()));
      expect(config.inputType).toBe("datetime-local");
    });

    test("string + isoTime → inputType:'time'", () => {
      const config = buildFormFields(v.pipe(v.string(), v.isoTime()));
      expect(config.inputType).toBe("time");
    });

    test("string + isoWeek → inputType:'week'", () => {
      const config = buildFormFields(v.pipe(v.string(), v.isoWeek()));
      expect(config.inputType).toBe("week");
    });

    test("string + hexColor → inputType:'color'", () => {
      const config = buildFormFields(v.pipe(v.string(), v.hexColor()));
      expect(config.inputType).toBe("color");
    });
  });

  describe("leaf: numeric and boolean", () => {
    test("number → kind:leaf, inputType:'number'", () => {
      const config = buildFormFields(v.number());
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("number");
      expect(config.nodeType).toBe("number");
    });

    test("bigint → kind:leaf, inputType:'number'", () => {
      const config = buildFormFields(v.bigint());
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("number");
      expect(config.nodeType).toBe("bigint");
    });

    test("boolean → kind:leaf, inputType:'checkbox'", () => {
      const config = buildFormFields(v.boolean());
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("checkbox");
      expect(config.nodeType).toBe("boolean");
    });

    test("date schema → kind:leaf, inputType:'date'", () => {
      const config = buildFormFields(v.date());
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("date");
      expect(config.nodeType).toBe("date");
    });

    test("file → kind:leaf, inputType:'file'", () => {
      const config = buildFormFields(v.file());
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("file");
    });

    test("blob → kind:leaf, inputType:'file'", () => {
      const config = buildFormFields(v.blob());
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("file");
    });
  });

  // ─── Wrapper handling ─────────────────────────────────────────────────────────

  describe("wrapper handling", () => {
    test("optional(string) → required:false, kind:leaf", () => {
      const config = buildFormFields(v.optional(v.string()));
      expect(config.kind).toBe("leaf");
      expect(config.required).toBe(false);
      expect(config.nullable).toBe(false);
    });

    test("nullable(string) → nullable:true, required:true", () => {
      const config = buildFormFields(v.nullable(v.string()));
      expect(config.kind).toBe("leaf");
      expect(config.required).toBe(true);
      expect(config.nullable).toBe(true);
    });

    test("nullish(string) → required:false, nullable:true", () => {
      const config = buildFormFields(v.nullish(v.string()));
      expect(config.kind).toBe("leaf");
      expect(config.required).toBe(false);
      expect(config.nullable).toBe(true);
    });

    test("optional(string, 'default') → default is captured", () => {
      const config = buildFormFields(v.optional(v.string(), "hello"));
      expect(config.default).toBe("hello");
    });

    test("required string → required:true", () => {
      const config = buildFormFields(v.string());
      expect(config.required).toBe(true);
    });
  });

  // ─── Metadata on leaves ───────────────────────────────────────────────────────

  describe("leaf metadata", () => {
    test("title → label", () => {
      const config = buildFormFields(v.pipe(v.string(), v.title("Email Address")));
      expect(config.label).toBe("Email Address");
    });

    test("description → description", () => {
      const config = buildFormFields(v.pipe(v.string(), v.description("Enter your email")));
      expect(config.description).toBe("Enter your email");
    });

    test("metadata({ placeholder }) → placeholder", () => {
      const config = buildFormFields(
        v.pipe(v.string(), v.metadata({ placeholder: "user@example.com" }))
      );
      expect(config.placeholder).toBe("user@example.com");
    });
  });

  // ─── Constraints on leaves ────────────────────────────────────────────────────

  describe("leaf constraints", () => {
    test("minLength and maxLength constraints", () => {
      const config = buildFormFields(v.pipe(v.string(), v.minLength(3), v.maxLength(50)));
      expect(config.constraints?.minLength).toBe(3);
      expect(config.constraints?.maxLength).toBe(50);
    });

    test("number min/max constraints", () => {
      const config = buildFormFields(v.pipe(v.number(), v.minValue(0), v.maxValue(100)));
      expect(config.constraints?.min).toBe(0);
      expect(config.constraints?.max).toBe(100);
    });

    test("optional field constraints omit required (not set)", () => {
      const config = buildFormFields(v.optional(v.pipe(v.string(), v.maxLength(20))));
      expect("required" in (config.constraints ?? {})).toBe(false);
      expect(config.constraints?.maxLength).toBe(20);
    });

    test("required field constraints include required:true", () => {
      const config = buildFormFields(v.pipe(v.string(), v.maxLength(20)));
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
      const config = buildFormFields(v.object({ name: v.string(), email: v.string() }));
      const nameField = config.fields[0]!;
      const emailField = config.fields[1]!;
      expect(nameField.path).toEqual(["name"]);
      expect(nameField.key).toBe("name");
      expect(emailField.path).toEqual(["email"]);
      expect(emailField.key).toBe("email");
    });

    test("nested object paths are cumulative", () => {
      const config = buildFormFields(
        v.object({
          user: v.object({ name: v.string() }),
        })
      );
      const userField = config.fields[0];
      expect(userField.path).toEqual(["user"]);
      const nameField = userField.fields[0]!;
      expect(nameField.path).toEqual(["user", "name"]);
      expect(nameField.key).toBe("name");
    });

    test("array item path contains index placeholder", () => {
      const config = buildFormFields(v.array(v.string()));
      expect(config.item.path).toEqual(["0"]);
    });
  });

  // ─── Key-to-label fallback ────────────────────────────────────────────────────

  describe("label fallback from key", () => {
    test("field with no title gets titleCase(key) as label", () => {
      const config = buildFormFields(v.object({ firstName: v.string() }));
      const field = config.fields[0]!;
      expect(field.label).toBe("First Name");
    });

    test("root field with no title and no key has no label", () => {
      const config = buildFormFields(v.string());
      expect(config.label).toBeUndefined();
    });

    test("title overrides key fallback", () => {
      const config = buildFormFields(
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
      const config = buildFormFields(v.object({ name: v.string(), age: v.number() }));
      expect(config.kind).toBe("object");
      expect(config.fields).toHaveLength(2);
    });

    test("fields are ordered (insertion order preserved)", () => {
      const config = buildFormFields(v.object({ z: v.string(), a: v.string(), m: v.string() }));
      expect(config.fields.map((f) => f.key)).toEqual(["z", "a", "m"]);
    });

    test("nested object → ObjectFormFieldConfig inside fields", () => {
      const config = buildFormFields(
        v.object({
          address: v.object({ street: v.string(), city: v.string() }),
        })
      );
      const addressField = config.fields[0];
      expect(addressField.kind).toBe("object");
      expect(addressField.fields).toHaveLength(2);
      expect(addressField.fields[0]!.key).toBe("street");
    });

    test("object with optional fields", () => {
      const config = buildFormFields(
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
      const config = buildFormFields(v.array(v.string()));
      expect(config.kind).toBe("array");
      expect(config.item).toBeDefined();
    });

    test("array of strings → item is leaf with inputType:'text'", () => {
      const config = buildFormFields(v.array(v.string()));
      const item = config.item;
      expect(item.kind).toBe("leaf");
      expect(item.inputType).toBe("text");
    });

    test("array of objects → item is ObjectFormFieldConfig", () => {
      const config = buildFormFields(v.array(v.object({ label: v.string(), done: v.boolean() })));
      const item = config.item;
      expect(item.kind).toBe("object");
      expect(item.fields).toHaveLength(2);
    });

    test("optional array → required:false", () => {
      const config = buildFormFields(v.optional(v.array(v.string())));
      expect(config.kind).toBe("array");
      expect(config.required).toBe(false);
    });
  });

  // ─── Tuple / multi-step ───────────────────────────────────────────────────────

  describe("tuple (multi-step)", () => {
    test("tuple → kind:'tuple', items array", () => {
      const config = buildFormFields(v.tuple([v.string(), v.number()]));
      expect(config.kind).toBe("tuple");
      expect(config.items).toHaveLength(2);
    });

    test("tuple of objects (wizard pattern)", () => {
      const config = buildFormFields(
        v.tuple([
          v.pipe(v.object({ firstName: v.string() }), v.title("Step 1")),
          v.pipe(v.object({ email: v.string() }), v.title("Step 2")),
        ])
      );

      expect(config.kind).toBe("tuple");
      expect(config.items).toHaveLength(2);

      const step1 = config.items[0];
      expect(step1.kind).toBe("object");
      expect(step1.label).toBe("Step 1");
      expect(step1.fields[0]!.key).toBe("firstName");

      const step2 = config.items[1];
      expect(step2.kind).toBe("object");
      expect(step2.label).toBe("Step 2");
      expect(step2.fields[0]!.key).toBe("email");
    });

    test("tuple items have index as key", () => {
      const config = buildFormFields(v.tuple([v.string(), v.number()]));
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
      const config = buildFormFields(v.enum(Status));
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("select");
      expect(config.nodeType).toBe("enum");
    });

    test("enum options have label (key) and value", () => {
      const config = buildFormFields(v.enum(Status));
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
      const config = buildFormFields(v.picklist(["react", "vue", "solid"]));
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("select");
      expect(config.nodeType).toBe("picklist");
      expect(config.options).toHaveLength(3);
      expect(config.options![0]).toEqual({ label: "react", value: "react" });
    });

    test("numeric picklist", () => {
      const config = buildFormFields(v.picklist([1, 2, 3]));
      expect(config.options![0]).toEqual({ label: "1", value: 1 });
    });
  });

  // ─── Literal ──────────────────────────────────────────────────────────────────

  describe("literal", () => {
    test("literal string → kind:'leaf', inputType:'hidden'", () => {
      const config = buildFormFields(v.literal("fixed"));
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("hidden");
      expect(config.nodeType).toBe("literal");
      expect(config.options![0]).toEqual({ label: "fixed", value: "fixed" });
    });

    test("literal number", () => {
      const config = buildFormFields(v.literal(42));
      expect(config.options![0]).toEqual({ label: "42", value: 42 });
    });

    test("literal SerializedBigInt → converted to native BigInt", () => {
      const literalNode = {
        kind: "schema" as const,
        type: "literal" as const,
        literal: { __type: "bigint" as const, value: "99" },
      };
      const config = buildFormFields(literalNode) as LeafFormFieldConfig;
      expect(config.kind).toBe("leaf");
      expect(config.inputType).toBe("hidden");
      expect(config.nodeType).toBe("literal");
      expect(config.options![0]).toEqual({ value: BigInt(99), label: "99" });
    });
  });

  // ─── Union ────────────────────────────────────────────────────────────────────

  describe("union of literals → leaf", () => {
    test("all-literal union → kind:'leaf', inputType:'select'", () => {
      const config = buildFormFields(v.union([v.literal("a"), v.literal("b"), v.literal("c")]));
      expect(config.kind).toBe("leaf");
      if (config.kind !== "leaf") throw new Error("Shouldn't be reached");
      expect(config.inputType).toBe("select");
      expect(config.nodeType).toBe("union");
      expect(config.options).toHaveLength(3);
      expect(config.options![0]).toEqual({ label: "a", value: "a" });
    });

    test("mixed union (object + string) → kind:'union'", () => {
      const config = buildFormFields(
        v.union([v.object({ name: v.string() }), v.object({ title: v.string() })])
      );
      expect(config.kind).toBe("union");
      if (config.kind !== "union") throw new Error("Shouldn't be reached");
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
      const config = buildFormFields(schema);
      expect(config.kind).toBe("variant");
      expect(config.discriminatorKey).toBe("type");
    });

    test("variant has correct branch count", () => {
      const config = buildFormFields(schema);
      expect(config.branches).toHaveLength(2);
    });

    test("branches have correct discriminator values", () => {
      const config = buildFormFields(schema);
      expect(config.branches[0]!.value).toBe("text");
      expect(config.branches[1]!.value).toBe("image");
    });

    test("branch fields include the discriminator field", () => {
      const config = buildFormFields(schema);
      const textBranch = config.branches[0]!;
      const fieldKeys = textBranch.fields.map((f) => f.key);
      expect(fieldKeys).toContain("type");
      expect(fieldKeys).toContain("content");
    });

    test("branch fields are correctly typed", () => {
      const config = buildFormFields(schema);
      const imageBranch = config.branches[1]!;
      const urlField = imageBranch.fields.find((f) => f.key === "url")!;
      expect(urlField.kind).toBe("leaf");
      if (urlField.kind === "leaf") expect(urlField.inputType).toBe("url");
      const altField = imageBranch.fields.find((f) => f.key === "alt")!;
      expect(altField.required).toBe(false);
    });
  });

  // ─── Intersect ────────────────────────────────────────────────────────────────

  describe("intersect", () => {
    test("intersect of objects → kind:'object' with merged fields", () => {
      const config = buildFormFields(
        v.intersect([v.object({ name: v.string() }), v.object({ age: v.number() })])
      );
      expect(config.kind).toBe("object");
      if (config.kind !== "object") throw new Error("Shouldn't be reached");
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
      );
      expect(config.kind).toBe("object");
      if (config.kind !== "object") throw new Error("Shouldn't be reached");
      const sharedField = config.fields.find((f) => f.key === "shared")!;
      // First definition of 'shared' (string) wins
      expect(sharedField.kind).toBe("leaf");
      if (sharedField.kind === "leaf") expect(sharedField.nodeType).toBe("string");
      expect(config.fields).toHaveLength(3); // shared, unique1, unique2
    });
  });

  // ─── Unsupported ──────────────────────────────────────────────────────────────

  describe("unsupported types", () => {
    test("lazy schema → kind:'unsupported'", () => {
      const schema = v.lazy(() => v.string());
      const config = buildFormFields(schema);
      expect(config.kind).toBe("unsupported");
    });

    test("function schema → kind:'unsupported'", () => {
      const config = buildFormFields(v.function());
      expect(config.kind).toBe("unsupported");
      if (config.kind !== "unsupported") throw new Error("Shouldn't be reached");
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
      const config = buildFormFields(v.union([v.object({ name: v.string() }), v.string()]));
      expect(config.kind).toBe("union");
      if (config.kind !== "union") throw new Error("Shouldn't be reached");
      expect(config.options).toHaveLength(2);
      // First option: object with 1 field
      expect(config.options[0]).toHaveLength(1);
      // Second option: non-object (string) → single-element fieldset
      expect(config.options[1]).toHaveLength(1);
      expect(config.options[1]![0].kind).toBe("leaf");
    });
  });

  // ─── Coverage: intersect with non-object schemas (line 292) ───────────────────

  describe("intersect with non-object schemas", () => {
    test("intersect of non-object schemas → kind:'unsupported'", () => {
      const config = buildFormFields(v.intersect([v.string(), v.number()]));
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
      const config = buildFormFields(variantNode) as VariantFormFieldConfig;
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
      const config = buildFormFields(schema);
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
      const config = buildFormFields(variantNode) as VariantFormFieldConfig;
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
      const config = buildFormFields(variantNode) as VariantFormFieldConfig;
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
      const config = buildFormFields(picklistNode) as LeafFormFieldConfig;
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
      expect(config.item.kind).toBe("unsupported");
    });
  });

  // ─── Record ──────────────────────────────────────────────────────────────────

  describe("record", () => {
    test("record(string, string) → kind:'record' with keyField and valueField", () => {
      const config = buildFormFields(v.record(v.string(), v.string()));
      expect(config.kind).toBe("record");
      expect(config.keyField.kind).toBe("leaf");
      expect(config.keyField.inputType).toBe("text");
      expect(config.valueField.kind).toBe("leaf");
      expect(config.valueField.inputType).toBe("text");
    });

    test("record(string, number) → valueField has inputType:'number'", () => {
      const config = buildFormFields(v.record(v.string(), v.number()));
      expect(config.kind).toBe("record");
      expect(config.valueField.inputType).toBe("number");
    });

    test("record(picklist, object) → keyField is select, valueField is object", () => {
      const config = buildFormFields(v.record(v.picklist(["a", "b"]), v.object({ x: v.string() })));
      expect(config.kind).toBe("record");
      expect(config.keyField.inputType).toBe("select");
      expect(config.valueField.kind).toBe("object");
    });

    test("record keyField path and valueField path", () => {
      const config = buildFormFields(v.record(v.string(), v.string()));
      expect(config.keyField.path).toEqual(["key"]);
      expect(config.valueField.path).toEqual(["value"]);
    });

    test("optional record → required:false", () => {
      const config = buildFormFields(v.optional(v.record(v.string(), v.string())));
      expect(config.kind).toBe("record");
      expect(config.required).toBe(false);
    });
  });
});

// ─── InferFormFieldConfig (type-level) ────────────────────────────────────────

describe("InferFormFieldConfig", () => {
  // ── Direct schema types ───────────────────────────────────────────────────

  describe("from Valibot schemas (no InferASTNode needed)", () => {
    test("string schema → LeafFormFieldConfig", () => {
      expectTypeOf<
        InferFormFieldConfig<v.StringSchema<undefined>>
      >().toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("number schema → LeafFormFieldConfig", () => {
      expectTypeOf<
        InferFormFieldConfig<v.NumberSchema<undefined>>
      >().toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("boolean schema → LeafFormFieldConfig", () => {
      expectTypeOf<
        InferFormFieldConfig<v.BooleanSchema<undefined>>
      >().toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("object schema → ObjectFormFieldConfig<LeafFormFieldConfig>", () => {
      type S = v.ObjectSchema<{ name: v.StringSchema<undefined> }, undefined>;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<
        ObjectFormFieldConfig<LeafFormFieldConfig>
      >();
    });

    test("array schema → ArrayFormFieldConfig<LeafFormFieldConfig>", () => {
      type S = v.ArraySchema<v.StringSchema<undefined>, undefined>;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<
        ArrayFormFieldConfig<LeafFormFieldConfig>
      >();
    });

    test("tuple schema → TupleFormFieldConfig<[LeafFormFieldConfig]>", () => {
      type S = v.TupleSchema<[v.StringSchema<undefined>], undefined>;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<
        TupleFormFieldConfig<[LeafFormFieldConfig]>
      >();
    });

    test("union schema → LeafFormFieldConfig | UnionFormFieldConfig", () => {
      type S = v.UnionSchema<
        [v.LiteralSchema<"a", undefined>, v.LiteralSchema<"b", undefined>],
        undefined
      >;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<
        LeafFormFieldConfig | UnionFormFieldConfig
      >();
    });

    test("variant schema → VariantFormFieldConfig", () => {
      type S = v.VariantSchema<
        "type",
        [
          v.ObjectSchema<{ type: v.LiteralSchema<"a", undefined> }, undefined>,
          v.ObjectSchema<{ type: v.LiteralSchema<"b", undefined> }, undefined>,
        ],
        undefined
      >;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<VariantFormFieldConfig>();
    });

    test("record schema → RecordFormFieldConfig<LeafFormFieldConfig, LeafFormFieldConfig>", () => {
      type S = v.RecordSchema<v.StringSchema<undefined>, v.NumberSchema<undefined>, undefined>;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<
        RecordFormFieldConfig<LeafFormFieldConfig, LeafFormFieldConfig>
      >();
    });

    test("picklist schema → LeafFormFieldConfig", () => {
      type S = v.PicklistSchema<["a", "b", "c"], undefined>;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("literal schema → LeafFormFieldConfig", () => {
      type S = v.LiteralSchema<"hello", undefined>;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("intersect schema → ObjectFormFieldConfig | UnsupportedFormFieldConfig", () => {
      type S = v.IntersectSchema<
        [
          v.ObjectSchema<{ a: v.StringSchema<undefined> }, undefined>,
          v.ObjectSchema<{ b: v.NumberSchema<undefined> }, undefined>,
        ],
        undefined
      >;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<
        ObjectFormFieldConfig | UnsupportedFormFieldConfig
      >();
    });
  });

  // ── Wrapper unwrapping ────────────────────────────────────────────────────

  describe("wrapper unwrapping", () => {
    test("optional(string) → LeafFormFieldConfig", () => {
      type S = v.OptionalSchema<v.StringSchema<undefined>, undefined>;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("nullable(number) → LeafFormFieldConfig", () => {
      type S = v.NullableSchema<v.NumberSchema<undefined>, undefined>;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("nullish(object) → ObjectFormFieldConfig<LeafFormFieldConfig>", () => {
      type S = v.NullishSchema<
        v.ObjectSchema<{ x: v.StringSchema<undefined> }, undefined>,
        undefined
      >;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<
        ObjectFormFieldConfig<LeafFormFieldConfig>
      >();
    });

    test("optional(nullable(string)) → LeafFormFieldConfig (double wrap)", () => {
      type S = v.OptionalSchema<v.NullableSchema<v.StringSchema<undefined>, undefined>, undefined>;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("optional(array) → ArrayFormFieldConfig<LeafFormFieldConfig>", () => {
      type S = v.OptionalSchema<v.ArraySchema<v.StringSchema<undefined>, undefined>, undefined>;
      expectTypeOf<InferFormFieldConfig<S>>().toEqualTypeOf<
        ArrayFormFieldConfig<LeafFormFieldConfig>
      >();
    });
  });

  // ── From AST nodes ────────────────────────────────────────────────────────

  describe("from AST nodes (via InferASTNode)", () => {
    test("InferASTNode<StringSchema> → LeafFormFieldConfig", () => {
      type Node = InferASTNode<v.StringSchema<undefined>>;
      expectTypeOf<InferFormFieldConfig<Node>>().toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("InferASTNode<ObjectSchema> → assignable to ObjectFormFieldConfig (entries widened by index sig)", () => {
      type Node = InferASTNode<v.ObjectSchema<{ name: v.StringSchema<undefined> }, undefined>>;
      // ObjectASTNode's `entries: Record<string, ASTNode>` index signature prevents
      // deep child inference, so the result falls back to ObjectFormFieldConfig<FormFieldConfig>.
      expectTypeOf<InferFormFieldConfig<Node>>().toExtend<ObjectFormFieldConfig>();
    });

    test("InferASTNode<OptionalSchema<StringSchema>> → LeafFormFieldConfig", () => {
      type Node = InferASTNode<v.OptionalSchema<v.StringSchema<undefined>, undefined>>;
      expectTypeOf<InferFormFieldConfig<Node>>().toEqualTypeOf<LeafFormFieldConfig>();
    });
  });

  // ── Fallback cases ────────────────────────────────────────────────────────

  describe("fallback", () => {
    test("wide ASTNode → assignable to FormFieldConfig", () => {
      // Distribution over the wide ASTNode union produces explicit generic
      // instantiations (e.g. ObjectFormFieldConfig<FormFieldConfig>) that are
      // structurally identical to FormFieldConfig but not nominally equal.
      expectTypeOf<InferFormFieldConfig<ASTNode>>().toExtend<FormFieldConfig>();
    });

    test("GenericSchema (wide) → FormFieldConfig", () => {
      expectTypeOf<InferFormFieldConfig<v.GenericSchema>>().toEqualTypeOf<FormFieldConfig>();
    });
  });

  // ── buildFormFields return type narrowing ─────────────────────────────────

  describe("buildFormFields return type", () => {
    test("string schema → narrowed to LeafFormFieldConfig", () => {
      const config = buildFormFields(v.string());
      expectTypeOf(config).toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("object schema → narrowed to ObjectFormFieldConfig<LeafFormFieldConfig>", () => {
      const config = buildFormFields(v.object({ name: v.string() }));
      expectTypeOf(config).toEqualTypeOf<ObjectFormFieldConfig<LeafFormFieldConfig>>();
    });

    test("array schema → narrowed to ArrayFormFieldConfig<LeafFormFieldConfig>", () => {
      const config = buildFormFields(v.array(v.string()));
      expectTypeOf(config).toEqualTypeOf<ArrayFormFieldConfig<LeafFormFieldConfig>>();
    });

    test("optional(string) → narrowed to LeafFormFieldConfig", () => {
      const config = buildFormFields(v.optional(v.string()));
      expectTypeOf(config).toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("pipe(string, email) → narrowed to LeafFormFieldConfig", () => {
      const config = buildFormFields(v.pipe(v.string(), v.email()));
      expectTypeOf(config).toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("pipe(object, title) → narrowed to ObjectFormFieldConfig<LeafFormFieldConfig>", () => {
      const config = buildFormFields(v.pipe(v.object({ x: v.string() }), v.title("Test")));
      expectTypeOf(config).toEqualTypeOf<ObjectFormFieldConfig<LeafFormFieldConfig>>();
    });

    test("record schema → narrowed to RecordFormFieldConfig<LeafFormFieldConfig, LeafFormFieldConfig>", () => {
      const config = buildFormFields(v.record(v.string(), v.number()));
      expectTypeOf(config).toEqualTypeOf<
        RecordFormFieldConfig<LeafFormFieldConfig, LeafFormFieldConfig>
      >();
    });

    test("variant schema → narrowed to VariantFormFieldConfig", () => {
      const config = buildFormFields(
        v.variant("type", [v.object({ type: v.literal("a") }), v.object({ type: v.literal("b") })])
      );
      expectTypeOf(config).toEqualTypeOf<VariantFormFieldConfig>();
    });

    test("tuple schema → narrowed to TupleFormFieldConfig<[LeafFormFieldConfig, LeafFormFieldConfig]>", () => {
      const config = buildFormFields(v.tuple([v.string(), v.number()]));
      expectTypeOf(config).toEqualTypeOf<
        TupleFormFieldConfig<[LeafFormFieldConfig, LeafFormFieldConfig]>
      >();
    });

    test("union schema → LeafFormFieldConfig | UnionFormFieldConfig", () => {
      const config = buildFormFields(v.union([v.literal("a"), v.literal("b")]));
      expectTypeOf(config).toEqualTypeOf<LeafFormFieldConfig | UnionFormFieldConfig>();
    });
  });

  // ── Deep child inference ──────────────────────────────────────────────────

  describe("deep child inference (no manual casts)", () => {
    test("object.fields[n] is narrowed to the union of entry configs", () => {
      const config = buildFormFields(v.object({ name: v.string(), age: v.number() }));
      // fields element type is narrowed to LeafFormFieldConfig — no cast needed
      const field = config.fields[0]!;
      expectTypeOf(field).toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("array.item is narrowed to the item config type", () => {
      const config = buildFormFields(v.array(v.string()));
      // item is directly LeafFormFieldConfig — no cast needed
      expectTypeOf(config.item).toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("array of objects: item is ObjectFormFieldConfig<LeafFormFieldConfig>", () => {
      const config = buildFormFields(v.array(v.object({ name: v.string(), score: v.number() })));
      expectTypeOf(config.item).toEqualTypeOf<ObjectFormFieldConfig<LeafFormFieldConfig>>();
      // Access item.fields without casting
      const itemField = config.item.fields[0]!;
      expectTypeOf(itemField).toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("tuple: each position independently typed (wizard pattern)", () => {
      const config = buildFormFields(
        v.tuple([
          v.object({ firstName: v.string() }),
          v.object({ email: v.pipe(v.string(), v.email()) }),
        ])
      );
      // Each step is independently narrowed
      const step1 = config.items[0];
      expectTypeOf(step1).toEqualTypeOf<ObjectFormFieldConfig<LeafFormFieldConfig>>();
      const step2 = config.items[1];
      expectTypeOf(step2).toEqualTypeOf<ObjectFormFieldConfig<LeafFormFieldConfig>>();
    });

    test("record: keyField and valueField independently narrowed", () => {
      const config = buildFormFields(v.record(v.string(), v.number()));
      expectTypeOf(config.keyField).toEqualTypeOf<LeafFormFieldConfig>();
      expectTypeOf(config.valueField).toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("record with object values: valueField is ObjectFormFieldConfig", () => {
      const config = buildFormFields(v.record(v.string(), v.object({ x: v.string() })));
      expectTypeOf(config.keyField).toEqualTypeOf<LeafFormFieldConfig>();
      expectTypeOf(config.valueField).toEqualTypeOf<ObjectFormFieldConfig<LeafFormFieldConfig>>();
    });

    test("mixed object with nested object → fields union includes both kinds", () => {
      const config = buildFormFields(
        v.object({
          name: v.string(),
          address: v.object({ city: v.string() }),
        })
      );
      // fields[n] is LeafFormFieldConfig | ObjectFormFieldConfig<LeafFormFieldConfig>
      const field = config.fields[0]!;
      expectTypeOf(field).toEqualTypeOf<
        LeafFormFieldConfig | ObjectFormFieldConfig<LeafFormFieldConfig>
      >();
    });

    test("optional(object) preserves deep child inference", () => {
      const config = buildFormFields(v.optional(v.object({ name: v.string() })));
      expectTypeOf(config).toEqualTypeOf<ObjectFormFieldConfig<LeafFormFieldConfig>>();
      expectTypeOf(config.fields[0]!).toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("pipe(object, title) preserves deep child inference", () => {
      const config = buildFormFields(v.pipe(v.object({ x: v.number() }), v.title("Section")));
      expectTypeOf(config).toEqualTypeOf<ObjectFormFieldConfig<LeafFormFieldConfig>>();
      expectTypeOf(config.fields[0]!).toEqualTypeOf<LeafFormFieldConfig>();
    });

    test("tuple with mixed step types", () => {
      const config = buildFormFields(v.tuple([v.string(), v.object({ name: v.string() })]));
      expectTypeOf(config.items[0]).toEqualTypeOf<LeafFormFieldConfig>();
      expectTypeOf(config.items[1]).toEqualTypeOf<ObjectFormFieldConfig<LeafFormFieldConfig>>();
    });

    test("nested array in object: two levels of inference", () => {
      const config = buildFormFields(v.object({ tags: v.array(v.string()) }));
      // fields[n] is ArrayFormFieldConfig<LeafFormFieldConfig>
      const tags = config.fields[0]!;
      expectTypeOf(tags).toEqualTypeOf<ArrayFormFieldConfig<LeafFormFieldConfig>>();
    });
  });
});

// ─── Config field structure validation ────────────────────────────────────────

describe("buildFormFields config structure", () => {
  test("complete registration form", () => {
    const schema = v.object({
      username: v.pipe(v.string(), v.minLength(3), v.maxLength(20)),
      email: v.pipe(v.string(), v.email()),
      password: v.pipe(v.string(), v.minLength(8)),
      age: v.pipe(v.number(), v.minValue(13), v.maxValue(120)),
      bio: v.optional(v.pipe(v.string(), v.maxLength(500))),
      newsletter: v.optional(v.boolean(), false),
    });
    const config = buildFormFields(schema);

    expect(config.kind).toBe("object");
    if (config.kind !== "object") throw new Error("Shouldn't be reached");

    expect(config.fields).toHaveLength(6);

    // username
    const username = config.fields[0];
    expect(username.key).toBe("username");
    expect(username.inputType).toBe("text");
    expect(username.required).toBe(true);
    expect(username.constraints?.minLength).toBe(3);
    expect(username.constraints?.maxLength).toBe(20);

    // email
    const email = config.fields[1];
    expect(email.key).toBe("email");
    expect(email.inputType).toBe("email");
    expect(email.required).toBe(true);

    // age
    const age = config.fields[3];
    expect(age.key).toBe("age");
    expect(age.inputType).toBe("number");
    expect(age.constraints?.min).toBe(13);
    expect(age.constraints?.max).toBe(120);

    // bio (optional)
    const bio = config.fields[4];
    expect(bio.required).toBe(false);
    expect(bio.constraints?.maxLength).toBe(500);

    // newsletter (optional with default)
    const newsletter = config.fields[5];
    expect(newsletter.inputType).toBe("checkbox");
    expect(newsletter.required).toBe(false);
    expect(newsletter.default).toBe(false);
  });

  test("nested address form with array of phone numbers", () => {
    const schema = v.object({
      name: v.string(),
      address: v.object({
        street: v.string(),
        city: v.string(),
        zip: v.pipe(v.string(), v.regex(/^\d{5}$/)),
      }),
      phones: v.array(
        v.object({
          type: v.picklist(["home", "work", "mobile"]),
          number: v.string(),
        })
      ),
    });
    const config = buildFormFields(schema);

    // Root
    expect(config.kind).toBe("object");
    expect(config.fields).toHaveLength(3);

    // Address sub-object
    const address = config.fields[1];
    expect(address.kind).toBe("object");
    if (address.kind !== "object") throw new Error("Shouldn't be reached");
    expect(address.key).toBe("address");
    expect(address.fields).toHaveLength(3);
    expect(address.fields[2]!.key).toBe("zip");
    const zipField = address.fields[2]!;
    if (zipField.kind === "leaf") expect(zipField.constraints?.pattern).toBeDefined();

    // Phones array
    const phones = config.fields[2];
    expect(phones.kind).toBe("array");
    if (phones.kind !== "array") throw new Error("Shouldn't be reached");
    expect(phones.key).toBe("phones");
    expect(phones.item.kind).toBe("object");

    // Phone item template
    if (phones.item.kind !== "object") throw new Error("Shouldn't be reached");
    const phoneItem = phones.item;
    expect(phoneItem.fields).toHaveLength(2);
    const typeField = phoneItem.fields[0]!;
    if (typeField.kind !== "leaf") throw new Error("Shouldn't be reached");
    expect(typeField.inputType).toBe("select");
    expect(typeField.options).toHaveLength(3);
    expect(typeField.options![0]!.value).toBe("home");
  });

  test("wizard form (tuple of object steps)", () => {
    const schema = v.tuple([
      v.pipe(
        v.object({
          firstName: v.string(),
          lastName: v.string(),
        }),
        v.title("Personal Info"),
        v.description("Enter your name")
      ),
      v.pipe(
        v.object({
          email: v.pipe(v.string(), v.email()),
          phone: v.optional(v.string()),
        }),
        v.title("Contact Details")
      ),
      v.pipe(
        v.object({
          plan: v.picklist(["free", "pro", "enterprise"]),
          terms: v.boolean(),
        }),
        v.title("Plan Selection")
      ),
    ]);
    const config = buildFormFields(schema);

    expect(config.kind).toBe("tuple");
    expect(config.items).toHaveLength(3);

    // Step 1
    const step1 = config.items[0];
    expect(step1.label).toBe("Personal Info");
    expect(step1.description).toBe("Enter your name");
    expect(step1.fields).toHaveLength(2);

    // Step 2
    const step2 = config.items[1];
    expect(step2.label).toBe("Contact Details");
    expect(step2.fields).toHaveLength(2);
    expect(step2.fields[0].inputType).toBe("email");
    expect(step2.fields[1]!.required).toBe(false);

    // Step 3
    const step3 = config.items[2];
    expect(step3.label).toBe("Plan Selection");
    const planField = step3.fields[0];
    expect(planField.inputType).toBe("select");
    expect(planField.options).toHaveLength(3);
  });

  test("discriminated union (variant) CMS block editor", () => {
    const schema = v.variant("blockType", [
      v.pipe(
        v.object({
          blockType: v.literal("text"),
          content: v.pipe(v.string(), v.maxLength(5000)),
          format: v.picklist(["plain", "markdown", "html"]),
        }),
        v.title("Text Block")
      ),
      v.pipe(
        v.object({
          blockType: v.literal("image"),
          url: v.pipe(v.string(), v.url()),
          alt: v.optional(v.string()),
          width: v.optional(v.number()),
        }),
        v.title("Image Block")
      ),
    ]);
    const config = buildFormFields(schema);

    expect(config.kind).toBe("variant");
    expect(config.discriminatorKey).toBe("blockType");
    expect(config.branches).toHaveLength(2);

    // Text branch
    const textBranch = config.branches[0]!;
    expect(textBranch.value).toBe("text");
    expect(textBranch.label).toBe("Text Block");
    expect(textBranch.fields).toHaveLength(3);
    const contentField = textBranch.fields.find((f) => f.key === "content")!;
    expect(contentField.kind).toBe("leaf");
    if (contentField.kind === "leaf") expect(contentField.constraints?.maxLength).toBe(5000);
    const formatField = textBranch.fields.find((f) => f.key === "format")!;
    expect(formatField.kind).toBe("leaf");
    if (formatField.kind === "leaf") expect(formatField.inputType).toBe("select");

    // Image branch
    const imgBranch = config.branches[1]!;
    expect(imgBranch.value).toBe("image");
    expect(imgBranch.label).toBe("Image Block");
    const urlField = imgBranch.fields.find((f) => f.key === "url")!;
    expect(urlField.kind).toBe("leaf");
    if (urlField.kind === "leaf") expect(urlField.inputType).toBe("url");
    const altField = imgBranch.fields.find((f) => f.key === "alt")!;
    expect(altField.required).toBe(false);
    const widthField = imgBranch.fields.find((f) => f.key === "width")!;
    expect(widthField.required).toBe(false);
  });

  test("record-based settings form", () => {
    const schema = v.record(v.picklist(["theme", "lang", "tz"]), v.string());
    const config = buildFormFields(schema);

    expect(config.kind).toBe("record");
    expect(config.keyField.kind).toBe("leaf");
    expect(config.keyField.inputType).toBe("select");
    expect(config.keyField.options).toHaveLength(3);
    expect(config.valueField.kind).toBe("leaf");
    expect(config.valueField.inputType).toBe("text");
  });

  test("deeply nested path propagation", () => {
    const schema = v.object({
      level1: v.object({
        level2: v.object({
          level3: v.string(),
        }),
      }),
    });
    const config = buildFormFields(schema);
    const l1 = config.fields[0];
    const l2 = l1.fields[0];
    const l3 = l2.fields[0];

    expect(l1.path).toEqual(["level1"]);
    expect(l2.path).toEqual(["level1", "level2"]);
    expect(l3.path).toEqual(["level1", "level2", "level3"]);
    expect(l3.key).toBe("level3");
  });

  test("non-discriminated union with mixed branches", () => {
    const schema = v.union([
      v.object({ mode: v.literal("simple"), query: v.string() }),
      v.object({
        mode: v.literal("advanced"),
        filters: v.array(v.string()),
        sortBy: v.optional(v.string()),
      }),
    ]);
    const config = buildFormFields(schema);

    expect(config.kind).toBe("union");
    if (config.kind !== "union") throw new Error("Shouldn't be reached");
    expect(config.options).toHaveLength(2);

    // First branch: 2 fields
    expect(config.options[0]).toHaveLength(2);
    expect(config.options[0]![0]!.key).toBe("mode");
    expect(config.options[0]![1]!.key).toBe("query");

    // Second branch: 3 fields
    expect(config.options[1]).toHaveLength(3);
    expect(config.options[1]![1]!.key).toBe("filters");
    expect(config.options[1]![1]!.kind).toBe("array");
    expect(config.options[1]![2]!.required).toBe(false);
  });
});
