# Changelog


## valibot-ast@0.0.2

[compare changes](https://github.com/sandros94/open-circle-utils/compare/valibot-ast@0.0.1...valibot-ast@0.0.2)

### 🚀 Enhancements

- **valibot-ast:** Add `InferASTNode` ([ee9c34d](https://github.com/sandros94/open-circle-utils/commit/ee9c34d))
- **formisch-utils:** Add `InferFormFieldConfig` ([62a3f12](https://github.com/sandros94/open-circle-utils/commit/62a3f12))

### 🔥 Performance

- **valibot-ast:** Use flat lookup for `InferASTNode` type utility ([a99dc3b](https://github.com/sandros94/open-circle-utils/commit/a99dc3b))

### 🩹 Fixes

- **valibot-ast:** Support generic enum schemas ([ecd3bce](https://github.com/sandros94/open-circle-utils/commit/ecd3bce))
- Wrong pre-release AST version ([47efa1f](https://github.com/sandros94/open-circle-utils/commit/47efa1f))
- **valibot-ast:** Flatten all pipes ([5de127a](https://github.com/sandros94/open-circle-utils/commit/5de127a))

### 📖 Documentation

- Update main readme ([c902b77](https://github.com/sandros94/open-circle-utils/commit/c902b77))
- **valibot-ast:** Update readme ([bba0c59](https://github.com/sandros94/open-circle-utils/commit/bba0c59))
- **formisch-utils:** Update readme ([824d1fd](https://github.com/sandros94/open-circle-utils/commit/824d1fd))
- Move package versions ([e906822](https://github.com/sandros94/open-circle-utils/commit/e906822))

### 🏡 Chore

- **release:** Formisch-utils v0.0.1 ([3fa3b59](https://github.com/sandros94/open-circle-utils/commit/3fa3b59))
- Update deps ([d40c149](https://github.com/sandros94/open-circle-utils/commit/d40c149))

### ❤️ Contributors

- Sandro Circi ([@sandros94](https://github.com/sandros94))

## valibot-ast@0.0.1


### 🚀 Enhancements

- **valibot:** Object utils ([fa4aa9b](https://github.com/sandros94/open-circle-utils/commit/fa4aa9b))
- **valibot:** Info utils ([c881852](https://github.com/sandros94/open-circle-utils/commit/c881852))
- **valibot:** Add utils for object_with_rest schemas ([45b2acc](https://github.com/sandros94/open-circle-utils/commit/45b2acc))
- **valibot:** Add array utils ([ee6ef63](https://github.com/sandros94/open-circle-utils/commit/ee6ef63))
- **valibot:** Add record utils ([6e138cc](https://github.com/sandros94/open-circle-utils/commit/6e138cc))
- **valibot:** Add pipe utils ([bdd9f85](https://github.com/sandros94/open-circle-utils/commit/bdd9f85))
- **valibot:** Add choice utils ([f96b23c](https://github.com/sandros94/open-circle-utils/commit/f96b23c))
- **valibot:** Add base utils ([568685f](https://github.com/sandros94/open-circle-utils/commit/568685f))
- **valibot:** Add lazy utils ([dccfe0b](https://github.com/sandros94/open-circle-utils/commit/dccfe0b))
- **valibot:** Add literal utils ([89f37d4](https://github.com/sandros94/open-circle-utils/commit/89f37d4))
- **valibot:** Add special utils ([a5babf2](https://github.com/sandros94/open-circle-utils/commit/a5babf2))
- **valibot:** Add introspection module exports ([ce0e2e6](https://github.com/sandros94/open-circle-utils/commit/ce0e2e6))
- **ast:** Initial type structure ([b2a8417](https://github.com/sandros94/open-circle-utils/commit/b2a8417))
- **valibot:** Add AST support ([9be3062](https://github.com/sandros94/open-circle-utils/commit/9be3062))
- **ast:** Improve DX by using same dictionaries for both ways (small performance cost only on to-ast) ([261a2d7](https://github.com/sandros94/open-circle-utils/commit/261a2d7))
- **formisch-utils:** New `inferInputType` utility ([e71ca1a](https://github.com/sandros94/open-circle-utils/commit/e71ca1a))
- **formisch-utils:** New `inferInputConstraints` utility ([b8c91b4](https://github.com/sandros94/open-circle-utils/commit/b8c91b4))
- **formisch-utils:** Utility to infer label, description and placeholder ([968971a](https://github.com/sandros94/open-circle-utils/commit/968971a))
- **valibot-introspection:** Unwrap schema before extracting title, desc, examples and meta ([04b230b](https://github.com/sandros94/open-circle-utils/commit/04b230b))
- **valibot-ast:** Add `getWrappedASTNode` utility ([93010ec](https://github.com/sandros94/open-circle-utils/commit/93010ec))

### 🩹 Fixes

- **valibot:** Support async schemas for computating RequiredFalg and NullableFlag types ([8d844af](https://github.com/sandros94/open-circle-utils/commit/8d844af))
- **valibot:** Missing base export ([b081baa](https://github.com/sandros94/open-circle-utils/commit/b081baa))
- **eslint:** Update ignores to exclude dist and modules directories ([c9ee0b2](https://github.com/sandros94/open-circle-utils/commit/c9ee0b2))
- **introspection:** Proper `getWrappedSchema` name ([66aacf8](https://github.com/sandros94/open-circle-utils/commit/66aacf8))
- **introspection:** Improve instance schema limitation ([174857b](https://github.com/sandros94/open-circle-utils/commit/174857b))
- **introspection:** Improve lazy and closure schema limitations ([0a167a3](https://github.com/sandros94/open-circle-utils/commit/0a167a3))
- Formisch-utils deps ([df556b1](https://github.com/sandros94/open-circle-utils/commit/df556b1))
- **formisch-utils:** Rename `generateInitialInput` ([399d5ff](https://github.com/sandros94/open-circle-utils/commit/399d5ff))
- **formisch-utils:** Export deprecated utils ([a02d0aa](https://github.com/sandros94/open-circle-utils/commit/a02d0aa))
- **formisch-utils:** Simplify `inferInputType` return type ([6f441b2](https://github.com/sandros94/open-circle-utils/commit/6f441b2))
- **valibot-ast:** Do not include first pipe item and metadata as pipe actions ([df59b79](https://github.com/sandros94/open-circle-utils/commit/df59b79))
- **valibot-ast:** Use camel_case naming ([97a337e](https://github.com/sandros94/open-circle-utils/commit/97a337e))
- **valibot-ast:** Explicit const naming ([f487de4](https://github.com/sandros94/open-circle-utils/commit/f487de4))
- **valibot-ast:** Missing dictionary in `to-schema-async` ([601fdba](https://github.com/sandros94/open-circle-utils/commit/601fdba))
- Ast not extracting pipe transformation `requirement` ([0f8bc07](https://github.com/sandros94/open-circle-utils/commit/0f8bc07))
- **valibot-ast:** Imporve pipe extraction and unwrapping ([b73ea59](https://github.com/sandros94/open-circle-utils/commit/b73ea59))
- **valibot-ast:** Improve ast test coverage ([d185f80](https://github.com/sandros94/open-circle-utils/commit/d185f80))
- **valibot-ast:** Improve AST validation schema ([d543c25](https://github.com/sandros94/open-circle-utils/commit/d543c25))
- **valibot-ast:** Flat pipes, bigint serialization, custom schemas ([ff0f309](https://github.com/sandros94/open-circle-utils/commit/ff0f309))
- **formisch-utils:** Add support for record schemas ([a53fed9](https://github.com/sandros94/open-circle-utils/commit/a53fed9))
- **formisch-utils:** Coerce-value should handle empty input for optional fields with options ([a7bfa57](https://github.com/sandros94/open-circle-utils/commit/a7bfa57))
- **formisch-utils:** Required constrain ([4d972f2](https://github.com/sandros94/open-circle-utils/commit/4d972f2))
- **formisch-utils:** Apply deep-merge in frameworks ([88b4199](https://github.com/sandros94/open-circle-utils/commit/88b4199))
- **changelog:** Swap tagMessage and tagBody formats for consistency ([2831f64](https://github.com/sandros94/open-circle-utils/commit/2831f64))

### 💅 Refactors

- **valibot:** ⚠️  Unwrap utils ([161ea93](https://github.com/sandros94/open-circle-utils/commit/161ea93))
- ⚠️  Make project a monorepo and use pnpm+obuild+vitest ([#1](https://github.com/sandros94/open-circle-utils/pull/1))
- ⚠️  Formisch-utils ([#2](https://github.com/sandros94/open-circle-utils/pull/2))
- **valibot-ast:** Remove dead code and full v8 test coverage ([aaf8b0a](https://github.com/sandros94/open-circle-utils/commit/aaf8b0a))
- ⚠️  Drop `valibot-utils` and restructure `valibot-ast` ([029ca82](https://github.com/sandros94/open-circle-utils/commit/029ca82))
- Streamline dictionary reference handling in schemaToAST ([432ffed](https://github.com/sandros94/open-circle-utils/commit/432ffed))
- **valibot-ast:** ⚠️  `astToSchema` implementation ([41b1782](https://github.com/sandros94/open-circle-utils/commit/41b1782))
- ⚠️  `formisch-utils` ([166452b](https://github.com/sandros94/open-circle-utils/commit/166452b))
- **formisch-utils:** Improve metadata inference logic in inferMeta function ([f97d6e6](https://github.com/sandros94/open-circle-utils/commit/f97d6e6))

### 📖 Documentation

- Add readme ([ebb2746](https://github.com/sandros94/open-circle-utils/commit/ebb2746))
- Add disclaimer in readme ([37cc37c](https://github.com/sandros94/open-circle-utils/commit/37cc37c))
- Add READMEs to both valibot packages ([d1ae437](https://github.com/sandros94/open-circle-utils/commit/d1ae437))
- **ast:** Update types import examples ([ef916ac](https://github.com/sandros94/open-circle-utils/commit/ef916ac))
- **readme:** Fix `getEnumOptions` in examples ([a1aee3f](https://github.com/sandros94/open-circle-utils/commit/a1aee3f))
- **introspection:** Fix readme example ([2619ac5](https://github.com/sandros94/open-circle-utils/commit/2619ac5))
- Add README to formisch-utils ([2502a28](https://github.com/sandros94/open-circle-utils/commit/2502a28))
- Update `valibot-ast` ([7a8c6da](https://github.com/sandros94/open-circle-utils/commit/7a8c6da))

### 📦 Build

- **ast:** Fix pending types.mjs file ([a1bbc44](https://github.com/sandros94/open-circle-utils/commit/a1bbc44))
- Fix external dependencies in rolldown configuration ([80de871](https://github.com/sandros94/open-circle-utils/commit/80de871))
- **ast:** Simplify type exports ([197ec73](https://github.com/sandros94/open-circle-utils/commit/197ec73))

### 🌊 Types

- Various improvements ([2a91e6e](https://github.com/sandros94/open-circle-utils/commit/2a91e6e))

### 🏡 Chore

- Init ([c23a324](https://github.com/sandros94/open-circle-utils/commit/c23a324))
- Restructure project folders ([fae1311](https://github.com/sandros94/open-circle-utils/commit/fae1311))
- Cleanup leftovers ([425625e](https://github.com/sandros94/open-circle-utils/commit/425625e))
- Init `formisch-utils` ([dd6ca6e](https://github.com/sandros94/open-circle-utils/commit/dd6ca6e))
- Update deps ([4e9418c](https://github.com/sandros94/open-circle-utils/commit/4e9418c))
- Install and use tsgo ([706813e](https://github.com/sandros94/open-circle-utils/commit/706813e))
- Switch to oxc to lint and format ([b473ecb](https://github.com/sandros94/open-circle-utils/commit/b473ecb))
- Add skills ([0a3a506](https://github.com/sandros94/open-circle-utils/commit/0a3a506))
- Rename `valibot-introspection` to `valibot-utils` ([49a505f](https://github.com/sandros94/open-circle-utils/commit/49a505f))
- Update tsgo ([5ea58af](https://github.com/sandros94/open-circle-utils/commit/5ea58af))
- **release:** Valibot-ast v0.0.1 ([4b9ffb8](https://github.com/sandros94/open-circle-utils/commit/4b9ffb8))
- Update repository field format in package.json files ([d1a12a8](https://github.com/sandros94/open-circle-utils/commit/d1a12a8))
- **release:** Valibot-ast v0.0.1" ([e7a6758](https://github.com/sandros94/open-circle-utils/commit/e7a6758))

### ✅ Tests

- Improve formisch-utils coverage ([ec7e7b9](https://github.com/sandros94/open-circle-utils/commit/ec7e7b9))
- Improve valibot-utils coverage ([4a32cf8](https://github.com/sandros94/open-circle-utils/commit/4a32cf8))
- **valibot-utils:** Make sure requirement is picked up from tranformation actions ([cfcdcfc](https://github.com/sandros94/open-circle-utils/commit/cfcdcfc))
- Add coverage for `valibot-ast/utils` ([81e9f7e](https://github.com/sandros94/open-circle-utils/commit/81e9f7e))
- **valibot-ast:** Exclude unused coverage files ([17c3963](https://github.com/sandros94/open-circle-utils/commit/17c3963))
- **valibot-ast:** Improve to-ast coverage ([7e69202](https://github.com/sandros94/open-circle-utils/commit/7e69202))
- **valibot-ast:** Improve to-schema coverage ([c29f67e](https://github.com/sandros94/open-circle-utils/commit/c29f67e))

### 🤖 CI

- Set pkg-pr-new to publish each package separately ([2c55433](https://github.com/sandros94/open-circle-utils/commit/2c55433))
- Add lint step ([da458ad](https://github.com/sandros94/open-circle-utils/commit/da458ad))
- Setup release scripts ([f0bb7cf](https://github.com/sandros94/open-circle-utils/commit/f0bb7cf))

#### ⚠️ Breaking Changes

- **valibot:** ⚠️  Unwrap utils ([161ea93](https://github.com/sandros94/open-circle-utils/commit/161ea93))
- ⚠️  Make project a monorepo and use pnpm+obuild+vitest ([#1](https://github.com/sandros94/open-circle-utils/pull/1))
- ⚠️  Formisch-utils ([#2](https://github.com/sandros94/open-circle-utils/pull/2))
- ⚠️  Drop `valibot-utils` and restructure `valibot-ast` ([029ca82](https://github.com/sandros94/open-circle-utils/commit/029ca82))
- **valibot-ast:** ⚠️  `astToSchema` implementation ([41b1782](https://github.com/sandros94/open-circle-utils/commit/41b1782))
- ⚠️  `formisch-utils` ([166452b](https://github.com/sandros94/open-circle-utils/commit/166452b))

### ❤️ Contributors

- Sandro Circi ([@sandros94](https://github.com/sandros94))

