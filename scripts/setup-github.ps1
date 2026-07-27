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

# ---- Labels -----------------------------------------------------------------

function New-Label {
    param([string]$Name, [string]$Color, [string]$Desc)
    Write-Host "  label: $Name" -ForegroundColor Gray
    gh label create $Name --color $Color --description $Desc --repo $Repo --force 2>$null
}

Write-Host "`n[1/4] Creating labels..." -ForegroundColor Yellow

New-Label "type: bug"           "d73a4a" "Something is broken"
New-Label "type: feature"       "0075ca" "New capability or enhancement"
New-Label "type: security"      "e4e669" "Security hardening or vulnerability"
New-Label "type: docs"          "cfd3d7" "Documentation only"
New-Label "type: chore"         "cfd3d7" "Build, CI, dependencies"
New-Label "area: ui"            "bfd4f2" "Desktop UI (React/TypeScript)"
New-Label "area: backend"       "bfd4f2" "Rust backend"
New-Label "area: evidence"      "bfd4f2" "Evidence pipeline"
New-Label "area: profiles"      "bfd4f2" "Profile schema and validation"
New-Label "area: agent"         "bfd4f2" "Local agent / Windows Service"
New-Label "priority: critical"  "b60205" "Blocks a release"
New-Label "priority: high"      "e99695" "Important, address soon"
New-Label "priority: normal"    "f9d0c4" "Standard priority"
New-Label "priority: low"       "fef2c0" "Nice to have"
New-Label "status: needs-triage" "ededed" "Needs maintainer review"
New-Label "status: in-progress" "0e8a16" "Actively being worked on"
New-Label "status: blocked"     "b60205" "Blocked on external dependency"
New-Label "status: wontfix"     "ffffff" "Out of scope or by design"
New-Label "milestone: v0.1.0"   "c2e0c6" "Foundation milestone"
New-Label "milestone: v0.2.0"   "c2e0c6" "Agent milestone"
New-Label "milestone: v0.3.0"   "c2e0c6" "Tunnels milestone"
New-Label "milestone: v1.0.0"   "0e8a16" "Stable release milestone"

# ---- Milestones -------------------------------------------------------------

Write-Host "`n[2/4] Creating milestones..." -ForegroundColor Yellow

$milestones = @(
    @{ title = "v0.1.0 - Foundation"; desc = "Desktop UI, observe + dry-run, evidence, exports. No destructive network changes." },
    @{ title = "v0.2.0 - Agent";      desc = "Windows Service, named pipe IPC, controlled firewall planning, reversible rules." },
    @{ title = "v0.3.0 - Tunnels";    desc = "WireGuard orchestration, Tor backend research, kill-switch prototype, rollback." },
    @{ title = "v1.0.0 - Stable";     desc = "Audited agent, signed releases, external threat-model review." }
)

foreach ($m in $milestones) {
    Write-Host "  milestone: $($m.title)" -ForegroundColor Gray
    gh api "repos/$Repo/milestones" `
        --method POST `
        --field title="$($m.title)" `
        --field description="$($m.desc)" `
        --field state="open" 2>$null | Out-Null
}

# ---- Seed issues ------------------------------------------------------------

Write-Host "`n[3/4] Creating seed issues..." -ForegroundColor Yellow

