# Open Circle Utils

A monorepo of validation library utilities, providing low-level introspection and AST capabilities.

> [!CAUTION]
> Highly experimental, work in progress. Read and use at your own risk.

> [!NOTE]
> I'm not associated with [Open Circle](https://github.com/open-circle) in any way. This is just a personal project inspired by their work and hopefully merged into their ecosystem in the future.

## Packages

### [`valibot-utils`](./packages/valibot-utils)

Low-level introspection utilities for Valibot schemas. Bundle-size optimized for production use.

- 🔍 Runtime schema introspection
- 📦 Tree-shakeable
- 🎯 Type-safe

**Preview releases:** `https://pkg.pr.new/sandros94/valibot-utils`

### [`valibot-ast`](./packages/valibot-ast)

AST (Abstract Syntax Tree) utilities for Valibot schemas. Convert schemas to/from JSON-serializable representations.

- 🌳 Schema ↔ AST conversion
- 📝 JSON-serializable
- 🔮 Library-agnostic format
- ⚡ Async support

**Preview releases:** `https://pkg.pr.new/sandros94/valibot-ast`

## Development

This is a pnpm workspace monorepo.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## Future Plans

- Support for more validation libraries (Zod, ArkType, Yup)
- Separate introspection and AST packages for each library
- Shared library-agnostic AST types

## License

MIT
