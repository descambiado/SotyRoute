/**
 * SotyOsintNavigator — Ethical OSINT Navigator panel.
 *
 * Displays the local OSINT resource catalog with category and risk filters.
 * All resources open via a confirmation gate; blocked resources are visible
 * but never openable.
 *
 * Safety:
 * - No external API calls, no WebView embedding, no Tauri shell::open (PR 8).
 *   Opening copies the URL to the clipboard — shell integration is a future PR.
 * - No doxxing, people-search, credential-dump, or dark-web resources are
 *   included. They appear as blocked-by-policy cards only.
 * - No data is logged, sent, or automated by this component.
 * - All read-only display. No system mutations.
 */
import { useEffect, useState } from "react";
import { OSINT_CATALOG } from "../../lib/osintCatalog";
import {
  OSINT_CATEGORIES,
  OSINT_RISK_LEVELS,
  OSINT_CATEGORY_LABELS,
  OSINT_RISK_LABELS,
  OSINT_LIMITATION_COPY,
  filterResources,
  riskToVariant,
} from "../../lib/osintNavigatorPresenter";
import type { OsintCategory, OsintConfirmationState, OsintFilterState, OsintResource, OsintRiskLevel } from "../../types/osintNavigator";
import OsintResourceCard from "./OsintResourceCard";
import OsintConfirmationModal from "./OsintConfirmationModal";

interface Props {
  /** Currently selected route pack ID from the dashboard — used for pack-relevance badges. */
  selectedPackId: string | null;
  /** Reports live filter state up to the dashboard so it can feed the real Intel sub-score (PR 20). */
  onFiltersChange?: (filters: OsintFilterState) => void;
}

const FILTER_RISKS: readonly OsintRiskLevel[] = ["low", "medium", "high"];

export default function SotyOsintNavigator({ selectedPackId, onFiltersChange }: Props) {
  const [filters, setFilters] = useState<OsintFilterState>({ categories: [], risks: [] });
  const [confirmation, setConfirmation] = useState<OsintConfirmationState>({
    status: "idle",
    resource: null,
  });

  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  // ── Filter logic ────────────────────────────────────────────────────────────

  function toggleCategory(cat: OsintCategory) {
    setFilters(f =>
      f.categories.includes(cat)
        ? { ...f, categories: f.categories.filter(c => c !== cat) }
        : { ...f, categories: [...f.categories, cat] }
    );
  }

  function toggleRisk(risk: OsintRiskLevel) {
    setFilters(f =>
      f.risks.includes(risk)
        ? { ...f, risks: f.risks.filter(r => r !== risk) }
        : { ...f, risks: [...f.risks, risk] }
    );
  }

  function clearFilters() {
    setFilters({ categories: [], risks: [] });
  }

  // ── Filtered catalog ────────────────────────────────────────────────────────

  const allFiltered = filterResources(OSINT_CATALOG, filters);
  // Split: blocked always shown at bottom of filtered set
  const activeResources = allFiltered.filter(r => r.risk !== "blocked");
  const blockedResources = allFiltered.filter(r => r.risk === "blocked");

  const hasFilters = filters.categories.length > 0 || filters.risks.length > 0;

  // ── Confirmation handlers ───────────────────────────────────────────────────

  function handleOpen(resource: OsintResource) {
    setConfirmation({ status: "pending", resource });
  }

  function handleCancel() {
    setConfirmation({ status: "idle", resource: null });
  }

  async function handleCopy() {
    if (!confirmation.resource?.url) return;
    try {
      await navigator.clipboard.writeText(confirmation.resource.url);
    } catch {
      // Clipboard may be unavailable — user can read the URL from the modal
    }
    setConfirmation(c => ({ ...c, status: "copied" }));
  }

  return (
    <div className="osint-navigator">
      {/* Limitation copy */}
      <div className="banner osint-limitation-banner">
        {OSINT_LIMITATION_COPY}
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="osint-filter-bar">
        <div className="osint-filter-section">
          <span className="osint-filter-label">Category</span>
          <div className="osint-chip-row">
            {OSINT_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`osint-filter-chip${filters.categories.includes(cat) ? " active" : ""}`}
                onClick={() => toggleCategory(cat)}
              >
                {OSINT_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="osint-filter-section">
          <span className="osint-filter-label">Risk level</span>
          <div className="osint-chip-row">
            {FILTER_RISKS.map(risk => {
              const variant = riskToVariant(risk);
              return (
                <button
                  key={risk}
                  className={`osint-filter-chip risk-${variant}${filters.risks.includes(risk) ? " active" : ""}`}
                  onClick={() => toggleRisk(risk)}
                >
                  {OSINT_RISK_LABELS[risk]}
                </button>
              );
            })}
          </div>
        </div>

        {hasFilters && (
          <button className="btn" style={{ fontSize: 11.5, padding: "5px 10px" }} onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {/* ── Result count ───────────────────────────────────────────────── */}
      <div className="osint-result-meta muted">
        {activeResources.length} resource{activeResources.length !== 1 ? "s" : ""}
        {hasFilters ? " matching filters" : ""}
        {selectedPackId ? ` · pack-relevant highlighted` : ""}
      </div>

      {/* ── Active resources ───────────────────────────────────────────── */}
      {activeResources.length === 0 && !hasFilters ? null : (
        <div className="osint-resource-grid">
          {activeResources.length === 0 ? (
            <div className="muted" style={{ padding: "16px 0", fontSize: 13 }}>
              No resources match the selected filters.
            </div>
          ) : (
            activeResources.map(resource => (
              <OsintResourceCard
                key={resource.id}
                resource={resource}
                relevantToSelectedPack={
                  selectedPackId != null &&
                  resource.relevant_pack_ids.includes(selectedPackId)
                }
                onOpen={handleOpen}
              />
            ))
          )}
        </div>
      )}

      {/* ── Blocked resources ──────────────────────────────────────────── */}
      {blockedResources.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="osint-section-divider-label">
            Blocked by policy — {blockedResources.length} entr{blockedResources.length !== 1 ? "ies" : "y"}
          </div>
          <div className="osint-resource-grid">
            {blockedResources.map(resource => (
              <OsintResourceCard
                key={resource.id}
                resource={resource}
                relevantToSelectedPack={false}
                onOpen={handleOpen}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Confirmation modal ─────────────────────────────────────────── */}
      <OsintConfirmationModal
        state={confirmation}
        onCancel={handleCancel}
        onCopy={handleCopy}
      />
    </div>
  );
}
