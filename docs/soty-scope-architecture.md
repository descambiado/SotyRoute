# Scope sub-score — architecture design

**Status: design only. Nothing in this document is implemented yet.** This is the last of the
five SOTY Score sub-scores still running entirely on demo data — Route, Host, Intel and Evidence
all read real signals as of PRs 15/19/20/Evidence Guard (see [docs/soty-score.md](soty-score.md)
§§10–13). Scope is different in kind, not just in degree: the other four needed a real *signal*
to read. Scope needs a real *concept* — a shared active profile, and an operator-declared target —
neither of which exists anywhere in the app today. That's why it was deferred rather than
attempted alongside the others, and why it gets its own design pass before any code.

## 1. Current state

**Where the Scope input comes from today.** In `SotyDashboard.tsx`'s `scoreInput` composition
(around line 315), every other category is explicitly overridden with a real-signal mapper once
its check has run:

```ts
const scoreInput = {
  ...DEMO_SCORE_INPUTS[preset],
  route: routeGuardSignals ? mapRouteSignalsToScoreInput(...) : DEMO_SCORE_INPUTS[preset].route,
  host: hostGuardSummary ? hostGuardToHostInput(...) : DEMO_SCORE_INPUTS[preset].host,
  intel: mapIntelToScoreInput(...),
  evidence: evidenceGuardSignals ? mapEvidenceSignalsToScoreInput(...) : DEMO_SCORE_INPUTS[preset].evidence,
};
```

`scope` is not mentioned at all. It falls through from the `...DEMO_SCORE_INPUTS[preset]` spread,
unconditionally, every render. There is no code path — real or fallback — that ever touches it.

**Why it is still demo.** The other four categories all had a real *signal* sitting somewhere
already reachable: Host/Route/Evidence Guard read actual OS/filesystem state via Tauri commands
that either already existed (Host Guard, PR 15) or were straightforward to add (Route Guard,
Evidence Guard — same PowerShell/filesystem pattern, no new kind of capability). Intel needed no
new signal at all — Route Pack selection and OSINT Navigator filters were already real interactive
state sitting in `SotyDashboard.tsx`, just never read by the score composition.

Scope has neither. Its six fields (`profile_loaded`, `profile_valid`, `target_declared`,
`target_in_allowed_scope`, `blocked_target_match`, `authorized_use_confirmed`) all depend on two
things that plainly do not exist anywhere in the app today:

- A **shared active profile** — some profile that is "the one in effect" for the current session,
  readable from `SotyDashboard`.
- A **declared target** — a live "what am I about to point this at" value, distinct from a
  profile's static `allowed_targets` list.

**What data already exists.** More than you'd expect — this is a wiring and UX design gap, not a
missing-backend gap:

- `apps/desktop/src-tauri/src/profiles.rs` — real `Profile` struct (`allowed_targets: Vec<String>`,
  `blocked_targets: Vec<String>`, plus `name`/`mode`/`owner`/`purpose`/etc.), real
  `load_from_path()` (YAML/JSON), real `validate()` (name checks, transport-specific requirements,
  and for `mode=lab`: requires `owner`, `purpose`, and at least one `allowed_target`).
- `apps/desktop/src/lib/types.ts` — the matching TS `Profile` / `ValidationResult` interfaces.
- `apps/desktop/src/lib/api.ts` — already-wired Tauri commands: `loadProfile(path)`,
  `validateProfile(profile)`, `listExampleProfiles()`. **No new Tauri command is needed for any
  of this** — the future implementation PR is pure frontend wiring plus one new pure mapper
  function, exactly like Intel was.
- `docs/route-packs.md` §4 and `docs/legal-scope.md` already state the intended philosophy in
  prose: *"scope is always operator-declared and validated"* and *"the operator declares... will
  not use the tool against unauthorized targets."* The design below does not invent a new
  philosophy — it makes an existing, already-written one real.

