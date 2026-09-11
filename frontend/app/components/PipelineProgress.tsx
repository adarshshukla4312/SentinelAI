"use client";

import { useState } from "react";
import type { TierResult } from "../types";

const tierLabels = [
  "Cryptographic validation",
  "OCR & schema checks",
  "Passive forensics",
  "Live biometrics",
  "Fusion & audit",
];

const tierSubtitles = [
  "Deterministic ICAO 9303 check-digit & QR verification",
  "PP-OCRv4 text detection with visual-to-MRZ reconciliation",
  "Error Level Analysis (ELA) & FFT frequency spectrum checks",
  "1:1 ArcFace facial verification with MiniFASNet anti-spoofing",
  "Deterministic Bayesian risk scoring & SHA-256 blockchain anchoring",
];

function renderStatusBadge(status: TierResult["status"] | "waiting" | "running") {
  if (status === "pass") {
    return (
      <span className="tier-status-pill tier-status-pass">
        <span className="tier-status-icon">✓</span> Verified
      </span>
    );
  }
  if (status === "review") {
    return (
      <span className="tier-status-pill tier-status-review">
        <span className="tier-status-icon">⚠</span> Review
      </span>
    );
  }
  if (status === "fail") {
    return (
      <span className="tier-status-pill tier-status-fail">
        <span className="tier-status-icon">✕</span> Failed
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="tier-status-pill tier-status-running">
        <span className="tier-status-pulse" /> Running
      </span>
    );
  }
  if (status === "unavailable") {
    return (
      <span className="tier-status-pill tier-status-neutral">
        Standby
      </span>
    );
  }
  return (
    <span className="tier-status-pill tier-status-neutral">
      Waiting
    </span>
  );
}

