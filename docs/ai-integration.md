# AI & MCP integration

> **Status: planned — nothing in the "Planned" sections below is implemented yet.** What *is* available today is listed under [Available today](#available-today). Written in November 2026; the Model Context Protocol and its SDKs move quickly, so every external detail here must be re-verified when implementation starts.

## Principle: AI stays outside

SotyRoute never calls an AI. There are no LLM calls, no external AI APIs and no telemetry in the app, and that does not change. The integration runs in the opposite direction: **an AI agent calls SotyRoute** — through a local [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server — to ask deterministic, explainable questions *before* it acts.

## Why

AI agents increasingly drive security tooling. What they usually lack is a cheap, local, auditable way to answer: *is the route and host posture acceptable? Is this target inside the scope the operator declared? Is evidence being kept?* SotyRoute's engine already answers those for humans; MCP would make the same answers available to agents, with the same reasons and recommended fixes.

## Planned tool surface (proposal)

Every tool would be **read-only, idempotent and closed-world** (no network access), and return structured JSON with a published schema.

| Tool | Purpose | Depends on |
|---|---|---|
| `soty_score` | Compute a SOTY Score and its deductions from supplied signals | engine extracted as a library |
| `soty_explain_deduction` | Explain one deduction: reason, severity, recommended fix | engine extracted as a library |
| `soty_route_packs` | List or get Route Packs | engine extracted as a library |
| `soty_route_card` | Build a Route Card for a mission type | engine extracted as a library |
| `soty_osint_catalog` | Query the local OSINT resource catalog (performs no lookups) | engine extracted as a library |
| `soty_bofa_gate` | Deterministic gate decision from a score and a route pack | engine extracted as a library |
| `soty_evidence_snapshot` | Assemble an evidence snapshot from supplied state | engine extracted as a library |
| `soty_scope_check` | Check a declared target against a profile's allow/block lists (exact match) | Scope implementation — see the [Scope design](soty-scope-architecture.md) |

Later, and only after a separate design review: tools that run the real read-only Guards (Host / Route / Evidence) on the operator's machine, and read-only access to local evidence sessions confined to the evidence directory.

## Security model (planned)

- **Local only.** stdio transport: no listening socket, no network, no remote calls.
- **Read-only.** No writes, no process execution, no system mutation. Tools would carry read-only / idempotent / closed-world annotations — which, per the MCP specification, hosts must treat as untrusted hints, so safety never depends on them.
- **Consent stays with the host.** The MCP specification has hosts obtain user consent before invoking tools; SotyRoute adds no bypass.
- **No secrets in, no secrets out.** Tools take posture signals and declared scope lists, not credentials, and outputs keep the redaction guarantees of the evidence snapshot.

## Limits — read this before relying on it

- **Advisory, not enforcement.** A tool an agent *chooses* to call can inform its decisions; it cannot stop it from acting. Enforcement needs an agent harness or gateway that *requires* the check.
- **Declared scope only.** "In scope" means "matches the lists the operator declared". SotyRoute cannot verify real-world authorization, ownership, or that a target is what it claims to be.
- **Garbage in, garbage out.** When the caller supplies the signals instead of a Guard measuring them, the score is only as honest as that input. The planned outputs state which signals were supplied and which were measured.

## Distribution plan (planned)

An npm package runnable with `npx`; an [MCPB bundle](https://claude.com/docs/connectors/building/mcpb) for one-click install in Claude Desktop; a listing in the official MCP Registry (a preview service at the time of writing); copy-paste configuration for Claude Desktop, Claude Code, Cursor and VS Code. None of this exists yet.

## Available today

- [`AGENTS.md`](../AGENTS.md) and [`llms.txt`](../llms.txt) — for AI coding assistants working on this repository: build and test commands, architecture conventions, safety rules and the PR format.
- Plain-JSON outputs an agent can read: `soty_evidence.json`, `bofa_export.json` and `sotyhub_export.json` — see [evidence-model.md](evidence-model.md), [bofa-integration.md](bofa-integration.md) and [sotyhub-export.md](sotyhub-export.md).

## Non-goals

No LLM calls from SotyRoute, no autonomous-agent features, no offensive automation, no cloud service, no auto-remediation by an agent.