**What is missing.** Three things, precisely:

1. **Shared state.** `Profile` is currently loaded into three independent, page-local
   `useState<Profile | null>` instances — `Profiles.tsx`, `Dashboard.tsx`, and (not yet, but
   would need one) `SotyDashboard.tsx`. None of them share. Loading a profile on the Profiles
   page has zero effect on what `SotyDashboard` sees.
2. **Target declaration UI.** Neither `Profiles.tsx` nor `Dashboard.tsx` has an input for "what
   am I about to act on right now." Both only render a profile's static `allowed_targets` /
   `blocked_targets` arrays as read-only lists. There is no operator-facing concept of a *current*
   target anywhere in the codebase.
3. **Target-matching semantics.** `allowed_targets` / `blocked_targets` are untyped
   `string[]` with no defined comparison rule anywhere in the code or docs — not exact-match,
   not domain-suffix, not CIDR. This has to be decided explicitly (see §2), not assumed.

## 2. Target model

**"Active profile"** — the `Profile` object most recently loaded *and validated* by the operator
in this session, held somewhere every page can read without re-loading it from disk. Not
re-fetched, not re-validated implicitly on every read; it changes only when the operator loads a
different profile. An unvalidated profile (loaded but "Validate" never clicked, or validated with
errors) is a real, representable state — not the same as "no active profile."

**"Declared target"** — a plain string the operator types in, representing what they are about
to act on *right now*: a hostname, IP address, CIDR block, or URL. This is deliberately distinct
from a profile's `allowed_targets` — that list is a pre-approved set decided when the profile was
authored; the declared target is today's specific, momentary intent. A profile can authorize five
targets; the operator is still only working one of them at a time, and the score should reflect
that specific one.

**How a target should be checked against allowed/blocked lists.** Pure, local string comparison
— nothing else. No DNS resolution, no CIDR-aware IP containment math, no wildcard/subdomain
matching, in the first implementation. Recommended MVP: **case-insensitive exact string match**
between the declared target and each entry in `allowed_targets` / `blocked_targets`. This is
deliberately the most conservative, least surprising option: a false "in scope" from
over-permissive matching (e.g. a naive substring check treating `notexample.com` as inside scope
for `example.com`) is a real safety failure in a tool whose entire purpose is scope discipline. A
target that doesn't exactly match anything in `allowed_targets` should read as **unknown/not
confirmed**, not silently "in scope" — that maps to `target_in_allowed_scope: null` in the
existing engine (which the engine already treats as "no deduction, unconfirmed" — see
`sotyScoreRules.ts` — so this is not a new state to invent, just a case to route there correctly).
CIDR containment, subdomain-suffix matching, and similar fuzzier rules are worth having eventually
but are their own design-and-review problem — CIDR parsing is exactly the kind of code where a
subtle bug becomes a scope-boundary bug — and are explicitly **not** part of this design or its
first implementation PR.

**How Scope deductions become real.** A new pure function, mirroring the existing
`mapIntelToScoreInput` / `mapEvidenceSignalsToScoreInput` pattern exactly:

```ts
// proposed shape — not implemented
function mapScopeToScoreInput(
  demoScope: SotyScoreInput["scope"],
  state: {
    activeProfile: Profile | null;
    activeProfileValidation: ValidationResult | null;
    declaredTarget: string;
    authorizedUseConfirmed: boolean; // an explicit operator checkbox, not inferred
  }
): SotyScoreInput["scope"]
```

Each of the six fields maps to something real once the operator has actually engaged with Scope
this session (touched-gating — see §4), and to the demo value before that, exactly like Intel:

