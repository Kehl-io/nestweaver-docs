---
title: Server Mode
description: Run NestWeaver as a centralized team server — index repos once and serve queries to AI agents over gRPC and MCP-over-HTTP, with two-tier org-wide impact analysis.
sidebar:
  order: 5
---

NestWeaver can run as a centralized server that indexes repositories for an entire team and serves queries to AI agents over gRPC and MCP-over-HTTP. Clients keep their fast local graph and transparently augment it with org-wide results from the server.

## Start a server

The server is the daemon run with `--server`. TLS is required for `grpcs://` clients:

```bash
nestweaver daemon --db ./brain.lbug run \
  --server \
  --bind 0.0.0.0:9378 \
  --tls-cert ./tls/server.pem \
  --tls-key ./tls/server-key.pem \
  --auth-token "$NESTWEAVER_AUTH_TOKEN"
```

### Ports

| Port | Protocol | Purpose                                                                                 |
| ---- | -------- | --------------------------------------------------------------------------------------- |
| 9378 | gRPC     | Query API (TCP + TLS)                                                                   |
| 9379 | HTTP     | MCP-over-HTTP for AI agents, plus `/webhook`, `/admin/api/*`, and Prometheus `/metrics` |
| 3000 | HTTP     | Web UI (optional, `nestweaver ui`; 9377 in the macOS `.app`)                            |

The MCP-over-HTTP and metrics port is always the gRPC port + 1 (9379), inheriting the `--bind` IP.

### Docker

```bash
docker compose up -d
```

## Connect a client

Point a local NestWeaver at the server, either per-invocation or via the environment:

```bash
# Explicit
nestweaver connect grpcs://nestweaver.internal:9378 --token "$NESTWEAVER_AUTH_TOKEN"

# Or via environment variable
export NESTWEAVER_UPSTREAM=grpcs://nestweaver.example.com:9378
```

Once an upstream is configured, local queries are automatically augmented with server-side results.

## Two-tier results

When an upstream is available, results distinguish what's local from what's org-wide:

- **`blast_radius`** returns two tiers — `local_impact` (your working copy) and `org_wide_impact` (everything the server has indexed) — so you see downstream effects in repositories you don't have checked out.
- Every response carries **`_meta.sources`** indicating which data sources contributed (local, upstream, or both).
- **`brain_status`** reports `server_mode`, `indexing_active`, `indexing_repo`, and `queue_depth` so a client can tell when the server is mid-index.

:::note
On a server that indexes from bare clones, `read_symbols` may return empty bodies with a `server_note` explaining the limitation — the symbol metadata and relationships are present, but the source span isn't materialized. `regex_search` is trigram-accelerated over the graph store and behaves identically locally and on the server.
:::

## Authentication

The server authenticates clients with a bearer token supplied via `--auth-token` (server) and `--token` / the connect flow (client). Keep the token in an environment variable or secret store; never commit it. TLS is mandatory for `grpcs://` — generate a certificate and key for `--tls-cert` / `--tls-key`.
