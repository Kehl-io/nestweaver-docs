---
title: Language Support
description: NestWeaver supports 32 programming languages via Tree-sitter. See the full language support matrix and what each language provides.
sidebar:
  order: 2
---

NestWeaver supports 32 programming languages through Tree-sitter grammars. Every language gets symbol extraction and cross-file resolution out of the box, and 21 of them also get type-aware call resolution that can trace `obj.method()` to the correct target class via AST-extracted type bindings.

Vue and Svelte files are parsed by extracting their `<script>` blocks and applying the JavaScript/TypeScript grammars, so they inherit the same resolution capabilities.

## Language support matrix

Languages with a `_types.scm` query file get full type-aware resolution (annotations, constructors, `self`/`this`, return types). Languages without one still get accurate symbol extraction and cross-file import resolution.

| Language      | Symbol Extraction | Cross-File Resolution | Type-Aware Resolution |
| ------------- | :---------------: | :-------------------: | :-------------------: |
| Astro         |         ✓         |           ✓           |           —           |
| Bash          |         ✓         |           ✓           |           —           |
| C             |         ✓         |           ✓           |           ✓           |
| COBOL         |         ✓         |           ✓           |           —           |
| C++           |         ✓         |           ✓           |           ✓           |
| C#            |         ✓         |           ✓           |           ✓           |
| Dart          |         ✓         |           ✓           |           ✓           |
| Elixir        |         ✓         |           ✓           |           ✓           |
| Fortran       |         ✓         |           ✓           |           —           |
| Go            |         ✓         |           ✓           |           ✓           |
| Groovy        |         ✓         |           ✓           |           ✓           |
| HCL           |         ✓         |           ✓           |           —           |
| Java          |         ✓         |           ✓           |           ✓           |
| JavaScript    |         ✓         |           ✓           |           ✓           |
| Julia         |         ✓         |           ✓           |           —           |
| Kotlin        |         ✓         |           ✓           |           ✓           |
| Lua           |         ✓         |           ✓           |           ✓           |
| Objective-C   |         ✓         |           ✓           |           ✓           |
| Pascal        |         ✓         |           ✓           |           ✓           |
| PHP           |         ✓         |           ✓           |           ✓           |
| PowerShell    |         ✓         |           ✓           |           ✓           |
| Python        |         ✓         |           ✓           |           ✓           |
| Ruby          |         ✓         |           ✓           |           ✓           |
| Rust          |         ✓         |           ✓           |           ✓           |
| Scala         |         ✓         |           ✓           |           ✓           |
| SQL           |         ✓         |           ✓           |           —           |
| Svelte        |         ✓         |           ✓           |           ✓           |
| Swift         |         ✓         |           ✓           |           ✓           |
| SystemVerilog |         ✓         |           ✓           |           ✓           |
| TypeScript    |         ✓         |           ✓           |           ✓           |
| Vue           |         ✓         |           ✓           |           ✓           |
| Zig           |         ✓         |           ✓           |           —           |

**Symbol Extraction** — functions, classes, methods, types, constants, and module declarations are parsed from source and stored as graph nodes.

**Cross-File Resolution** — import/export statements are followed to connect symbols across files. NestWeaver resolves monorepo workspace packages and tsconfig path aliases automatically.

**Type-Aware Resolution** — AST-extracted type bindings (annotations, constructors, `self`/`this`, return types) let NestWeaver resolve `obj.method()` calls to the correct class, even through inheritance chains (MRO walk, depth 5, cycle-safe).

## Manifest parsing

NestWeaver parses 12 package manifest formats to discover project dependencies, entry points, and monorepo workspace boundaries:

| Manifest           | Ecosystem                                            |
| ------------------ | ---------------------------------------------------- |
| `package.json`     | JavaScript / TypeScript (npm, yarn, pnpm workspaces) |
| `go.mod`           | Go                                                   |
| `Cargo.toml`       | Rust (workspace members)                             |
| `pyproject.toml`   | Python                                               |
| `requirements.txt` | Python                                               |
| `composer.json`    | PHP                                                  |
| `Gemfile`          | Ruby                                                 |
| `pubspec.yaml`     | Dart / Flutter                                       |
| `Package.swift`    | Swift                                                |
| `*.csproj`         | C# / .NET                                            |
| `build.gradle.kts` | Kotlin / Java (Gradle)                               |
| `CMakeLists.txt`   | C / C++ (CMake)                                      |

Manifest data feeds into dead code detection (identifying entry points) and cross-file resolution (workspace package boundaries).

