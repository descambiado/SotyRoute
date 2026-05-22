# SotyRoute GitHub bootstrap script
# Run once after creating the remote repo.
# Requires: gh CLI authenticated as @descambiado
#
# Usage:
#   cd C:\Users\davyd\Documents\GitHub\SotyRoute
#   .\scripts\setup-github.ps1

param(
    [string]$Repo = "descambiado/SotyRoute"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "=== SotyRoute GitHub Setup ===" -ForegroundColor Cyan
Write-Host "Repo: $Repo" -ForegroundColor Gray

# ── Labels ──────────────────────────────────────────────────────────────────

function New-Label($name, $color, $description) {
    Write-Host "  label: $name" -ForegroundColor Gray
    gh label create $name --color $color --description $description --repo $Repo --force 2>$null
}

Write-Host "`n[1/4] Creating labels..." -ForegroundColor Yellow

# Type
New-Label "type: bug"      "d73a4a" "Something is broken"
New-Label "type: feature"  "0075ca" "New capability or enhancement"
New-Label "type: security" "e4e669" "Security hardening or vulnerability"
New-Label "type: docs"     "cfd3d7" "Documentation only"
New-Label "type: chore"    "cfd3d7" "Build, CI, dependencies"

# Area
New-Label "area: ui"       "bfd4f2" "Desktop UI (React/TypeScript)"
New-Label "area: backend"  "bfd4f2" "Rust backend"
New-Label "area: evidence" "bfd4f2" "Evidence pipeline"
New-Label "area: profiles" "bfd4f2" "Profile schema and validation"
New-Label "area: agent"    "bfd4f2" "Local agent / Windows Service"

# Priority
New-Label "priority: critical" "b60205" "Blocks a release"
New-Label "priority: high"     "e99695" "Important, address soon"
New-Label "priority: normal"   "f9d0c4" "Standard priority"
New-Label "priority: low"      "fef2c0" "Nice to have"

# Status
New-Label "status: needs-triage" "ededed" "Needs maintainer review"
New-Label "status: in-progress"  "0e8a16" "Actively being worked on"
New-Label "status: blocked"      "b60205" "Blocked on external dependency"
New-Label "status: wontfix"      "ffffff" "Out of scope or by design"

# Milestone tags
New-Label "milestone: v0.1.0" "c2e0c6" "Foundation milestone"
New-Label "milestone: v0.2.0" "c2e0c6" "Agent milestone"
New-Label "milestone: v0.3.0" "c2e0c6" "Tunnels milestone"
New-Label "milestone: v1.0.0" "0e8a16" "Stable release milestone"

# ── Milestones ───────────────────────────────────────────────────────────────

Write-Host "`n[2/4] Creating milestones..." -ForegroundColor Yellow

$milestones = @(
    @{ title = "v0.1.0 — Foundation"; description = "Desktop UI, observe + dry-run, evidence, exports. No destructive network changes." },
    @{ title = "v0.2.0 — Agent";      description = "Windows Service, named pipe IPC, controlled firewall planning, reversible rules." },
    @{ title = "v0.3.0 — Tunnels";    description = "WireGuard orchestration, Tor backend research, kill-switch prototype, rollback." },
    @{ title = "v1.0.0 — Stable";     description = "Audited agent, signed releases, external threat-model review." }
)

foreach ($m in $milestones) {
    Write-Host "  milestone: $($m.title)" -ForegroundColor Gray
    gh api repos/$Repo/milestones `
        --method POST `
        --field title=$($m.title) `
        --field description=$($m.description) `
        --field state="open" 2>$null | Out-Null
}

# ── Seed issues ──────────────────────────────────────────────────────────────

Write-Host "`n[3/4] Creating seed issues..." -ForegroundColor Yellow

$issues = @(
    @{
        title  = "feat: tray icon with start/stop/open-evidence actions"
        body   = "Implement system tray icon (Tauri system-tray feature). Actions: Show dashboard, Start selected profile, Stop session, Open evidence folder, Quit.`n`nRequires icon set — generate with ``npm run tauri icon``."
        labels = "type: feature,area: ui,milestone: v0.1.0,priority: normal"
    },
    @{
        title  = "feat: SOCKS5 port reachability probe in Doctor"
        body   = "When a SOCKS5 profile is loaded, the Doctor page should optionally probe ``host:port`` TCP reachability and surface the result as a check item."
        labels = "type: feature,area: backend,milestone: v0.2.0,priority: normal"
    },
    @{
        title  = "feat: schema versioning (schema: 1) in BOFA/SotyHUB exports"
        body   = "Add ``schema: '1'`` field to ``bofa_export.json`` and ``sotyhub_export.json``. Document that additive changes are non-breaking; field removals/renames bump the version."
        labels = "type: feature,area: evidence,milestone: v0.2.0,priority: high"
    },
    @{
        title  = "feat: extract crates/sotyroute-core library"
        body   = "Move ``profiles``, ``planner``, ``evidence`` modules from ``src-tauri/src/`` into a proper ``crates/sotyroute-core`` library crate so the future agent can link against it without Tauri."
        labels = "type: chore,area: backend,milestone: v0.2.0,priority: high"
    },
    @{
        title  = "feat: Windows Service skeleton (sotyrouted)"
        body   = "Build ``crates/sotyroute-agent`` as a Windows Service binary listening on ``\\.\pipe\sotyroute`` with restrictive SDDL. No network actions yet — just IPC plumbing."
        labels = "type: feature,area: agent,milestone: v0.2.0,priority: high"
    },
    @{
        title  = "feat: opt-in public IP check in Doctor"
        body   = "When ``public_ip_check_enabled: true`` in settings, Doctor fetches the public IP from ipify and displays it. Must be opt-in; default off. Must warn that this makes an outbound request."
        labels = "type: feature,area: backend,milestone: v0.2.0,priority: normal"
    },
    @{
        title  = "chore: generate and commit app icon set"
        body   = "Create a SotyRoute logo (1024x1024 PNG) and generate the Tauri icon set with ``npm run tauri icon``. Commit ``apps/desktop/src-tauri/icons/`` (excluding README.md from gitignore)."
        labels = "type: chore,area: ui,milestone: v0.1.0,priority: high"
    },
    @{
        title  = "docs: add screenshots to README"
        body   = "After first successful ``tauri dev`` build, capture screenshots of Dashboard, Doctor, Evidence pages and add them to ``docs/screenshots/`` and README section 9."
        labels = "type: docs,milestone: v0.1.0,priority: normal"
    },
    @{
        title  = "feat: signed evidence bundles (SHA-256 manifest)"
        body   = "Add ``evidence_sig.json`` to each session folder containing a SHA-256 hash of every artifact. Full Authenticode/GPG signing comes in v0.4.0 but the manifest format lands here."
        labels = "type: feature,area: evidence,milestone: v0.3.0,priority: normal"
    },
    @{
        title  = "security: path traversal audit on evidence directory writes"
        body   = "Audit all evidence file writes in ``evidence.rs`` to confirm no path component from profile/session data can escape ``~/.sotyroute/runs/``. Add a canonicalize + prefix check."
        labels = "type: security,area: evidence,milestone: v0.1.0,priority: high"
    }
)

foreach ($issue in $issues) {
    Write-Host "  issue: $($issue.title.Substring(0, [Math]::Min(60, $issue.title.Length)))..." -ForegroundColor Gray
    gh issue create `
        --title $issue.title `
        --body $issue.body `
        --label $issue.labels `
        --repo $Repo 2>$null | Out-Null
}

# ── Branch protection ────────────────────────────────────────────────────────

Write-Host "`n[4/4] Configuring branch protection for main..." -ForegroundColor Yellow

gh api repos/$Repo/branches/main/protection `
    --method PUT `
    --field required_status_checks='{"strict":true,"contexts":["lint-frontend","build-rust"]}' `
    --field enforce_admins=false `
    --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' `
    --field restrictions=null 2>$null | Out-Null

Write-Host "`nDone. Visit https://github.com/$Repo" -ForegroundColor Green
