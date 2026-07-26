---
title: Daemon Architecture
description: How NestWeaver's daemon enables concurrent access from multiple AI tools and CLI commands via a single database.
sidebar:
  order: 4
---

NestWeaver uses a background daemon process to own the database write lock, enabling multiple AI tools, CLI commands, and IDE integrations to query the same graph concurrently without lock contention. The daemon is the central coordination point — it handles writes, runs the filesystem watcher, generates embeddings, and serves all read queries through a gRPC interface.

## Why a daemon

LadybugDB uses a **single-writer, multiple-reader** (SWMR) architecture. Only one process can hold the write lock at a time, but any number of readers can query concurrently. Without a daemon, each CLI invocation or MCP server would need to compete for the write lock, causing failures when multiple tools try to access the same database.

The daemon solves this by:

- **Owning the write lock** exclusively — all mutations (indexing, embedding generation, interaction tracking) go through the daemon
- **Serving reads via gRPC** — multiple clients query the same database concurrently without blocking each other
- **Running background tasks** — the filesystem watcher and embedding generation run inside the daemon process, keeping the graph current without manual intervention

## Lifecycle

The daemon follows a hands-off lifecycle — you rarely need to manage it directly.

**Auto-start:** The first CLI command that needs the database (e.g., `nestweaver context`, `nestweaver mcp`) automatically starts a daemon if one isn't already running. The `nestweaver-client` crate uses an `flock`-based mechanism to prevent race conditions when multiple processes try to start the daemon simultaneously.

**Idle timeout:** The daemon self-terminates after 1 hour of inactivity (no active connections or in-flight queries). This prevents orphaned daemon processes from consuming resources on machines where NestWeaver isn't actively in use.

**Version mismatch restart:** When a client connects to a running daemon and detects that the daemon binary is an older version than the client, it automatically restarts the daemon with the newer binary. This ensures that a newly installed CLI takes effect without manual daemon management.

**macOS lifecycle:** `daemon start` and client autostart register a launchd agent
that owns a foreground Aqua-session process. An explicit `daemon run` remains in
the invoking foreground. Neither path forks or self-daemonizes because that
would break service-manager process ownership and can invalidate inherited
process state. Socket availability does not mean embeddings are ready: the
selected backend must complete a real inference and return a non-empty, finite
vector before readiness is published.

```bash
# Check daemon status
nestweaver daemon status

# Manually stop the daemon
nestweaver daemon stop

# Manually start (rarely needed — auto-start handles this)
nestweaver daemon --db <path> start --config <path>
```

## Communication

The daemon communicates with clients over **gRPC on a Unix domain socket**. Socket paths are derived from a stable hash of the database path, placed under `$XDG_RUNTIME_DIR/nestweaver/<instance>/` on Linux or `~/.local/state/nestweaver/<instance>/` on macOS.

The `nestweaver-client` crate provides the client interface. It handles connection establishment, auto-start, version checking, and reconnection transparently. Most users never interact with the gRPC layer directly — the CLI and MCP server both use `nestweaver-client` internally.

The daemon dispatches read RPCs through the same tool dispatch layer used by the MCP server, avoiding any duplication of business logic. Every read query available via MCP is also available through the daemon's gRPC interface.

:::tip[Token efficiency]
When making multiple NestWeaver queries in a subagent or script, use the CLI (`nestweaver context`, `nestweaver search`) rather than MCP tools. The CLI connects to the daemon via gRPC and returns precomputed answers without loading tool schemas into context — typically 40-60% fewer tokens per query.
:::

## What runs inside the daemon

The daemon is more than a database proxy. It hosts several background subsystems:

- **Filesystem watcher** — monitors indexed repositories for changes and triggers incremental re-indexing with debouncing. Started via `nestweaver watch` or automatically when the daemon launches with watch mode enabled.
- **Embedding generation** — loads the configured local or external backend, proves full inference before readiness, and generates vector embeddings for symbols, notes, and headings. A Metal-enabled macOS build uses Metal according to the configured device policy.
- **BM25 index** — maintains the Tantivy full-text search index as a sidecar alongside the database.
- **Git activity scoring** — computes file-level churn scores and co-change pairs from git history, writing results to sidecar files.
- **PageRank cache** — loads and maintains cached global PageRank scores.

The daemon maintains two `GraphStore` handles: a read-write handle for mutations and a separate read-only handle for all read queries, ensuring that write operations don't block concurrent reads.

## CI and testing mode

In environments where a long-running daemon is inappropriate (CI pipelines, one-shot scripts, testing), you can bypass the daemon entirely:

```bash
# Direct database access — no daemon needed
nestweaver context "UserService" --no-daemon

# Or via environment variable
NESTWEAVER_NO_DAEMON=1 nestweaver context "UserService"
```

In `--no-daemon` mode, the CLI opens the database directly in the current process. This works for read-only queries but has limitations:

