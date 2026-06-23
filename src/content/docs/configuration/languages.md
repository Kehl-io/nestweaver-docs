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
| Bash          |         ✓         |           ✓           |           —           |
| C             |         ✓         |           ✓           |           ✓           |
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

## Edge types

NestWeaver tracks four edge types between symbols:

- **CALLS** — function/method invocations
- **IMPORTS** — import/require/use statements
- **USES** — type references, variable access, inheritance
- **ACCESSES** — field and property access

Each edge carries a confidence score. The `--intent` flag on `nestweaver context` adjusts per-edge-type weights to surface the most relevant symbols for your task.

## Adding language support

Language grammars are defined as Tree-sitter query files in the `queries/` directory. Each language needs:

1. **`<lang>.scm`** — symbol extraction and call/import patterns (required)
2. **`<lang>_types.scm`** — type binding patterns for type-aware resolution (optional)

After adding query files, rebuild NestWeaver and re-index your repository:

```sh
cargo build --release
nestweaver index --repo .
```

Languages without a `_types.scm` file still get full symbol extraction and cross-file resolution. The types file adds the ability to resolve method calls through type bindings and class hierarchies.