$issues = @(
    @{
        title  = "feat: tray icon with start/stop/open-evidence actions"
        body   = "Implement system tray icon (Tauri system-tray feature). Actions: Show dashboard, Start selected profile, Stop session, Open evidence folder, Quit. Requires icon set -- generate with ``npm run tauri icon``."
        labels = "type: feature,area: ui,milestone: v0.1.0,priority: normal"
    },
    @{
        title  = "chore: generate and commit app icon set"
        body   = "Create a SotyRoute logo (1024x1024 PNG) and generate the full Tauri icon set with ``npm run tauri icon``. Commit ``apps/desktop/src-tauri/icons/`` (remove the icons/README.md from .gitignore). Required for tray icon and tauri build."
        labels = "type: chore,area: ui,milestone: v0.1.0,priority: high"
    },
    @{
        title  = "security: path traversal audit on evidence directory writes"
        body   = "Audit all evidence file writes in evidence.rs to confirm no path component from profile/session data can escape ~/.sotyroute/runs/. Add canonicalize + prefix check before every write."
        labels = "type: security,area: evidence,milestone: v0.1.0,priority: high"
    },
    @{
        title  = "docs: add screenshots to README"
        body   = "After first successful tauri dev build, capture screenshots of Dashboard, Doctor, Evidence pages. Add to docs/screenshots/ and README section 9 (Screenshots placeholder)."
        labels = "type: docs,milestone: v0.1.0,priority: normal"
    },
    @{
        title  = "feat: schema versioning (schema: 1) in BOFA/SotyHUB exports"
        body   = "Add schema: '1' field to bofa_export.json and sotyhub_export.json. Document that additive fields are non-breaking; field removals/renames bump the version. Upstream consumers (BOFA, SotyHUB) should gate on this field."
        labels = "type: feature,area: evidence,milestone: v0.2.0,priority: high"
    },
    @{
        title  = "feat: extract crates/sotyroute-core library"
        body   = "Move profiles, planner, evidence modules from src-tauri/src/ into a proper crates/sotyroute-core library crate so the future agent can link against it without pulling in Tauri. No behaviour change."
        labels = "type: chore,area: backend,milestone: v0.2.0,priority: high"
    },
    @{
        title  = "feat: Windows Service skeleton (sotyrouted)"
        body   = "Build crates/sotyroute-agent as a Windows Service binary listening on named pipe \\.\pipe\sotyroute with restrictive SDDL ACL. No network actions yet -- just IPC plumbing between UI and agent."
        labels = "type: feature,area: agent,milestone: v0.2.0,priority: high"
    },
    @{
        title  = "feat: opt-in public IP check in Doctor"
        body   = "When public_ip_check_enabled: true in settings, Doctor page fetches public IP from ipify.org and displays it alongside a warning that this makes an outbound request. Default off."
        labels = "type: feature,area: backend,milestone: v0.2.0,priority: normal"
    },
    @{
        title  = "feat: SOCKS5 TCP port reachability probe in Doctor"
        body   = "When a SOCKS5 profile is loaded, optionally probe host:port TCP reachability and surface the result as a check item in the Doctor page. Must be non-blocking and timeout-bounded."
        labels = "type: feature,area: backend,milestone: v0.2.0,priority: normal"
    },
    @{
        title  = "feat: signed evidence bundles (SHA-256 manifest)"
        body   = "Add evidence_sig.json to each session folder containing a SHA-256 hash of every artifact in the bundle. Full Authenticode/GPG signing comes in v0.4.0 but the manifest format lands here in v0.3.0."
        labels = "type: feature,area: evidence,milestone: v0.3.0,priority: normal"
    }
)

foreach ($issue in $issues) {
    $short = if ($issue.title.Length -gt 70) { $issue.title.Substring(0, 70) + "..." } else { $issue.title }
    Write-Host "  issue: $short" -ForegroundColor Gray
    gh issue create `
        --title "$($issue.title)" `
        --body "$($issue.body)" `
        --label "$($issue.labels)" `
        --repo $Repo 2>&1 | Out-Null
}

# ---- Branch protection ------------------------------------------------------

Write-Host "`n[4/4] Configuring branch protection for main..." -ForegroundColor Yellow

$body = '{"required_status_checks":{"strict":true,"contexts":["lint-frontend","build-rust"]},"enforce_admins":false,"required_pull_request_reviews":{"required_approving_review_count":1,"dismiss_stale_reviews":true},"restrictions":null}'
$body | gh api "repos/$Repo/branches/main/protection" --method PUT --input - 2>&1 | Out-Null

Write-Host "`nDone. Visit https://github.com/$Repo" -ForegroundColor Green
