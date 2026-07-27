## What changed

<!-- One paragraph or a concise bullet list describing the changes in this PR. -->

## Why it matters

<!-- The problem this solves or the capability it adds. -->

## Safety boundaries

<!-- Does this touch network state, system config, evidence schema, or BOFA/SotyHUB contracts?
     If yes: how is it gated, reversed, or kept additive?
     If no: state that explicitly (e.g. "UI-only, no system mutations"). -->

## Tests / checks run

- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes — N tests
- [ ] `cargo fmt --all -- --check` passes (if Rust changed)
- [ ] `cargo clippy -- -D warnings` passes (if Rust changed)
- [ ] No destructive network operations added without a dry-run gate
- [ ] Evidence / export schema changes are additive (or schema version bumped)

## What is intentionally not included

<!-- List anything a reviewer might expect to see but that is deliberately deferred.
     Helps reviewers distinguish "missing" from "out of scope for this PR". -->

## Follow-up PRs

<!-- Reference planned follow-on work by PR number or description. -->

## Related issues

Closes #