| Field | Real source |
|---|---|
| `profile_loaded` | `activeProfile !== null` |
| `profile_valid` | `activeProfileValidation?.valid === true` |
| `target_declared` | `declaredTarget.trim().length > 0` |
| `target_in_allowed_scope` | exact-match against `activeProfile.allowed_targets` → `true`/`false`/`null` (no target declared, or no profile) |
| `blocked_target_match` | exact-match against `activeProfile.blocked_targets` → `true`/`false` |
| `authorized_use_confirmed` | a real, explicit operator confirmation control — **not** inferred from profile validity or from the existing example-profile "confirmations" copy shown read-only on the Route Pack detail panel. Confirming validity is not the same as confirming authorization; conflating them would be dishonest. |

## 3. Proposed data flow

```
Profiles.tsx                    SotyDashboard.tsx
     │  load + validate               │  reads
     ▼                                ▼
┌─────────────────────────────────────────────┐
│         Shared active-profile store          │  ← new (React Context)
│   { profile: Profile | null,                  │
│     validation: ValidationResult | null }     │
└─────────────────────────────────────────────┘
                                       │
                          declaredTarget (SotyDashboard-local state,
                          new "Scope" section — see §4)
                                       │
                                       ▼
                        mapScopeToScoreInput(demoScope, state)
                                       │
                                       ▼
                     scoreInput.scope  →  computeSotyScore()
```

- **Profiles.tsx** — unchanged in its own UI and local state. The only addition: on a successful
  `loadProfile()` (and again after `validateProfile()` resolves), it also publishes into the
  shared store. `Dashboard.tsx` is not touched by this design — its own profile-picking flow
  (for Observe/Dry-run) is a separate concern and out of scope here; whether it should also read
  from or publish to the shared store is a fair follow-up question but not required to make Scope
  real.
- **Shared active-profile store** — a React Context (`ActiveProfileContext`), provided once near
  the app root (alongside the existing router). Chosen over introducing a state-management
  library because the app has none today and doesn't need one for a single shared value; adding
  one would violate "no dependency updates" and would be disproportionate to the problem.
- **SotyDashboard.tsx** — consumes the context (`useActiveProfile()` or similar), adds the new
  target-declaration input as its own local state (target is dashboard-specific working state,
  not something other pages need), and extends `scoreInput` with
  `scope: mapScopeToScoreInput(...)` exactly alongside the existing four overrides.
- **SOTY score input composition** — no change to `computeSotyScore()`, `scopeRules()`, or any
  other scoring file. This is purely an input-supply change, identical in shape to how Route,
  Host, Intel and Evidence were each wired in turn.

## 4. UX proposal

**Where the operator selects/loads an active profile.** Stays exactly where it is —
`Profiles.tsx`'s existing example-profile list and "Validate" button. No new profile-loading UI
anywhere else. If `SotyDashboard` has no active profile yet, show a plain prompt in the new Scope
section: *"No active profile — load one on the [Profiles](/#/profiles) page."* linking there,
rather than duplicating a profile picker.

**Where the operator declares a target.** A new "Scope" section on `SotyDashboard`, positioned
after Route Packs and before Mission Route (Scope is 25% weight, the second-largest after Route,
and logically precedes "what am I about to do" mission planning) — exact placement is a
lower-stakes call for the implementation PR, not this document. Contents: the active-profile
summary (name, mode, allowed/blocked counts — reusing the existing `.evidence-kv` display pattern
already used by Route/Route Guard/Evidence Guard panels, no new CSS needed), a plain text input
for the declared target, and an explicit "I hold authorization for this target" confirmation
control (checkbox or button) for `authorized_use_confirmed` — never auto-checked.

**How the UI shows in-scope / out-of-scope / missing-declaration states.** Four distinct states,
following the same visual language already established by the Host/Route/Evidence Guard panels
(`.evidence-panel` success styling vs. `.evidence-save-error` danger styling):

1. No active profile → neutral prompt (as above), no deduction shown yet (matches demo until
   touched — see below).
