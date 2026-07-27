# SOTY Evidence Model

**Status: implemented — PR 10 (filesystem persistence live; PR 9 frontend snapshot + renderers).**

The SOTY Evidence Model describes what a SOTY Dashboard session captures as local evidence.
It is the basis for `soty_evidence.json` and `soty_evidence.md` outputs that will be written
to the local evidence directory when persistence ships.

---

## What is a SOTY Evidence Snapshot?

A `SotyEvidenceSnapshot` is a structured, redacted record of one SOTY Dashboard session. It
captures the operator's readiness posture at the moment of generation:

- The SOTY Score (overall + five sub-scores, state, deduction counts)
- The selected Route Pack (id, evidence level, BOFA integration mode)
- The generated Route Card (mission, mode, required checks, scope requirements)
- The Host Guard summary (check counts, overall status, demo mode flag)
- The OSINT Navigator catalog summary (resource counts by risk level)
- Warnings extracted from high-severity deductions
- Recommended fixes de-duplicated from deductions
- Operational limitations
- Redaction guarantees

---

## What is never captured

The evidence model is designed around **what it must never include**:

| Category | Not captured |
|---|---|
| Query content | OSINT search terms, domain queries, IP lookups |
| Credentials | Passwords, API keys, tokens, secrets |
| Session data | Cookies, session tokens, auth headers |
| External content | Page contents, response bodies, downloaded files |
| Clipboard content | Anything written to or read from the clipboard |
| Personal data | Only operator-selected labels already visible in the UI |

These exclusions are enforced at three levels:
1. **Type system** — `SotyEvidenceRedactionGuarantees` has only `false`-typed fields.
2. **Builder** — `buildEvidenceSnapshot()` does not accept or capture unsafe inputs.
3. **Serializer** — `renderEvidenceJson()` calls `deepStripUnsafeFields()` before serialization.

---

## Redaction guarantees

Every snapshot includes a `redaction` object:

```json
{
  "redaction": {
    "query_content_logged": false,
    "external_page_content_logged": false,
    "credentials_logged": false,
    "tokens_logged": false,
    "cookies_logged": false
  }
}
```

All values are structurally `false` — they are not computed at runtime.

---

## Schema

```typescript
interface SotyEvidenceSnapshot {
  id: string;                         // UUID or fallback random ID
  generated_at: string;               // ISO-8601
  schema_version: "1";
  source: "soty_dashboard";
  operator_label: string | null;      // optional operator-supplied label
  demo_mode: boolean;                 // always true in PR 9
  demo_preset: string | null;         // active demo preset key
  soty_score: SotyEvidenceScoreSummary;
  route_pack: SotyEvidenceRoutePackSummary | null;
  route_card: SotyEvidenceRouteCardSummary | null;
  host_guard: SotyEvidenceHostGuardSummary | null;
  osint: SotyEvidenceOsintSummary;
  warnings: string[];                 // high/critical deduction reasons
  recommended_fixes: string[];        // de-duplicated fix titles
  limitations: string[];
  redaction: SotyEvidenceRedactionGuarantees;
}
```

---

## Outputs

| Output | Status | Description |
|---|---|---|
| In-memory snapshot | ✅ PR 9 | `SotyEvidenceSnapshot` object in React state |
| JSON preview | ✅ PR 9 | `renderEvidenceJson()` — copy to clipboard |
| Markdown preview | ✅ PR 9 | `renderEvidenceMarkdown()` — copy to clipboard |
| `soty_evidence.json` file | ✅ PR 10 | Written to `~/.sotyroute/runs/<timestamp>_soty/` |
| `soty_evidence.md` file | ✅ PR 10 | Written to `~/.sotyroute/runs/<timestamp>_soty/` |
| `bofa_export.json` file | ✅ PR 11 | Written to `~/.sotyroute/runs/<timestamp>_soty/` |
| `sotyhub_export.json` file | ✅ PR 11 | Written to `~/.sotyroute/runs/<timestamp>_soty/` |

---

## Files

**PR 9 (frontend snapshot + renderers)**
- `src/types/sotyEvidence.ts` — all snapshot types
- `src/lib/sotyEvidenceBuilder.ts` — `buildEvidenceSnapshot()` pure builder
- `src/lib/sotyEvidenceRedaction.ts` — `isUnsafeFieldName()`, `deepStripUnsafeFields()`
- `src/lib/sotyEvidenceMarkdown.ts` — `renderEvidenceMarkdown()` pure renderer
- `src/lib/sotyEvidenceJson.ts` — `renderEvidenceJson()` sorted/stable serializer
- `src/components/soty/SotyEvidencePanel.tsx` — dashboard UI panel

**PR 10 (filesystem persistence)**
- `src-tauri/src/evidence.rs` — `write_soty_evidence()`, `SotyEvidenceSaveResult`, `validate_soty_dir_name()`
- `src-tauri/src/commands.rs` — `save_soty_evidence` Tauri command
- `src/lib/sotyEvidencePersistence.ts` — `saveEvidenceSnapshot()` TypeScript wrapper

**PR 11 (BOFA Gate + SotyHUB export)**
- `src/types/bofaGate.ts` — extended `BofaGateDecision`, module lists
- `src/types/sotyBofaExport.ts` — `SotyBofaExportPayload`
- `src/types/sotyHubExport.ts` — `SotyHubExportPayload`
- `src/lib/sotyBofaGate.ts` — `buildBofaGateDecision()` deterministic gate engine
- `src/lib/sotyBofaExport.ts` — `buildBofaExportPayload()`, `renderBofaExportJson()`
- `src/lib/sotyHubExport.ts` — `buildSotyhubExportPayload()`, `renderSotyhubExportJson()`
- `src/lib/sotyExportPersistence.ts` — `saveExports()` Tauri invoke wrapper
- `src/lib/sotyEvidenceRedaction.ts` — `SAFE_FIELD_EXCEPTIONS` updated with `osint_query_content_logged`
- `src/components/soty/SotyBofaGatePanel.tsx` — gate decision display
- `src/components/soty/SotyExportPanel.tsx` — export prepare + save UI
- `src-tauri/src/evidence.rs` — `write_soty_exports()`, `SotyExportSaveResult`
- `src-tauri/src/commands.rs` — `save_soty_exports` Tauri command

---

## Follow-up PRs

- Future — OSINT opened-resource tracking: record resource metadata per opened resource when the operator explicitly opens one.
