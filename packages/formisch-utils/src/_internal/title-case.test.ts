import { describe, test, expect } from "vitest";
import { titleCase } from "./title-case.ts";

describe("titleCase", () => {
  test("single lowercase word", () => {
    expect(titleCase("email")).toBe("Email");
  });

  test("camelCase", () => {
    expect(titleCase("firstName")).toBe("First Name");
    expect(titleCase("myFieldId")).toBe("My Field Id");
    expect(titleCase("phoneNumber")).toBe("Phone Number");
  });

  test("snake_case", () => {
    expect(titleCase("phone_number")).toBe("Phone Number");
    expect(titleCase("first_name")).toBe("First Name");
  });

  test("mixed camelCase and snake_case", () => {
    expect(titleCase("my_camelCase")).toBe("My Camel Case");
  });

  test("already Title Case (single word)", () => {
    expect(titleCase("Name")).toBe("Name");
  });

  test("single character", () => {
    expect(titleCase("a")).toBe("A");
    expect(titleCase("A")).toBe("A");
  });

  test("empty string", () => {
    expect(titleCase("")).toBe("");
  });

  test("consecutive capitals are preserved per-word", () => {
    // "myURLPath" → split before URL only if preceded by lowercase
    expect(titleCase("myURLPath")).toBe("My URLPath");
  });

  test("number adjacent to uppercase letter", () => {
    expect(titleCase("address2Line")).toBe("Address2 Line");
  });
});
