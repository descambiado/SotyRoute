# SotyHUB Export

**Status: implemented — PR 11 (local export preparation only; no upload).**

The SotyHUB export produces a structured local summary of one SOTY session suitable
for future SotyHUB integration. In PR 11 the export is saved to the local evidence
directory only. No upload to SotyHUB is performed. No SotyHUB APIs are called.

---

## What the SotyHUB export contains

The export is a single `sotyhub_export.json` file written to
`~/.sotyroute/runs/<timestamp>_soty/`. It captures:

- SOTY Score summary (all sub-scores, state, deduction counts)
- Route Pack summary (id, name, evidence level, BOFA integration mode)
- Mission summary (mission type, recommended mode) — if a Route Card was built
- Host Guard summary (check counts only — no raw host data)
- OSINT summary (resource counts by risk level — no query content)
- BOFA Gate summary (verdict, preflight status, module counts)
- A `public_shareable_summary` string for quick human review
- Redaction guarantees block
- A `never_exported` list documenting what is structurally excluded
- A `limitations` list (e.g., "demo mode — no real checks performed")

---

## Schema

```typescript
interface SotyHubExportPayload {
  export_schema_version: "soty_hub_v1";
  generated_at: string;
  evidence_snapshot_id: string;
  soty_score_summary: { overall_score; state; route_score; host_score; scope_score;
                         intel_score; evidence_score; deductions_count;
                         blocking_deductions_count };
  route_pack_summary: { id; name; evidence_level; bofa_integration_mode } | null;
  mission_summary: { mission_type; recommended_mode } | null;
  host_guard_summary: { status; checks_count; warning_count; fail_count } | null;
  osint_summary: { resources_total; low_risk_count; medium_risk_count;
                   high_risk_count; blocked_count };
  bofa_gate_summary: { gate_decision; preflight_passed; allowed_modules_count;
                       disallowed_modules_count };
  public_shareable_summary: string;
  redaction: { query_content_logged: false; credentials_logged: false;
               tokens_logged: false; cookies_logged: false;
               external_page_content_logged: false; raw_host_data_logged: false;
               osint_query_content_logged: false };
  never_exported: string[];
  limitations: string[];
}
```

---

## What is never exported

The following categories are structurally excluded from the SotyHUB export:

| Category | Detail |
|---|---|
| Query content | OSINT search terms, domain queries, IP lookups |
| Search terms | Any operator-entered search input |
| Credentials | Passwords, tokens, API keys, secrets |
| Cookies | Session cookies, auth cookies |
| External page content | Response bodies, page HTML, downloaded files |
| Raw host data | Real OS state, real network configuration |
| OSINT query content | Individual resource queries made by the operator |
| Clipboard content | Anything written to or read from the clipboard |
| Session auth headers | Authorization headers, bearer tokens |
| User secrets | Any operator-private data not already visible in the UI |

These are listed in the `never_exported` array within every export file.

---

## Redaction guarantees

All seven redaction fields are structurally `false` — they are not computed at runtime.
The `osint_query_content_logged: false` field confirms that OSINT queries made by the
operator are not captured. This field is added to the `SAFE_FIELD_EXCEPTIONS` list in
`sotyEvidenceRedaction.ts` so it is not stripped by `deepStripUnsafeFields`.

---

## Safety boundaries

- No SotyHUB API is called
- No upload is performed
- No network request is made
- Host Guard summary contains only counts — no real OS data is captured
- OSINT summary contains only resource counts — no query content is logged
- Filesystem writes go only to `~/.sotyroute/runs/<timestamp>_soty/`
- No user-controlled path or filename is accepted by the Tauri command

---

## Files

- `src/types/sotyHubExport.ts` — `SotyHubExportPayload`
- `src/lib/sotyHubExport.ts` — `buildSotyhubExportPayload()`, `renderSotyhubExportJson()`
- `src/lib/sotyExportPersistence.ts` — `saveExports()` Tauri invoke wrapper
- `src/components/soty/SotyExportPanel.tsx` — prepare and save UI
- `src-tauri/src/evidence.rs` — `write_soty_exports()`, `SotyExportSaveResult`
- `src-tauri/src/commands.rs` — `save_soty_exports` Tauri command
