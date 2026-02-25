# Open Circle Utils

A monorepo of Valibot schema utilities providing AST serialization and runtime introspection capabilities.

> [!CAUTION]
> Highly experimental, work in progress. Read and use at your own risk.

> [!NOTE]
> I'm not associated with [Open Circle](https://github.com/open-circle) in any way. This is just a personal project inspired by their work and hopefully merged into their ecosystem in the future.

## Packages

### [`valibot-ast`](./packages/valibot-ast)

Bidirectional conversion between [Valibot](https://valibot.dev) schemas and JSON-serializable AST representations. Enables schema persistence, code generation, and cross-platform schema sharing.

- 🔄 Schema ↔ AST conversion
- 📦 JSON-serializable output
- ⚡ Async schema support
- 🔧 Custom operation dictionaries
- 🛠️ Type-safe schema introspection utilities (`valibot-ast/utils`)
- 🎯 Fully tree-shakeable

**Preview releases:** `https://pkg.pr.new/sandros94/open-circle-utils/valibot-ast@main`

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
- Separate AST packages for each library
- Shared library-agnostic AST types

## License

MIT
