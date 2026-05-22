## Summary

<!-- What does this PR do? One paragraph max. -->

## Type

- [ ] feat — new capability
- [ ] fix — bug fix
- [ ] docs — documentation only
- [ ] chore — build / CI / dependency
- [ ] refactor — no behaviour change
- [ ] security — hardening or vulnerability fix

## Checklist

- [ ] `tsc --noEmit` passes
- [ ] `cargo fmt --all -- --check` passes
- [ ] `cargo clippy -- -D warnings` passes
- [ ] `cargo build --release` passes
- [ ] No destructive network operations added without a dry-run gate
- [ ] Evidence schema changes are additive (or schema version bumped)
- [ ] BOFA/SotyHUB export schemas remain backward-compatible (or documented breaking change)
- [ ] Docs updated if behaviour changed
- [ ] `docs/threat-model.md` still accurate

## Testing

<!-- How was this tested? For UI changes: which pages, which modes, which flows. -->

## Safety / reversibility

<!-- Does this touch network state? How is it reversed? Is it gated behind dry-run? -->

## Related issues

Closes #
