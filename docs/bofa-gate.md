# BOFA Gate

**Status: implemented — PR 11 (local gate decision and export preparation).**

The BOFA Gate is a deterministic, local decision engine that evaluates whether BOFA
modules are permitted for the current SOTY session. It does not launch BOFA. It does
not run BOFA modules. It does not contact any external service.

---

## What the BOFA Gate does

Given the current SOTY Score and the selected Route Pack, the gate emits a
`BofaGateDecision` that describes:

- Whether the operator may proceed toward BOFA modules (`allowed / warning / blocked`)
- Which modules are permitted for the selected pack
- Which modules are always disallowed regardless of pack or score
- Reasons for blocking or warnings
- Required preflight checks before any BOFA activity
- A snapshot of the evidence ID used for traceability

The gate runs entirely in the local UI process. No network request is made.

---

## Gate decision model

| SOTY State | `disabled` pack | `gated` pack | `enabled` pack |
|---|---|---|---|
| `SOTY_READY` | `blocked` | `allowed` | `allowed` |
| `SOTY_WARN` | `blocked` | `warning` | `warning` |
| `SOTY_EXPOSED` | `blocked` | `blocked` | `blocked` |
| `SOTY_DIRTY` | `blocked` | `blocked` | `blocked` |
| `SOTY_BLOCKED` | `blocked` | `blocked` | `blocked` |

A missing route pack is treated as `disabled`.

---

## Allowed modules (by integration mode)

Modules are only granted when the verdict is `allowed` or `warning`. A `blocked`
verdict always yields an empty allowed list.

| Module | `disabled` | `gated` | `enabled` |
|---|---|---|---|
| `evidence_review` | — | ✓ | ✓ |
| `defensive_mapping` | — | ✓ | ✓ |
| `detection_mapping` | — | ✓ | ✓ |
| `ioc_enrichment_placeholder` | — | ✓ | ✓ |
| `report_generation` | — | ✓ | ✓ |
| `lab_only_validation` | — | — | ✓ |

---

## Always-disallowed modules

These modules are permanently disallowed regardless of pack mode, SOTY state, or
gate verdict. They appear in every `BofaGateDecision.disallowed_modules` list:

```
exploit_execution
credential_access
persistence
lateral_movement
evasion
destructive_actions
unauthorized_scanning
```

---

## Gate decision type

```typescript
interface BofaGateDecision {
  verdict: "allowed" | "warning" | "blocked";
  route_pack_id: string | null;
  soty_state: SotyState;
  required_evidence_level: EvidenceLevel;
  current_evidence_level: EvidenceLevel;
  allowed_modules: readonly BofaAllowedModule[];
  disallowed_modules: readonly BofaDisallowedModule[];
  blocking_reasons: string[];
  warning_reasons: string[];
  required_preflight_checks: string[];
  evidence_snapshot_id: string | null;
  generated_at: string;
  preflight_passed: boolean;
}
```

---

## BOFA export (`bofa_export.json`)

When the operator prepares a BOFA export, the gate decision is serialised alongside
the evidence snapshot reference into `bofa_export.json`. The file is saved locally
to `~/.sotyroute/runs/<timestamp>_soty/` via the `save_soty_exports` Tauri command.

**What is never written:**

- Query content, search terms, OSINT queries
- Credentials, tokens, cookies, API keys, session headers
- External page content, response bodies, downloaded files
- Clipboard content, raw HTML, user secrets

---

## Safety boundaries

- No external API calls are made
- BOFA is not launched from the gate panel
- No BOFA modules are executed
- No scripts are run
- No system settings are modified
- Filesystem writes go only to `~/.sotyroute/runs/<timestamp>_soty/`
- No user-controlled path or filename is accepted by the Tauri command

---

## Files

- `src/types/bofaGate.ts` — `BofaGateDecision`, `BofaGateVerdict`, `BOFA_ALLOWED_MODULES`, `BOFA_DISALLOWED_MODULES`
- `src/lib/sotyBofaGate.ts` — `buildBofaGateDecision(score, routePack, snapshotId)`
- `src/lib/sotyBofaExport.ts` — `buildBofaExportPayload()`, `renderBofaExportJson()`
- `src/types/sotyBofaExport.ts` — `SotyBofaExportPayload`
- `src/components/soty/SotyBofaGatePanel.tsx` — gate decision display
- `src/components/soty/SotyExportPanel.tsx` — export preparation and save UI
- `src-tauri/src/evidence.rs` — `write_soty_exports()`, `SotyExportSaveResult`
- `src-tauri/src/commands.rs` — `save_soty_exports` Tauri command