- **No concurrent writes** — if another process holds the write lock, the command will fail
- **No background tasks** — no filesystem watcher, no embedding generation
- **WAL considerations** — concurrent access without the daemon's coordination can lead to stale reads

Use `--no-daemon` for CI jobs and scripted analysis where only one process accesses the database at a time.

## Embedding status and troubleshooting

Inspect compile/runtime capability separately from the selected daemon backend:

```bash
nestweaver diagnostics capabilities --json
nestweaver daemon --db <path> status
nestweaver brain status --db <path> --json
```

Runtime status includes `state`, `backend`, `requested_device`,
`selected_device`, `model_id`, `error`, `metal_compiled`, and `fallback_used`.
A local backend is ready only after `selected_device` is `metal` or `cpu` and
`fallback_used` remains `false`. A ready external backend has an empty
`selected_device` because it has no local device.

| Observation                                    | Meaning                                                                                                                       | Corrective action                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `metal_compiled = false`                       | The binary has no Metal backend. `auto` selects CPU; explicit `metal` fails.                                                  | Install a Metal-enabled macOS release archive or rebuild with `cargo install --locked --path . --features metal`.                                                                 |
| `selected_device = ""`                         | Expected for an external backend. For a local backend, embedding is still loading or failed.                                  | Check `backend`, `state`, and `error`; do not infer a local device until state is `ready`.                                                                                        |
| Error names a missing model-cache artifact     | The cache-only daemon could not resolve a required model file.                                                                | Stop the daemon, run `nestweaver embed --db <path> --local --model-id <id> --cache-dir <path>` with the configured values, restart with `--config`, and recheck status.           |
| External endpoint readiness or request failure | The selected external backend is unavailable. No local model is attempted.                                                    | Restore the endpoint or credentials, or remove `external_endpoint`, replace the stored embeddings with a stopped-daemon direct local `--force` pass, and restart with `--config`. |
| `"semantic"` appears in `degraded_components`  | Semantic retrieval was requested but no ready model/vector path was available. Graph, PPR, and BM25 results remain available. | Inspect embedding status and populate or repair the model/embeddings. The response reports `semantic_applied = false` until semantic retrieval succeeds.                          |

When intentionally switching from an external backend to a local model, use
the same model, cache, and config paths throughout:

```bash
DB=/absolute/path/to/brain.lbug
CONFIG=/absolute/path/to/nestweaver-instance.toml
MODEL=sentence-transformers/all-MiniLM-L6-v2
CACHE="$HOME/.cache/nestweaver/models"
nestweaver daemon --db "$DB" stop
# Remove external_endpoint from "$CONFIG" before the forced local pass.
nestweaver embed --db "$DB" --local --model-id "$MODEL" --cache-dir "$CACHE" --force
nestweaver daemon --db "$DB" start --config "$CONFIG"
nestweaver brain status --db "$DB" --json
```

## macOS app

On macOS, the recommended way to run NestWeaver is the native `.app` bundle. It provides a menubar-only application (no Dock icon) that manages the daemon lifecycle:

- **Menubar status icon** — quick access to the web UI and daemon status
- **Metal GPU acceleration** — the app installs a non-forking launchd Aqua agent; the daemon reports Metal ready only after a full model inference probe succeeds
- **Automatic lifecycle** — starts or reuses the shared launchd service; it can persist across app quits and exits normally after its idle timeout
- **Crash recovery** — launchd restarts the daemon after an unexpected crash
- **Daemon coexistence** — detects if a daemon is already running (via CLI or launchd) and connects to it instead of starting a second instance
- **Web UI** at `http://127.0.0.1:9377` — opens automatically on launch

```bash
# Build from source
bash app/build.sh
open target/release/NestWeaver.app
```

The `.app` bundle is currently built from source; no `.app` or DMG is published
in GitHub Releases yet. On Linux and headless macOS environments, use
`nestweaver daemon start` or let auto-start handle it.

## Sidecar files

The daemon loads and manages several sidecar files stored alongside the main `.lbug` database. These files use a naming convention of `<database-name>.<suffix>`:

| File                  | Description                                       |
| --------------------- | ------------------------------------------------- |
| `*.lbug`              | Main LadybugDB database (graph nodes and edges)   |
| `*.pagerank.json`     | Cached global PageRank scores                     |
| `*.manifests.json`    | Parsed package manifests for workspace resolution |
| `*.git-activity.json` | File-level churn scores from git history          |
| `*.cochanges.json`    | Co-change file pairs with Jaccard scores          |
| `*.tantivy/`          | BM25 full-text search index directory             |
| `*.embeddings/`       | Vector embedding files for semantic search        |
| `*.interactions.json` | Agent interaction memory (opt-in)                 |

Sidecar files are loaded on daemon startup and updated as background tasks complete. They can be safely deleted — the daemon will regenerate them on next startup (though this may take time for large codebases).
