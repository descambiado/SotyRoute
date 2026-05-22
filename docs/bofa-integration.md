# BOFA Integration

[BOFA](https://github.com/descambiado/bofa) is a security automation suite. SotyRoute exposes a stable preflight contract so BOFA workflows can refuse to launch network-touching modules until the operator's posture has been validated.

## Contract (v0.1.0)

Every SotyRoute session writes `bofa_export.json` into the session evidence folder.

### Schema

```json
{
  "producer": "sotyroute-desktop",
  "producer_version": "0.1.0",
  "session_id": "sotyroute-20260521-103045",
  "mode": "observe",
  "profile_name": "authorized-lab",
  "status": "completed",
  "warnings": [
    {
      "code": "no_admin",
      "severity": "info",
      "message": "Running without elevation. v0.1.0 only requires admin for future agent operations."
    }
  ],
  "evidence_path": "C:\\Users\\davyd\\.sotyroute\\runs\\20260521-103045_observe",
  "preflight_passed": true,
  "produced_at": "2026-05-21T10:30:45Z"
}
```

### Fields

| Field | Type | Meaning |
|---|---|---|
| `producer` | string | Always `sotyroute-desktop` for the desktop app. |
| `producer_version` | string | SotyRoute version that wrote the file. |
| `session_id` | string | Stable session identifier. |
| `mode` | enum | `observe` / `tor` / `wireguard` / `socks5` / `lab`. |
| `profile_name` | string | Profile in effect for this session. |
| `status` | enum | `completed` / `failed` / `partial`. |
| `warnings` | array | Structured warnings (code + severity + message). |
| `evidence_path` | string | Absolute path to the session folder. |
| `preflight_passed` | bool | True only if status is `completed` and no `severity: error` warning is present. |
| `produced_at` | string | ISO-8601 UTC timestamp. |

## Suggested BOFA usage

In a BOFA workflow:

```yaml
steps:
  - id: routing-preflight
    type: sotyroute.preflight
    profile: authorized-lab
    require: preflight_passed
  - id: offensive-module
    depends_on: routing-preflight
    when: routing-preflight.preflight_passed == true
```

If `preflight_passed` is `false` (or absent), downstream steps refuse to start.

## Stability

This schema is **v0.1**. Breaking changes will bump the schema version field (to be added in v0.2.0 as `schema: "1"`). Additive fields will not break existing consumers.
