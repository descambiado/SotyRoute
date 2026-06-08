# SOTY Score

> **Status: design spec — not implemented in v0.2.x.** The deterministic scoring engine is
> planned for the v0.3.0 SOTY track (PR 3). Types land in PR 2. This document describes the
> intended behaviour so the schema and engine can be built against a stable contract.

The **SOTY Score** answers one question before you operate: *are you SOTY-ready?*

It is a readiness score, not a security guarantee. A high score means your routing posture, host
posture, scope, intel and evidence settings are consistent with disciplined operation. It does
**not** mean you are anonymous, clean, or safe — see [docs/legal-scope.md](legal-scope.md) and
[docs/threat-model.md](threat-model.md).

## 1. Sub-scores

The Overall SOTY Score is composed from five explainable sub-scores. Each is `0–100`.

| Sub-score | Question it answers | Primary signals (existing today) |
|---|---|---|
| **Route Score** | Where is my traffic going, and is the tunnel what I think it is? | Doctor route/DNS/gateway/interface checks and tunnel detection in `system.rs` |
| **Host Score** | Is my workstation in a defensible posture? | Host Guard posture checks *(planned, PR 7)* |
| **Scope Score** | Am I bound to authorized targets only? | Profile `allowed_targets` / `blocked_targets` in `profiles.rs` |
| **Intel Score** | Am I using OSINT sources responsibly and within policy? | Ethical OSINT Navigator category policy *(planned, PR 8)* |
| **Evidence Score** | Will this session be auditable? | Evidence pipeline in `evidence.rs` (`session.json`, `evidence.md`, exports) |
| **Overall SOTY Score** | Am I SOTY-ready overall? | Weighted roll-up of the five sub-scores |

Sub-scores that depend on not-yet-shipped modules (Host, Intel) will report a neutral
"not assessed" state until those modules land, rather than inflating or deflating the overall
score.

## 2. States

The Overall SOTY Score maps to one of five states. The state — not the raw number — is what the
dashboard leads with.

| State | Meaning | Operator action |
|---|---|---|
| `SOTY_READY` | Route, scope and evidence are consistent with disciplined operation. | Proceed within scope. |
| `SOTY_WARN` | Operational but with non-blocking issues worth reviewing. | Review warnings; fix before high-stakes work. |
| `SOTY_EXPOSED` | A posture problem likely leaks who/where you are (e.g. unexpected public IP, DNS leak). | Fix the exposure before touching external sources. |
| `SOTY_DIRTY` | The host or route shows signs that make it unsafe to operate from. | Investigate the host; do not connect to labs. |
| `SOTY_BLOCKED` | A hard requirement failed (e.g. scope invalid, evidence disabled for a gated action). | Resolve the blocker; gated actions stay disabled. |

State naming reuses the existing UI status vocabulary where possible: the dashboard renders these
through the existing `StatusBadge` variants (`ok` / `warn` / `info` / `danger` / `idle`).

## 3. Explainability

Every deduction must be explainable. The score is never a bare number: each point lost carries a
**reason** and a **recommended fix**. This keeps the score actionable and prevents "mystery
scores."

The intended shape of a single deduction (final struct defined in PR 2):

```jsonc
{
  "sub_score": "route",
  "points": -20,
  "code": "PUBLIC_IP_UNEXPECTED",
  "severity": "warn",          // reuses Warning severity: "info" | "warn" | "error"
  "reason": "Public IP is visible and no tunnel was detected for this mode.",
  "recommended_fix": "Start your authorized tunnel, or switch to Observe mode if exposure is acceptable for this task."
}
```

A score report is then: the five sub-scores, the overall score, the resulting state, and a flat
list of deductions — each pointing back at the sub-score it affected.

## 4. Design principles

- **Deterministic first.** v0.3.0 ships a local rule engine with fixed weights and codes. No
  external AI call is involved in producing a score.