2. Active profile, no target declared → neutral "declare a target to check scope" prompt.
3. Target declared, matches `allowed_targets` → green "in scope" confirmation.
4. Target declared, matches `blocked_targets`, or doesn't match `allowed_targets` → red
   "out of scope" / "blocked target" state, mirroring the existing blocking-deduction styling
   already used elsewhere in the deduction list (`SCOPE_OUT_OF_SCOPE` and `SCOPE_BLOCKED_TARGET`
   are already `blocking: true` in `scopeRules()` today — the UI treatment for a blocking
   deduction already exists, it just needs a Scope-specific trigger).

**How to avoid a misleading 100/100 demo Scope.** Exactly the touched-gating pattern already
proven for Intel in PR 20: `mapScopeToScoreInput` only overrides the demo value once the operator
has actually interacted with Scope this session (loaded a profile via the shared store becoming
non-null, or typed a declared target) — before that, `SotyDashboard` keeps showing the selected
demo preset's Scope value, so `SOTY_READY` still renders a clean 100/100 on first load rather than
immediately showing `SCOPE_NO_PROFILE` (−40) to a visitor who hasn't touched anything yet. This is
not a new decision — it is the same one already made and shipped for Intel, applied consistently.

## 5. Implementation plan for the future PRs

**Recommended split — three PRs, not four.** The user-proposed four-way split (PR59 shared
state / PR60 target UI / PR61 score mapping / PR62 tests+docs) is a reasonable, safe,
small-increments option and is noted below as a valid alternative. But looking at how every other
sub-score actually shipped this cycle — Route Guard, Intel, and Evidence Guard were each *one*
PR combining plumbing, mapping, UI, tests, and docs — a four-way split for Scope is more
fragmented than precedent, and PR60/PR61 in the four-way split have no independent value (a
target-declaration UI that doesn't yet feed the score, and score-mapping with no UI to drive it,
are each incomplete on their own and hard to review or demo in isolation). Scope's one genuine
architectural novelty — the shared active-profile store — is the one piece worth isolating on its
own, because it's reviewable independently ("we added a Context, nothing else changed") in a way
the UI-plus-scoring work isn't.

- **PR59 — shared active-profile state.** `ActiveProfileContext` (or equivalent), `Profiles.tsx`
  publishes into it on load/validate, `SotyDashboard.tsx` reads and displays it (name, mode,
  validity, allowed/blocked counts) but does **not** yet touch `scoreInput`. Zero scoring change,
  zero new Tauri commands, purely additive. Small and independently reviewable.
- **PR60 — target declaration + real Scope score.** The target-declaration input, the exact-match
  checking function (§2), the `authorized_use_confirmed` control, `mapScopeToScoreInput()`, the
  touched-gating wiring into `SotyDashboard`'s `scoreInput`, the four UX states from §4, and the
  full test suite from §8 (pure mapper tests, scoring-composition tests) — one cohesive PR, the
  same shape as PR 19/20/Evidence Guard each already were. Docs (`docs/soty-score.md` update,
  `CHANGELOG.md`) land in this PR too, matching how every prior real-signal PR self-documented
  rather than deferring docs to a separate PR.
- **PR61 — polish / follow-up, only if something is left over.** Not pre-planned work — a
  placeholder for whatever PR60's review surfaces (edge cases, a UI test if the project decides
  to adopt `@testing-library/react`, extended target-matching semantics). Should not be opened
  speculatively.

