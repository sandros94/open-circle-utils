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

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/valibot-ast)](https://npmx.dev/package/valibot-ast)

### [`formisch-utils`](./packages/formisch-utils)

AST-first utilities for building [Formisch](https://formisch.dev) forms from Valibot schemas.

- 🏗️ Derive form field configs from schemas or AST nodes
- 📋 Infer HTML input types, constraints, and metadata
- 🎛️ Generate type-safe initial values
- ⚛️ Framework adapters for React, Preact, Vue, Solid, Qwik
- 🎯 Fully tree-shakeable

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/formisch-utils)](https://npmx.dev/package/formisch-utils)

> [!TIP]
> Continuous releases are also available via [pkg.pr.new](https://pkg.pr.new):
> ```bash
> pnpm add https://pkg.pr.new/valibot-ast@main
> pnpm add https://pkg.pr.new/formisch-utils@main
> ```

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
