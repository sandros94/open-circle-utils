import unjs from "eslint-config-unjs";

export default unjs({
  ignores: ["packages/*/dist/**", "packages/*/node_modules/**"],
  rules: {
    "unicorn/no-null": "off",
    "unicorn/no-nested-ternary": "off",
    "unicorn/prefer-structured-clone": "off",
  },
  markdown: {
    rules: {
      // markdown rule overrides
    },
  },
});