export function PipelineProgress({ tiers, loading }: { tiers: TierResult[]; loading: boolean }) {
  const [expandedTiers, setExpandedTiers] = useState<Record<number, boolean>>({});

  function toggleTier(tierNum: number) {
    setExpandedTiers((prev) => ({ ...prev, [tierNum]: !prev[tierNum] }));
  }

  function expandAll() {
    setExpandedTiers({ 1: true, 2: true, 3: true, 4: true, 5: true });
  }

  function collapseAll() {
    setExpandedTiers({});
  }

  const hasAnyResults = tiers.length > 0;

  return (
    <section className="pipeline-card" aria-labelledby="pipeline-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Five-tier pipeline</p>
          <h2 id="pipeline-heading">Screening status.</h2>
        </div>
        <div className="pipeline-controls">
          {hasAnyResults && (
            <div className="accordion-actions">
              <button className="text-button" type="button" onClick={expandAll}>
                Expand all
              </button>
              <span className="dot-divider">·</span>
              <button className="text-button" type="button" onClick={collapseAll}>
                Collapse
              </button>
            </div>
          )}
          <span className={`live-marker ${loading ? "is-running" : ""}`}>
            {loading ? "Processing" : "Local-first"}
          </span>
        </div>
      </div>

      <ol className="tier-list">
        {tierLabels.map((label, index) => {
          const tierIndex = index + 1;
          const result = tiers.find((tier) => tier.tier === tierIndex);
          const status = result?.status ?? (loading ? "running" : "waiting");
          const isExpanded = Boolean(expandedTiers[tierIndex]);
          const details = result?.details ?? {};

          return (
            <li className={`tier-item tier-${status}`} key={label}>
              <div
                className="tier-row"
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onClick={() => toggleTier(tierIndex)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleTier(tierIndex);
                  }
                }}
              >
                <span className={`tier-number tier-number-t${tierIndex}`}>
                  {String(tierIndex).padStart(2, "0")}
                </span>
                <div className="tier-copy">
                  <div className="tier-header-row">
                    <span className="tier-name">{result?.title ?? label}</span>
                    <span className="tier-subtitle-tag">{tierSubtitles[index]}</span>
                  </div>
                  <span className="tier-summary">
                    {result?.summary ?? "Awaiting a document scan."}
                  </span>
                </div>
                <div className="tier-actions">
                  {renderStatusBadge(status)}
                  <span className={`tier-chevron ${isExpanded ? "is-open" : ""}`} aria-hidden="true">
                    ▾
                  </span>
                </div>
              </div>

              {/* Structured evidence drawer panel */}
              {isExpanded && (
                <div className="tier-drawer" aria-label={`Evidence breakdown for tier ${tierIndex}`}>
                  {result ? (
                    <TierEvidenceDetails tierIndex={tierIndex} result={result} details={details} />
                  ) : (
                    <p className="tier-drawer-empty">
                      No telemetry recorded yet. Run a screening to inspect verification checkpoints.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TierEvidenceDetails({
  tierIndex,
  result,
  details,
}: {
  tierIndex: number;
  result: TierResult;
  details: Record<string, any>;
}) {
  // Tier 1: Cryptographic check digits
  if (tierIndex === 1) {
    const checks = details.checks as Record<string, boolean> | undefined;
    return (
      <div className="drawer-content">
        <div className="drawer-grid">
          <div className="drawer-item">
            <span className="drawer-label">Document Number</span>
            <span className="drawer-value">
              {details.document_number ? String(details.document_number) : "Not supplied"}
            </span>
          </div>
          <div className="drawer-item">
            <span className="drawer-label">Nationality</span>
            <span className="drawer-value">
              {details.nationality ? String(details.nationality) : "Not supplied"}
            </span>
          </div>
          <div className="drawer-item">
            <span className="drawer-label">Aadhaar Secure QR</span>
            <span className="drawer-value">{String(details.aadhaar_secure_qr ?? "Standby")}</span>
          </div>
        </div>

        {checks && (
          <div className="check-digits-section">
            <span className="section-eyebrow">ICAO 9303 Check Digits:</span>
            <div className="check-chips">
              {Object.entries(checks).map(([checkName, passed]) => (
                <span
                  key={checkName}
                  className={`check-chip ${passed ? "check-pass" : "check-fail"}`}
                >
                  <span className="check-icon">{passed ? "✓" : "✗"}</span>
                  {checkName.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {details.error && (
          <div className="drawer-alert">
            <strong>Check failure note:</strong> {String(details.error)}
          </div>
        )}
      </div>
    );
  }

  // Tier 2: OCR & Cross-checking
  if (tierIndex === 2) {
    const checks = details.checks as Record<string, boolean> | undefined;
    const mismatches = details.mismatches as Record<string, any> | undefined;
    const viz = details.viz_fields as Record<string, any> | undefined;
    const mrz = details.mrz_fields as Record<string, any> | undefined;

    return (
      <div className="drawer-content">
        <div className="drawer-grid">
          <div className="drawer-item">
            <span className="drawer-label">OCR Adapter</span>
            <span className="drawer-value">{String(details.adapter ?? "RapidOCR")}</span>
          </div>
          <div className="drawer-item">
            <span className="drawer-label">Detected Text Blocks</span>
            <span className="drawer-value">{String(details.text_blocks_count ?? 0)} blocks</span>
          </div>
          <div className="drawer-item">
            <span className="drawer-label">MRZ Zone Detected</span>
            <span className="drawer-value">{details.mrz_detected ? "Yes (TD3 2-line)" : "No"}</span>
          </div>
        </div>

        {(viz || mrz) && (
          <div className="recon-table-wrapper">
            <table className="recon-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Visual Zone (VIZ)</th>
                  <th>Machine Zone (MRZ)</th>
                  <th>Match</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Passport No</td>
                  <td>{viz?.passport_number ?? "—"}</td>
                  <td>{mrz?.passport_number ?? "—"}</td>
                  <td>
                    {checks?.passport_number ? (
                      <span className="check-pass-text">✓ Match</span>
                    ) : (
                      <span className="check-fail-text">✗ Discrepancy</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Holder Name</td>
                  <td>{viz?.name ?? "—"}</td>
                  <td>{mrz?.name ?? "—"}</td>
                  <td>
                    {checks?.name ? (
                      <span className="check-pass-text">✓ Match</span>
                    ) : (
                      <span className="check-fail-text">✗ Discrepancy</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Date of Birth</td>
                  <td>{viz?.date_of_birth ?? "—"}</td>
                  <td>{mrz?.date_of_birth ?? "—"}</td>
                  <td>
                    {checks?.date_of_birth ? (
                      <span className="check-pass-text">✓ Match</span>
                    ) : (
                      <span className="check-fail-text">✗ Discrepancy</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {mismatches && Object.keys(mismatches).length > 0 && (
          <div className="drawer-alert alert-danger">
            <strong>Cross-check warning:</strong> Mismatches identified between visual inspection zone and machine-readable zone:
            <ul>
              {Object.entries(mismatches).map(([k, v]) => (
                <li key={k}>
                  <strong>{k}:</strong> {JSON.stringify(v)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Tier 3: Passive forensics
  if (tierIndex === 3) {
    const elaDiff = typeof details.ela_mean_difference === "number"
      ? (details.ela_mean_difference * 100).toFixed(3) + "%"
      : String(details.ela_mean_difference ?? "N/A");

    const fftVal = typeof details.fft_repetition_indicator === "number"
      ? (details.fft_repetition_indicator * 100).toFixed(2) + "%"
      : String(details.fft_repetition_indicator ?? "N/A");

    return (
      <div className="drawer-content">
        <div className="drawer-grid">
          <div className="drawer-item">
            <span className="drawer-label">ELA Mean Difference</span>
            <span className="drawer-value">
              <span className="drawer-badge drawer-badge-violet">{elaDiff}</span>
            </span>
          </div>
          <div className="drawer-item">
            <span className="drawer-label">FFT Halftone Repetition</span>
            <span className="drawer-value">
              <span className="drawer-badge drawer-badge-violet">{fftVal}</span>
            </span>
          </div>
          <div className="drawer-item">
            <span className="drawer-label">Heuristic Suspicion</span>
            <span className="drawer-value">
              <span className="drawer-badge drawer-badge-violet">
                {result.score !== null ? `${(result.score * 100).toFixed(1)}%` : "N/A"}
              </span>
            </span>
          </div>
        </div>
        <p className="drawer-note">
          {details.method_note
            ? String(details.method_note)
            : "Error-level compression difference highlights re-saved tampered regions. FFT detects periodic digital print half-tones."}
        </p>
      </div>
    );
  }

  // Tier 4: Live biometrics
  if (tierIndex === 4) {
    return (
      <div className="drawer-content">
        <div className="drawer-grid">
          <div className="drawer-item">
            <span className="drawer-label">Facial Similarity</span>
            <span className="drawer-value">
              <span className="drawer-badge drawer-badge-orange">
                {result.score !== null
                  ? `${(result.score * 100).toFixed(1)}%`
                  : String(details.similarity ?? "N/A")}
              </span>
            </span>
          </div>
          <div className="drawer-item">
            <span className="drawer-label">1:1 ArcFace Match</span>
            <span className="drawer-value">
              <span className="drawer-badge drawer-badge-orange">{String(details.face_match ?? "Evaluated")}</span>
            </span>
          </div>
          <div className="drawer-item">
            <span className="drawer-label">MiniFASNet Liveness</span>
            <span className="drawer-value">
              <span className="drawer-badge drawer-badge-orange">{String(details.liveness ?? "Evaluated")}</span>
            </span>
          </div>
        </div>
        <p className="drawer-note">
          {result.summary} · Ephemeral vectors are purged from RAM immediately following decision aggregation.
        </p>
      </div>
    );
  }

  // Tier 5: Fusion & Blockchain
  return (
    <div className="drawer-content">
      <div className="drawer-grid">
        <div className="drawer-item">
          <span className="drawer-label">Aggregated Risk</span>
          <span className="drawer-value">
            <span className="drawer-badge drawer-badge-emerald">
              {result.score !== null ? `${Math.round((1 - result.score) * 100)} / 100` : "Calculated"}
            </span>
          </span>
        </div>
        <div className="drawer-item">
          <span className="drawer-label">Deterministic Decision</span>
          <span className="drawer-value">
            <span className="drawer-badge drawer-badge-emerald">{result.status.toUpperCase()}</span>
          </span>
        </div>
        <div className="drawer-item">
          <span className="drawer-label">Audit Proof</span>
          <span className="drawer-value">
            <span className="drawer-badge drawer-badge-emerald">SHA-256 Chained</span>
          </span>
        </div>
      </div>
      <p className="drawer-note">{result.summary}</p>
    </div>
  );
}