- **Additive, versioned.** Score fields follow the same additive-evolution rule as the evidence
  exports (`schema` bumped on breaking change). See [CHANGELOG.md](../CHANGELOG.md).
- **Never over-claims.** "Not assessed" is a first-class value. The score reflects only what was
  actually checked.
- **Evidence-linked.** The full score report is written into the session evidence bundle so a
  reviewer can reconstruct why an operator was (or was not) SOTY-ready.

## 5. PR 3 engine status

The deterministic scoring engine is now implemented (PR 3, frontend-only). No UI yet — that arrives in PR 4.

**Implemented in `apps/desktop/src/lib/`:**

- `sotyScoreRules.ts` — `SotyScoreInput` type; five pure rule functions (`routeRules`, `hostRules`, `scopeRules`, `intelRules`, `evidenceRules`); `applyDeductions()`.
- `sotyScoreState.ts` — `weightedOverall()` (route 30% · host 20% · scope 25% · intel 10% · evidence 15%) and `determineSotyState()`.
- `sotyScoreEngine.ts` — `computeSotyScore(input, options?)` entry point. Pure, side-effect free, deterministic.

**Deduction IDs implemented:**
`ROUTE_NO_PUBLIC_IP`, `ROUTE_NO_DNS`, `ROUTE_DNS_MISMATCH`, `ROUTE_TUNNEL_MISSING`, `ROUTE_IPV6_LEAK`, `ROUTE_SUSPICIOUS_PROXY`, `ROUTE_NO_ROUTE_TABLE`, `ROUTE_KILL_SWITCH_UNAVAILABLE`, `ROUTE_KILL_SWITCH_DISABLED`; `HOST_OS_UNDETECTED`, `HOST_FIREWALL_DISABLED`, `HOST_DEFENDER_DISABLED`, `HOST_SUSPICIOUS_PROXY`, `HOST_SUSPICIOUS_ROUTE`, `HOST_GUARD_UNAVAILABLE`; `SCOPE_NO_PROFILE`, `SCOPE_INVALID_PROFILE`, `SCOPE_NO_TARGET`, `SCOPE_OUT_OF_SCOPE` (blocking), `SCOPE_BLOCKED_TARGET` (blocking), `SCOPE_NO_AUTHORIZATION`; `INTEL_NO_ROUTE_PACK`, `INTEL_NO_OSINT_CATEGORIES`, `INTEL_HIGH_RISK_RESOURCE`, `INTEL_BLOCKED_RESOURCE` (blocking), `INTEL_QUERY_LOGGING`; `EVIDENCE_DISABLED`, `EVIDENCE_LEVEL_OFF`, `EVIDENCE_LEVEL_MINIMAL`, `EVIDENCE_DIR_NOT_READY`, `EVIDENCE_NO_SESSION_ID`.

**Tests:** 46 unit tests across `sotyScoreEngine.test.ts` and `sotyScoreState.test.ts`.

The dashboard that surfaces the score and state arrives in PR 4.

## 6. PR 2 schema status

The following TypeScript types are now available (PR 2, frontend-only):

- `SotyState` — the five state values and the `SOTY_STATES` runtime array.
- `ScoreCategory`, `ScoreSeverity`, `ActionType` — supporting types.
- `RecommendedFix`, `ScoreDeduction` — explainable deduction shape.
- `SotyScore` — the full score record.
- `createEmptySotyScore()` — fail-closed factory (state: `SOTY_BLOCKED`, all sub-scores 0).
- `SCORE_RANGE` — `{ min: 0, max: 100 }` constant.
- `SUB_SCORE_FIELDS` — ordered list of sub-score field names.

Rust serde structs and the scoring engine arrive in PR 3.

## 6. Roadmap position

- **PR 2** — schema/types for the score report and deductions.
- **PR 3** — deterministic scoring engine (this document's behaviour).
- **PR 4** — dashboard surfaces the big SOTY Score and state.
- **PR 9** — score report folded into the Evidence Engine.

See [docs/roadmap.md](roadmap.md).