## Import and call resolution by language

A few languages resolve imports through their own module system rather than file names:

- **Go** — imports resolve through `go.mod`, `go.work` and local `replace` directives, and an import covers every file of the package. Methods are attached to their receiver type, so typed method calls and `Type::method` names resolve. Build-tag variants of a function are all treated as callees, except files marked `//go:build ignore` (or `// +build ignore`), which are left out as `go build` leaves them out.
- **Python** — `from . import mod`, aliased imports, and names re-exported through a package's `__init__.py` resolve to their definitions.
- **Java and Kotlin** — imports resolve by the `package` declaration, so a file does not have to be named after the class it defines. A name follows the language's precedence: a single-type import wins over a type in the same package, which wins over an on-demand (`*`) import. A single-type import brings in only the declaration it names.
- **JavaScript and TypeScript** — `.mjs` and `.cjs` files are indexed as JavaScript and `.mts` and `.cts` as TypeScript. A TypeScript `@decorator` is a reference to its function.
- **Rust** — turbofish calls (`parse::<T>()`) and trait default methods resolve.

Across languages, a method call on a call or `new` receiver (`new K().m()`, `K.make().m()`, chained calls) resolves only when every step of the receiver chain has a known type: each call must declare a return type defined in the repository, or plainly return `Name(..)`, `new Name(..)` or `cls(..)`, and the method must belong to that type or a supertype of it. A call on a library return type (`Optional`, `List`, `Promise`, an array) gets no edge, and shapes the resolver cannot type safely (Kotlin and Scala expression-body factories, Ruby implicit returns, multi-line returns, a method returning `self`) are left unresolved rather than guessed. Separately, `new Foo()` creates a call edge to the constructor in Java, C#, PHP, C++, Scala, Groovy and Dart. Edges like these change with the resolver generation, so re-index with `nestweaver index --repo <path> --force` after upgrading to a release that bumps it; `nestweaver stale-check` tells you when.

### Go resolution in 12.2.3

Typed slice ranges, supported inferred slice declarations and named factory
returns preserve the declaring package and type owner. Factory-call receiver
chains and callers of recreated package members recover their call edges during
incremental indexing. Initializer bindings end with their `if` or `switch`, and
case/default bindings remain within their clauses, so a real local shadow does
not suppress later package or outer-receiver calls. Unsupported receiver forms
remain unresolved; parenthesized ordinary value composite literals are not yet
inferred. Existing graphs need [one forced re-index](/cli/indexing/#upgrading-to-1223).

## Edge types

NestWeaver tracks six edge types between symbols, each with a default weight used by Personalized PageRank:

| Edge Type              | Weight | Description                                    |
| ---------------------- | ------ | ---------------------------------------------- |
| **CALLS**              | 1.0    | Function/method invocations, JSX component use |
| **EXTENDS/IMPLEMENTS** | 0.9    | Class inheritance, interface implementation    |
| **IMPORTS**            | 0.7    | Import/require/use statements                  |
| **USES**               | 0.5    | Type references, variable access               |
| **ACCESSES**           | 0.4    | Field and property access                      |
| **MEMBER_OF/INCLUDES** | 0.2    | Module membership, file includes               |

Each edge also carries a confidence score (0.0–1.0) based on resolution quality. The `--intent` flag on `nestweaver context` adjusts per-edge-type weights to surface the most relevant symbols for your task.

## Adding language support

Language grammars are defined as Tree-sitter query files in the `queries/` directory. Each language needs:

1. **`<lang>.scm`** — symbol extraction and call/import patterns (required)
2. **`<lang>_types.scm`** — type binding patterns for type-aware resolution (optional)

After adding query files, rebuild NestWeaver and re-index your repository:

```sh
cargo build --release
nestweaver index --repo . --force
```

Languages without a `_types.scm` file still get full symbol extraction and cross-file resolution. The types file adds the ability to resolve method calls through type bindings and class hierarchies.

### PHP and Scala in 12.2.4

PHP free-function calls resolve by namespace across repository directories,
including `use function` aliases and namespace aliases; duplicate candidates are
left unresolved. Declaration changes conservatively revisit PHP callers. A
method call is not treated as a free function merely because names match.
This does not add general factory-return type inference or dynamic-call support.
Scala grammar-dependent cache invalidation recovers declarations such as local
case classes and Scala 2 `export` identifiers. Resolver generation 19 / parsed
cache 13 require a forced repository index after upgrading, including unchanged
repositories; see [upgrade steps](/cli/indexing/#upgrading-to-1224).