**Alternative — the originally proposed four-way split**, if smaller individually-mergeable
increments are preferred over fewer larger ones (both are legitimate engineering choices; this is
a judgment call worth the reviewer's input, not something this document decides unilaterally):

- **PR59** — shared active profile state (same as above).
- **PR60** — target declaration UI only (input + display of match result), no score wiring yet.
- **PR61** — `mapScopeToScoreInput()` and wiring into `scoreInput`, using PR60's UI.
- **PR62** — dedicated test and docs pass across PR59–61.

## 6. Safety boundaries

- **No scraping.** Target-matching never fetches, resolves, or contacts the declared target in
  any way. It is a string comparison against operator-typed data, nothing else.
- **No target probing.** No DNS lookup, no ping, no port check, no HTTP request — declaring a
  target never causes any network activity. This mirrors the existing Route/Host Guard boundary
  (read-only local signals only) extended to a case where the "target" isn't even local.
- **No network calls.** The entire Scope feature, as designed, is 100% local: reading a file
  (already-existing `load_from_path`), comparing strings in memory, and rendering UI state.
- **No external APIs.** Nothing here calls any external service, now or as a planned extension.
- **No automatic validation against real infrastructure.** SotyRoute does not and should not
  attempt to verify that a declared target is real, reachable, or actually the operator's — that
  would require exactly the kind of network activity this design explicitly excludes. Scope
  validity is asserted by the operator and checked only against the operator's own declared
  allow/block lists.
- **User-declared scope only.** Every input to the Scope sub-score — the profile, the target, the
  authorization confirmation — is something the operator explicitly typed or clicked. Nothing is
  inferred, guessed, or auto-detected. This is a direct continuation of the existing project
  philosophy already written down in `docs/route-packs.md` §4 and `docs/legal-scope.md`, not a
  new stance invented for this document.
- **Local-only state.** The shared active-profile store lives in memory for the running session
  (a React Context, not persisted storage, not written to disk, not sent anywhere). Closing the
  app clears it, same as every other piece of session state in `SotyDashboard` today.

## 7. Non-goals

- No offensive automation of any kind.
- No BOFA launch — Scope feeds the existing BOFA Gate's `scope + evidence + confirmation` inputs
  (per `docs/route-packs.md`), it does not create any new BOFA capability.
- No SotyHUB upload.
- No automatic OSINT lookup against the declared target.
- No system mutation — this remains a read/display/compare feature exactly like the other four
  Guards.
- No Tauri 2 migration (tracked separately, Dependabot PR #15/#5, unrelated).
- No dependency updates (the shared-state store is a plain React Context; no new package).

## 8. Test plan for the future implementation

- **Pure mapper tests** — `mapScopeToScoreInput()` tested the same way as
  `sotyIntelReal.test.ts` / `sotyEvidenceGuardReal.test.ts` already are: every field's real-vs-demo
  fallback, the touched-gating boundary, exact-match true/false/null cases for
  `target_in_allowed_scope`, and the case-insensitivity rule.
- **Score deduction tests** — mostly **already exist**. `sotyScoreEngine.test.ts` already covers
  `SCOPE_NO_PROFILE`, the blocking behavior of `target_in_allowed_scope === false`, and
  `scope_score` floor/clamp behavior against `scopeRules()` directly — that suite doesn't need
  duplicating, only the new mapper needs its own tests to prove it produces correct
  `SotyScoreInput["scope"]` values from realistic (profile, target) combinations.
- **UI state tests — not currently available, flagged honestly.** This codebase has **no
  component-level UI test precedent today** — no `@testing-library/react` (or equivalent)
  dependency, and zero `render()`-style tests anywhere in `apps/desktop/src/__tests__/`; every
  existing test targets a pure function in `src/lib/`. The future implementation PR should follow
  that same precedent (test the pure `mapScopeToScoreInput()` function thoroughly, verify the UI
  wiring manually via the dev server, as every prior real-signal PR this cycle already did) rather
  than introducing a new test dependency and pattern as a side effect of Scope work. If the
  project decides it wants component-level UI tests going forward, that's a deliberate, separate
  decision — not something to slip in here.
- **No regression to Route/Host/Intel/Evidence.** The full existing suite (630 tests as of this
  document) must continue to pass unchanged; the implementation PR should only ever *add* test
  files/cases, never modify existing Route/Host/Intel/Evidence mapper or engine tests.

---

*This document describes a design only. See §5 for the proposed implementation sequence. No code,
scoring logic, Profile behavior, or app behavior changes as part of this document.*
