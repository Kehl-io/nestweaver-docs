---
title: What NestWeaver is
description: NestWeaver is a local knowledge graph of your code and notes, queried by you and by AI agents.
sidebar:
  order: 0
---

NestWeaver reads a repository, builds a graph of symbols and how they connect, and answers from that graph. The database is a file on your machine, `./nestweaver.lbug` by default when you index the repo you are standing in.

You use it three ways. They read the same database.

| Surface | You use it to                                         | Start with                    |
| ------- | ----------------------------------------------------- | ----------------------------- |
| CLI     | Look something up yourself, or from a script          | `nestweaver context <symbol>` |
| MCP     | Let the agent in your editor query the graph          | `nestweaver setup`            |
| Web UI  | See the graph, the source, and the neighbors together | `nestweaver ui`               |

![Selecting a function in the NestWeaver web UI shows its source and the functions it calls](/images/web-ui-symbol.png)

Selecting `run_query` in the sample above opens its source in the evidence panel and lists `parse_source` and `search_index` as callees. That is the same neighborhood `nestweaver context run_query` returns in the terminal.

## What a query is

A query is a name, a file path, or a diff. It is not a chat.

- **A symbol name** goes to `context` or `search`. `search` matches names. `context` walks the graph around an exact name.
- **A file path** goes to `nestweaver context path/to/file.rs`.
- **A question in prose** goes to `nestweaver investigate "how indexing works"`.
- **A pull request** goes to `pr-impact` and `affected-tests`.

## What it does not do

NestWeaver does not replace your editor, and it does not send your repository to a hosted index. The graph stays in the database file you created. The web UI is a local server.

## Next

[Install](/getting-started/), then follow the [Quick Start](/getting-started/quick-start/). The [Web UI](/web-ui/) page is the tour of the screenshots.
