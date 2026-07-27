/**
 * Evidence Markdown renderer for SOTY snapshots — PR 9.
 *
 * Renders a SotyEvidenceSnapshot as a human-readable evidence.md preview.
 * Pure function — no I/O, no external calls.
 */
import type { SotyEvidenceSnapshot } from "../types/sotyEvidence";

const HR = "---";

function headerSection(s: SotyEvidenceSnapshot): string {
  const lines = [
    "# SOTY Evidence Snapshot",
    "",
    "> This is a local SOTY evidence preview. No data has been sent externally.",
    "",
    `- **ID**: ${s.id}`,
    `- **Generated**: ${s.generated_at}`,
    `- **Schema version**: ${s.schema_version}`,
    `- **Source**: ${s.source}`,
    `- **Demo mode**: ${s.demo_mode ? "yes" : "no"}`,
  ];
  if (s.demo_preset) lines.push(`- **Demo preset**: ${s.demo_preset}`);
  if (s.operator_label) lines.push(`- **Operator label**: ${s.operator_label}`);
  return lines.join("\n");
}

function sotyScoreSection(s: SotyEvidenceSnapshot): string {
  const sc = s.soty_score;
  return [
    "## SOTY Score",
    "",
    `| Sub-score | Value |`,
    `|---|---|`,
    `| Overall | **${sc.overall_score}/100** |`,
    `| State | **${sc.state}** |`,
    `| Route (30%) | ${sc.route_score}/100 |`,
    `| Host (20%) | ${sc.host_score}/100 |`,
    `| Scope (25%) | ${sc.scope_score}/100 |`,
    `| Intel (10%) | ${sc.intel_score}/100 |`,
    `| Evidence (15%) | ${sc.evidence_score}/100 |`,
    "",
    `Deductions: ${sc.deductions_count} total, ${sc.blocking_deductions_count} blocking`,
  ].join("\n");
}

function routePackSection(s: SotyEvidenceSnapshot): string {
  if (!s.route_pack) return "## Route Pack\n\nNo route pack selected.";
  const p = s.route_pack;
  return [
    "## Route Pack",
    "",
    `- **ID**: ${p.id}`,
    `- **Name**: ${p.name}`,
    `- **Evidence level**: ${p.evidence_level}`,
    `- **BOFA integration**: ${p.bofa_integration_mode}`,
    `- **Safety warnings**: ${p.safety_warnings_count}`,
  ].join("\n");
}

function routeCardSection(s: SotyEvidenceSnapshot): string {
  if (!s.route_card) return "## Route Card\n\nNo route card generated.";
  const c = s.route_card;
  const lines = [
    "## Route Card",
    "",
    `- **Mission**: ${c.mission_type}`,
    `- **Title**: ${c.title}`,
    `- **Mode**: ${c.recommended_mode}`,
    `- **Risk warnings**: ${c.risk_warnings_count}`,
    `- **BOFA allowed modules**: ${c.bofa_allowed_modules_count}`,
    `- **BOFA disallowed modules**: ${c.bofa_disallowed_modules_count}`,
    "",
    "**Required checks:**",
    ...c.required_checks.map((ch) => `- ${ch}`),
    "",
    "**Scope requirements:**",
    ...c.scope_requirements.map((sr) => `- ${sr}`),
    "",
    "**Next safe actions:**",
    ...c.next_safe_actions.map((a) => `- ${a}`),
  ];
  return lines.join("\n");
}

function hostGuardSection(s: SotyEvidenceSnapshot): string {
  if (!s.host_guard) return "## Host Guard\n\nHost Guard not run.";
  const h = s.host_guard;
  return [
    "## Host Guard",
    "",
    `- **Status**: ${h.status}`,
    `- **Checks run**: ${h.checks_count}`,
    `- **Warnings**: ${h.warning_count}`,
    `- **Failures**: ${h.fail_count}`,
    `- **Source**: ${h.source}`,
    `- **Demo mode**: ${h.demo_mode ? "yes — no real system checks performed" : "no"}`,
  ].join("\n");
}

function osintSection(s: SotyEvidenceSnapshot): string {
  const o = s.osint;
  const lines = [
    "## OSINT Navigator",
    "",
    `- **Catalog resources**: ${o.resources_total}`,
    `- **Low risk**: ${o.low_risk_count}`,
    `- **Medium risk**: ${o.medium_risk_count}`,
    `- **High risk**: ${o.high_risk_count}`,
    `- **Blocked by policy**: ${o.blocked_count}`,
    "",
    "> This evidence snapshot does not contain query content.",
    "> External page contents are not logged.",
  ];
  if (o.opened_resources.length > 0) {
    lines.push("", "**Opened resources (metadata only):**");
    for (const r of o.opened_resources) {
      lines.push(
        `- ${r.resource_id} — risk: ${r.risk_level}, via: ${r.opened_via}, query logged: ${r.query_content_logged}`
      );
    }
  } else {
    lines.push("", "No resources opened in this session.");
  }
  return lines.join("\n");
}

function warningsSection(s: SotyEvidenceSnapshot): string {
  if (s.warnings.length === 0) return "## Warnings\n\nNo high-severity warnings.";
  return ["## Warnings", "", ...s.warnings.map((w) => `- ${w}`)].join("\n");
}

function recommendedFixesSection(s: SotyEvidenceSnapshot): string {
  if (s.recommended_fixes.length === 0) return "## Recommended Fixes\n\nNo fixes recommended.";
  return ["## Recommended Fixes", "", ...s.recommended_fixes.map((f) => `- ${f}`)].join("\n");
}

function redactionSection(s: SotyEvidenceSnapshot): string {
  const r = s.redaction;
  return [
    "## Redaction / Privacy Guarantees",
    "",
    "> Credentials, tokens and cookies are not logged.",
    "",
    `- Query content logged: ${r.query_content_logged}`,
    `- External page content logged: ${r.external_page_content_logged}`,
    `- Credentials logged: ${r.credentials_logged}`,
    `- Tokens logged: ${r.tokens_logged}`,
    `- Cookies logged: ${r.cookies_logged}`,
  ].join("\n");
}

function limitationsSection(s: SotyEvidenceSnapshot): string {
  return ["## Limitations", "", ...s.limitations.map((l) => `- ${l}`)].join("\n");
}

/**
 * Render a SotyEvidenceSnapshot as a human-readable Markdown string.
 * Pure function — no I/O.
 */
export function renderEvidenceMarkdown(snapshot: SotyEvidenceSnapshot): string {
  return [
    headerSection(snapshot),
    HR,
    sotyScoreSection(snapshot),
    HR,
    routePackSection(snapshot),
    HR,
    routeCardSection(snapshot),
    HR,
    hostGuardSection(snapshot),
    HR,
    osintSection(snapshot),
    HR,
    warningsSection(snapshot),
    HR,
    recommendedFixesSection(snapshot),
    HR,
    redactionSection(snapshot),
    HR,
    limitationsSection(snapshot),
  ].join("\n\n");
}
