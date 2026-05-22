# SotyHUB Integration

SotyHUB is a workflow / lab / evidence platform for authorized security operations. SotyRoute produces a per-session `sotyhub_export.json` that SotyHUB can ingest to attach routing evidence to a lab execution record.

## Contract (v0.1.0)

### Schema

```json
{
  "producer": "sotyroute-desktop",
  "producer_version": "0.1.0",
  "lab_id": null,
  "execution_id": "sotyroute-20260521-103045",
  "operator": "@descambiado",
  "profile_name": "authorized-lab",
  "mode": "observe",
  "evidence_bundle": "C:\\Users\\davyd\\.sotyroute\\runs\\20260521-103045_observe",
  "report": "evidence.md",
  "status": "completed",
  "warnings_count": 1,
  "produced_at": "2026-05-21T10:30:45Z"
}
```

### Fields

| Field | Type | Meaning |
|---|---|---|
| `producer` | string | `sotyroute-desktop`. |
| `producer_version` | string | SotyRoute version. |
| `lab_id` | string \| null | Filled in by SotyHUB on ingestion. SotyRoute leaves it null. |
| `execution_id` | string | Session identifier (matches BOFA export). |
| `operator` | string | From profile `owner`. |
| `profile_name` | string | Profile in effect. |
| `mode` | enum | `observe` / `tor` / `wireguard` / `socks5` / `lab`. |
| `evidence_bundle` | string | Absolute path to session folder. |
| `report` | string | Filename of the human-readable Markdown report. |
| `status` | enum | `completed` / `failed` / `partial`. |
| `warnings_count` | integer | Number of warnings emitted. |
| `produced_at` | string | ISO-8601 UTC timestamp. |

## Suggested SotyHUB usage

SotyHUB lab session adapter (planned v0.4.0):

1. Operator runs SotyRoute in a chosen profile.
2. SotyHUB lab session ingests `sotyhub_export.json` from the operator's machine (uploaded manually in v0.1.0, automated later).
3. Lab session record gains:
   - `routing_evidence_id`
   - `routing_status`
   - `routing_warnings`
   - `routing_report_url` (link to uploaded `evidence.md`)
4. Lab session enforces policy: cannot mark "ready to operate" without a recent SotyRoute evidence bundle matching the lab profile.

## Stability

Same versioning rules as the BOFA contract — additive changes are non-breaking; breaking changes will bump an explicit `schema` field added in v0.2.0.
