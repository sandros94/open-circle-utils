import { describe, expectTypeOf, it } from "vitest";
import * as v from "valibot";

import { schemaToAST } from "../to-ast.ts";
import type { InferASTNode } from "./infer.ts";
import type { ASTNode } from "./kind.ts";
import type {
  ValidationASTNode,
  PrimitiveASTNode,
  ObjectASTNode,
  ArrayASTNode,
  TupleASTNode,
  UnionASTNode,
  VariantASTNode,
  IntersectASTNode,
  LiteralASTNode,
  EnumASTNode,
  PicklistASTNode,
  RecordASTNode,
  MapASTNode,
  SetASTNode,
  InstanceASTNode,
  LazyASTNode,
  WrappedASTNode,
  FunctionASTNode,
  CustomASTNode,
  SerializedBigInt,
} from "./nodes.ts";

describe("InferASTNode", () => {
  // Primitives

  describe("primitives", () => {
    it("string", () => {
      expectTypeOf<InferASTNode<v.StringSchema<undefined>>>().toExtend<
        PrimitiveASTNode & { type: "string" }
      >();
    });

    it("number", () => {
      expectTypeOf<InferASTNode<v.NumberSchema<undefined>>>().toExtend<
        PrimitiveASTNode & { type: "number" }
      >();
    });

    it("boolean", () => {
      expectTypeOf<InferASTNode<v.BooleanSchema<undefined>>>().toExtend<
        PrimitiveASTNode & { type: "boolean" }
      >();
    });

    it("date", () => {
      expectTypeOf<InferASTNode<v.DateSchema<undefined>>>().toExtend<
        PrimitiveASTNode & { type: "date" }
      >();
    });
  });

  // Object

  describe("object", () => {
    it("object with typed entries", () => {
      type Schema = v.ObjectSchema<
        { name: v.StringSchema<undefined>; age: v.NumberSchema<undefined> },
        undefined
      >;
      type Result = InferASTNode<Schema>;

      expectTypeOf<Result>().toExtend<
        ObjectASTNode & {
          type: "object";
          entries: {
            name: PrimitiveASTNode & { type: "string" };
            age: PrimitiveASTNode & { type: "number" };
          };
        }
      >();
    });

    it("strict object", () => {
      type Schema = v.StrictObjectSchema<{ id: v.NumberSchema<undefined> }, undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<ObjectASTNode & { type: "strict_object" }>();
    });
  });

  // Wrapped

  describe("wrapped", () => {
    it("optional", () => {
      type Schema = v.OptionalSchema<v.StringSchema<undefined>, undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<
        WrappedASTNode & {
          type: "optional";
          wrapped: PrimitiveASTNode & { type: "string" };
        }
      >();
    });

    it("nullable", () => {
      type Schema = v.NullableSchema<v.NumberSchema<undefined>, undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<
        WrappedASTNode & {
          type: "nullable";
          wrapped: PrimitiveASTNode & { type: "number" };
        }
      >();
    });

    it("nested wrapped", () => {
      type Schema = v.OptionalSchema<
        v.NullableSchema<v.StringSchema<undefined>, undefined>,
        undefined
      >;
      expectTypeOf<InferASTNode<Schema>>().toExtend<
        WrappedASTNode & {
          type: "optional";
          wrapped: WrappedASTNode & {
            type: "nullable";
            wrapped: PrimitiveASTNode & { type: "string" };
          };
        }
      >();
    });
  });

  // Array & Tuple

  describe("array & tuple", () => {
    it("array with typed item", () => {
      type Schema = v.ArraySchema<v.StringSchema<undefined>, undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<
        ArrayASTNode & { item: PrimitiveASTNode & { type: "string" } }
      >();
    });

    it("tuple with typed items", () => {
      type Schema = v.TupleSchema<
        [v.StringSchema<undefined>, v.NumberSchema<undefined>],
        undefined
      >;
      expectTypeOf<InferASTNode<Schema>>().toExtend<TupleASTNode & { type: "tuple" }>();
    });
  });

  // Union / Variant / Intersect

  describe("choice types", () => {
    it("union", () => {
      type Schema = v.UnionSchema<
        [v.StringSchema<undefined>, v.NumberSchema<undefined>],
        undefined
      >;
      expectTypeOf<InferASTNode<Schema>>().toExtend<UnionASTNode>();
    });

    it("variant narrows key", () => {
      type Schema = v.VariantSchema<
        "type",
        [
          v.ObjectSchema<
            {
              type: v.LiteralSchema<"a", undefined>;
              value: v.StringSchema<undefined>;
            },
            undefined
          >,
        ],
        undefined
      >;
      expectTypeOf<InferASTNode<Schema>>().toExtend<VariantASTNode & { key: "type" }>();
    });

    it("intersect", () => {
      type Schema = v.IntersectSchema<
        [
          v.ObjectSchema<{ a: v.StringSchema<undefined> }, undefined>,
          v.ObjectSchema<{ b: v.NumberSchema<undefined> }, undefined>,
        ],
        undefined
      >;
      expectTypeOf<InferASTNode<Schema>>().toExtend<IntersectASTNode>();
    });
  });

  // Literal / Enum / Picklist

  describe("literal/enum/picklist", () => {
    it("literal narrows value", () => {
      type Schema = v.LiteralSchema<"hello", undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<LiteralASTNode & { literal: "hello" }>();
    });

    it("literal bigint becomes SerializedBigInt", () => {
      type Schema = v.LiteralSchema<42n, undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<
        LiteralASTNode & { literal: SerializedBigInt }
      >();
    });

    it("enum", () => {
      enum Color {
        Red = "red",
        Blue = "blue",
      }

      expectTypeOf<InferASTNode<v.EnumSchema<typeof Color, undefined>>>().toExtend<EnumASTNode>();
    });

    it("picklist", () => {
      type Schema = v.PicklistSchema<["a", "b", "c"], undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<PicklistASTNode>();
    });
  });

  // Record / Map / Set

  describe("record/map/set", () => {
    it("record with typed key and value", () => {
      type Schema = v.RecordSchema<v.StringSchema<undefined>, v.NumberSchema<undefined>, undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<
        RecordASTNode & {
          key: PrimitiveASTNode & { type: "string" };
          value: PrimitiveASTNode & { type: "number" };
        }
      >();
    });

    it("map", () => {
      type Schema = v.MapSchema<v.StringSchema<undefined>, v.NumberSchema<undefined>, undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<
        MapASTNode & {
          key: PrimitiveASTNode & { type: "string" };
          value: PrimitiveASTNode & { type: "number" };
        }
      >();
    });

    it("set", () => {
      type Schema = v.SetSchema<v.StringSchema<undefined>, undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<
        SetASTNode & { item: PrimitiveASTNode & { type: "string" } }
      >();
    });
  });

  // Special schemas

  describe("special", () => {
    it("instance", () => {
      type Schema = v.InstanceSchema<typeof Date, undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<InstanceASTNode>();
    });

    it("lazy", () => {
      type Schema = v.LazySchema<v.StringSchema<undefined>>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<LazyASTNode>();
    });

    it("function", () => {
      type Schema = v.FunctionSchema<undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<FunctionASTNode>();
    });

    it("custom", () => {
      type Schema = v.CustomSchema<string, undefined>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<CustomASTNode>();
    });
  });

  // Pipe (SchemaWithPipe)

  describe("pipe", () => {
    it("piped string still resolves to PrimitiveASTNode", () => {
      const schema = v.pipe(v.string(), v.email());
      type Result = InferASTNode<typeof schema>;
      expectTypeOf<Result>().toExtend<PrimitiveASTNode & { type: "string" }>();
    });

    it("piped object preserves entries", () => {
      const schema = v.pipe(v.object({ name: v.string() }));
      type Result = InferASTNode<typeof schema>;
      expectTypeOf<Result>().toExtend<
        ObjectASTNode & {
          type: "object";
          entries: { name: PrimitiveASTNode & { type: "string" } };
        }
      >();
    });

    it("nested pipe as first argument flattens inner actions", () => {
      const schemaPipe = v.pipe(v.string(), v.minLength(3), v.maxLength(10));
      const schema = v.pipe(
        schemaPipe,
        v.check(() => true)
      );
      type Result = InferASTNode<typeof schema>;

      // Root should be string
      expectTypeOf<Result>().toExtend<PrimitiveASTNode & { type: "string" }>();
      // Pipe should be flattened: [minLength, maxLength, check]
      expectTypeOf<Result>().toExtend<{
        pipe: [
          ValidationASTNode & { type: "min_length" },
          ValidationASTNode & { type: "max_length" },
          ValidationASTNode & { type: "check" },
        ];
      }>();
    });

    it("deeply nested pipes are fully flattened at type level", () => {
      const inner = v.pipe(v.string(), v.minLength(1));
      const middle = v.pipe(inner, v.maxLength(10));
      const outer = v.pipe(
        middle,
        v.check(() => true)
      );
      type Result = InferASTNode<typeof outer>;

      expectTypeOf<Result>().toExtend<PrimitiveASTNode & { type: "string" }>();
      expectTypeOf<Result>().toExtend<{
        pipe: [
          ValidationASTNode & { type: "min_length" },
          ValidationASTNode & { type: "max_length" },
          ValidationASTNode & { type: "check" },
        ];
      }>();
    });
  });

  // schemaToAST return type

  describe("schemaToAST — typed return", () => {
    it("returns typed result for specific schema", () => {
      const result = schemaToAST(v.string());
      expectTypeOf(result.document.schema).toExtend<PrimitiveASTNode & { type: "string" }>();
    });

    it("returns typed result for object schema", () => {
      const result = schemaToAST(v.object({ name: v.string(), age: v.number() }));
      expectTypeOf(result.document.schema).toExtend<
        ObjectASTNode & {
          type: "object";
          entries: {
            name: PrimitiveASTNode & { type: "string" };
            age: PrimitiveASTNode & { type: "number" };
          };
        }
      >();
    });

    it("falls back to ASTNode for GenericSchema", () => {
      expectTypeOf<InferASTNode<v.GenericSchema>>().toEqualTypeOf<ASTNode>();
    });
  });

  // Async schemas

  describe("async", () => {
    it("async lazy has async: true", () => {
      type Schema = v.LazySchemaAsync<v.StringSchema<undefined>>;
      expectTypeOf<InferASTNode<Schema>>().toExtend<LazyASTNode & { async: true }>();
    });
  });
});
