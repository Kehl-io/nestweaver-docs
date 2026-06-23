---
title: Monorepo Setup
description: Configure NestWeaver for monorepo projects with multiple packages, cross-package references, and shared configuration.
sidebar:
  order: 2
---

When your project spans multiple repositories or a monorepo with distinct services, NestWeaver can index them into a single graph. Cross-repo dependencies, shared symbols, and feature boundaries become queryable without reading source files in each repo.

## Create an instance config

The instance config declares your repos, how they communicate, and what cross-cutting features span them. Create a `nestweaver-instance.toml` at your project root:

```toml
instance_id = "acme-platform"

[snapshot_storage]
backend = "local"
path = "~/.local/share/nestweaver/acme/snapshots"

[workspace]
backend = "local"
path = "~/.local/share/nestweaver/acme/workspace"

[inference]
endpoint = "http://localhost:11434"
embedding_model = "nomic-embed-text"
summary_model = "qwen2.5-coder:7b"

[git]
credential_method = "gh"

# ── Repositories ──────────────────────────────────────────────────────────

[[repos]]
url = "https://github.com/acme/web-client"

[[repos]]
url = "https://github.com/acme/api-service"

[[repos]]
url = "https://github.com/acme/mobile-app"

[[repos]]
url = "https://github.com/acme/device-firmware"

# ── Cross-repo links ─────────────────────────────────────────────────────

[[links]]
from = "web-client"
to = "api-service"
type = "http-api"
description = "React web app calls REST API"
endpoints = ["/api/users", "/api/devices", "/api/sessions"]

[[links]]
from = "mobile-app"
to = "api-service"
type = "http-api"
description = "React Native app calls REST API"
endpoints = ["/api/users", "/api/devices", "/api/sessions"]

[[links]]
from = "mobile-app"
to = "device-firmware"
type = "ble"
description = "App connects to device via BLE"
identifiers = ["6E400001-B5A3-F393-E0A9-E50E24DCCA9E"]

[[links]]
from = "api-service"
to = "device-firmware"
type = "http-api"
description = "Backend pushes OTA firmware updates"
endpoints = ["/api/firmware/update"]

# ── Feature bundles ───────────────────────────────────────────────────────

[[features]]
name = "device-onboarding"
description = "Device discovery, BLE pairing, cloud registration, initial config"
repos = ["mobile-app", "device-firmware", "api-service"]
entry_points = ["BLEScanner", "pairDevice", "registerDevice", "initConfig"]

[[features]]
name = "user-auth"
description = "Login, signup, OAuth, session management"
repos = ["web-client", "mobile-app", "api-service"]
entry_points = ["LoginForm", "useAuth", "authMiddleware", "refreshToken"]

# ── Projects ──────────────────────────────────────────────────────────────

[[projects]]
name = "device-onboarding"
description = "End-to-end device onboarding: discovery, pairing, registration"
aliases = ["onboarding", "DO"]
vault_folder = "Projects/device-onboarding"
repos = ["mobile-app", "device-firmware", "api-service"]
features = ["device-onboarding"]
components = ["ble-scanner", "device-registry"]
```

Each `[[repos]]` entry needs at minimum a `url`. Optional fields include `sparse` (disable sparse checkout) and `pin_sha` (pin to a specific commit).

## Index into a shared database

Index each repo into the same database file so NestWeaver can resolve references across repository boundaries:

```bash
nestweaver index --repo ./web-client --db ./project.lbug
nestweaver index --repo ./api-service --db ./project.lbug
nestweaver index --repo ./mobile-app --db ./project.lbug
nestweaver index --repo ./device-firmware --db ./project.lbug
```

NestWeaver automatically parses manifest files (`package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`) during indexing. Package names and dependencies feed into cross-repo link detection.

:::tip
After indexing, materialize your config's projects and links into the graph:

```bash
nestweaver materialize-projects --config ./nestweaver-instance.toml --db ./project.lbug
```

:::

## Auto-detect cross-repo links

If you're not sure how your repos relate, `suggest-links` analyzes the graph and proposes relationships at three confidence layers:

```bash
nestweaver suggest-links --db ./project.lbug
```

**Detection layers (in order of confidence):**

1. **Manifest dependencies (high)** — Repo A's manifest declares a dependency on repo B's package name. Direct and authoritative.
2. **Instance config `[[links]]` (authoritative)** — Protocol-level relationships you declare explicitly: HTTP endpoints, BLE UUIDs, shared databases. These can't be auto-detected from code.
3. **IDF-filtered shared symbols (low)** — Symbols with the same name across repos may indicate a shared contract. Common names (`get`, `main`, `config`) and framework patterns are filtered out.

The output is valid TOML you can review and paste into your instance config:

```toml
# Manifest dependency detected (high confidence)
[[links]]
from = "frontend"
to = "backend"
type = "package-dependency"
description = "Depends on @myorg/backend (from manifest)"

# Shared symbol names detected (low confidence)
[[links]]
from = "frontend"
to = "shared-types"
type = "shared-types"
description = "Both repos reference: UserProfile, Session, AuthToken"
```

## Query by project or feature

Once your config is materialized, you can scope queries to a specific project or feature:

```bash
# Get context for an entire project (repos + vault notes + components)
nestweaver project-context device-onboarding --db ./project.lbug

# Get context scoped to a feature spanning multiple repos
nestweaver context --feature device-onboarding \
  --config ./nestweaver-instance.toml \
  --db ./project.lbug

# Search across all indexed repos
nestweaver search "UserService" --db ./project.lbug

# List what's configured
nestweaver list-links --config ./nestweaver-instance.toml
nestweaver list-features --config ./nestweaver-instance.toml
nestweaver list-projects --db ./project.lbug
```

:::tip
Use `--token-budget` to control how much context is returned. This is especially useful when querying across many repos where the combined result set can be large.

```bash
nestweaver project-context device-onboarding --token-budget 5000 --db ./project.lbug
```

:::

## Link types

Use `[[links]]` in your instance config for protocol-level relationships that manifest parsing cannot detect. Any string is accepted as a type, but these are the conventions:

| Type           | Use for                                  |
| -------------- | ---------------------------------------- |
| `http-api`     | REST/HTTP communication between services |
| `grpc`         | gRPC/protobuf communication              |
| `graphql`      | GraphQL API                              |
| `ble`          | Bluetooth Low Energy                     |
| `websocket`    | WebSocket connections                    |
| `shared-db`    | Services sharing a database              |
| `event-bus`    | Message queue, pub/sub, event-driven     |
| `shared-types` | Shared type/schema package               |

Each link supports optional fields for richer context:

```toml
[[links]]
from = "frontend"
to = "backend"
type = "http-api"
description = "Web app calls REST API"
endpoints = ["/api/users", "/api/sessions"]   # API route patterns
identifiers = ["UUID-HERE"]                    # Protocol identifiers (BLE UUIDs, etc.)
contract = "openapi/api.yaml"                  # Path to shared contract/schema
```
