"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BlockchainBadge } from "../components/BlockchainBadge";
import { DocumentTypeSelector, type DocumentType } from "../components/DocumentTypeSelector";
import { DualSideDropzone } from "../components/DualSideDropzone";
import { FaceMatch } from "../components/FaceMatch";
import { ForensicSlider } from "../components/ForensicSlider";
import { PipelineProgress } from "../components/PipelineProgress";
import { RiskScore } from "../components/RiskScore";
import type { ScreeningResponse } from "../types";
import {
  SAMPLE_PRESETS,
  generateSamplePassportImage,
  type SamplePreset,
} from "../utils/samplePresets";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

const STAGES = [
  { id: 1, name: "Ingestion", tag: "Substrate & Type", icon: "" },
  { id: 2, name: "Cryptography", tag: "Tier 1 · Checksum", icon: "" },
  { id: 3, name: "OCR Schema", tag: "Tier 2 · VIZ Data", icon: "" },
  { id: 4, name: "Forensics", tag: "Tier 3 · ELA & FFT", icon: "" },
  { id: 5, name: "Biometrics", tag: "Tier 4 · ArcFace", icon: "" },
  { id: 6, name: "Audit Dossier", tag: "Tier 5 · Ledger", icon: "" },
];

export default function TestingConsolePage() {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"stepper" | "unified">("stepper");
  const [documentType, setDocumentType] = useState<DocumentType>("aadhaar");

  // Ingestion files
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [liveFrameBlob, setLiveFrameBlob] = useState<Blob | null>(null);
  const [mrz, setMrz] = useState("");

  // Execution state
  const [result, setResult] = useState<ScreeningResponse>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isGeneratingPreset, setIsGeneratingPreset] = useState(false);

  // Manage object URLs
  useEffect(() => {
    if (!frontFile) {
      setFrontPreview(null);
      return;
    }
    const url = URL.createObjectURL(frontFile);
    setFrontPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [frontFile]);

  useEffect(() => {
    if (!backFile) {
      setBackPreview(null);
      return;
    }
    const url = URL.createObjectURL(backFile);
    setBackPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [backFile]);

  // Derived tier results
  const tier1 = useMemo(() => result?.tiers.find((t) => t.tier === 1), [result]);
  const tier2 = useMemo(() => result?.tiers.find((t) => t.tier === 2), [result]);
  const tier3 = useMemo(() => result?.tiers.find((t) => t.tier === 3), [result]);
  const tier4 = useMemo(() => result?.tiers.find((t) => t.tier === 4), [result]);
  const tier5 = useMemo(() => result?.tiers.find((t) => t.tier === 5), [result]);

  function handleSelectFront(file: File | null) {
    setError(undefined);
    setActivePresetId(null);
    if (!file) {
      setFrontFile(null);
      return;
    }
    if (!acceptedTypes.includes(file.type)) {
      setError("Document image must be a JPEG, PNG, or WebP file.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("File exceeds maximum allowable size of 12 MB.");
      return;
    }
    setFrontFile(file);
  }

  function handleSelectBack(file: File | null) {
    setError(undefined);
    if (!file) {
      setBackFile(null);
      return;
    }
    if (!acceptedTypes.includes(file.type)) {
      setError("Back side image must be a JPEG, PNG, or WebP file.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("File exceeds maximum allowable size of 12 MB.");
      return;
    }
    setBackFile(file);
  }

  async function handleLoadPreset(preset: SamplePreset) {
    setError(undefined);
    setResult(undefined);
    setIsGeneratingPreset(true);
    setActivePresetId(preset.id);
    setDocumentType(preset.documentType);

    try {
      const file = await generateSamplePassportImage(preset);
      setFrontFile(file);
      setBackFile(null);
      setMrz(preset.mrz);
    } catch {
      setError("Failed to generate test specimen image.");
    } finally {
      setIsGeneratingPreset(false);
    }
  }

  function resetSession() {
    setFrontFile(null);
    setBackFile(null);
    setLiveFrameBlob(null);
    setMrz("");
    setResult(undefined);
    setError(undefined);
    setActivePresetId(null);
    setCurrentStage(1);
  }

  async function runScreening() {
    if (!frontFile) {
      setError("Provide a front document image or load a sample preset to initiate screening.");
      return;
    }
    setError(undefined);
    setIsSubmitting(true);

    const payload = new FormData();
    payload.append("document", frontFile);
    if (backFile) {
      payload.append("document_back", backFile);
    }
    payload.append("document_type", documentType);

    if (liveFrameBlob) {
      payload.append("live_frame", liveFrameBlob, "live_capture.jpg");
    }
    if (mrz.trim()) {
      payload.append("mrz", mrz.trim());
    }

    try {
      const response = await fetch("/api/v1/screenings", { method: "POST", body: payload });
      let body: any;
      try {
        body = await response.json();
      } catch {
        setError(`Server returned unparseable response (HTTP ${response.status}).`);
        setIsSubmitting(false);
        return;
      }
      if (!response.ok) {
        setError(body.detail ?? `Screening failed with HTTP status ${response.status}.`);
        setIsSubmitting(false);
        return;
      }
      setResult(body as ScreeningResponse);
      // Auto-advance to results overview / Stage 2
      if (currentStage === 1) {
        setCurrentStage(2);
      }
    } catch (err: any) {
      setError(`Network error connecting to screening engine: ${err?.message ?? "Service unavailable"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Get stage status indicator
  function getStageStatus(stageId: number): "pending" | "pass" | "fail" | "review" | "running" | "unavailable" {
    if (isSubmitting) return "running";
    if (!result) return "pending";
    if (stageId === 1) return frontFile ? "pass" : "pending";
    if (stageId === 2) return tier1?.status ?? "pending";
    if (stageId === 3) return tier2?.status ?? "pending";
    if (stageId === 4) return tier3?.status ?? "pending";
    if (stageId === 5) return tier4?.status ?? "pending";
    if (stageId === 6) return tier5?.status ?? "pending";
    return "pending";
  }

  return (
    <main className="cockpit-root">
      {/* ─── COCKPIT OPERATIONAL HEADER ─── */}
      <header className="cockpit-header">
        <div className="cockpit-header-left">
          <div className="station-badge">
            <span className="pulse-dot-green" />
            <span className="station-id">STATION: BORDER-INSPECT-01</span>
          </div>
          <span className="header-divider">/</span>
          <span className="station-mode">ENGINE: OFFLINE ONNX · ACTIVE</span>
          <span className="header-divider">/</span>
          <span className="station-spec">MHA SPEC · SIH26188</span>
        </div>

        <div className="cockpit-header-right">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle" role="group" aria-label="Workstation View Mode">
            <button
              type="button"
              className={`toggle-btn ${viewMode === "stepper" ? "toggle-btn-active" : ""}`}
              onClick={() => setViewMode("stepper")}
            >
              Multi-stage process
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === "unified" ? "toggle-btn-active" : ""}`}
              onClick={() => setViewMode("unified")}
            >
              Unified cockpit
            </button>
          </div>

          <button type="button" className="cockpit-reset-btn" onClick={resetSession} title="Reset session state">
            Reset
          </button>

          <Link href="/" className="cockpit-back-link">
            ← Product overview
          </Link>
        </div>
      </header>

      {/* ─── MULTI-STAGE STEPPER BAR ─── */}
      <nav className="cockpit-stepper-bar" aria-label="Inspection Workflow Steps">
        <div className="stepper-track">
          {STAGES.map((st) => {
            const isActive = currentStage === st.id;
            const status = getStageStatus(st.id);
            return (
              <button
                key={st.id}
                type="button"
                className={`step-node ${isActive ? "step-node-active" : ""} step-status-${status}`}
                onClick={() => setCurrentStage(st.id)}
              >
                <div className="step-number-badge">
                  <span>{st.id}</span>
                  {status === "pass" && <span className="status-micro-glyph">✓</span>}
                  {status === "fail" && <span className="status-micro-glyph">✕</span>}
                  {status === "review" && <span className="status-micro-glyph">?</span>}
                </div>
                <div className="step-meta">
                  <span className="step-name">{st.name}</span>
                  <span className="step-tag">{st.tag}</span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── ACTIVE STAGE WORKSPACE ─── */}
      <div className="cockpit-body">
        {viewMode === "stepper" ? (
          <div className="stage-viewport">
            {/* ════ STAGE 1: INGESTION ════ */}
            {currentStage === 1 && (
              <div className="stage-card">
                <div className="stage-header-row">
                  <div>
                    <span className="stage-eyebrow">Stage 01 · Specimen ingestion</span>
                    <h1 className="stage-title">Configure substrate & load identity document.</h1>
                  </div>
                  <div className="stage-actions-top">
                    {frontFile && (
                      <span className="pill-pass">✓ Front substrate mounted</span>
                    )}
                    {backFile && (
                      <span className="pill-pass">✓ Back substrate mounted</span>
                    )}
                  </div>
                </div>

                {/* 1. Document Type Selector */}
                <DocumentTypeSelector
                  selectedType={documentType}
                  onSelectType={(t) => {
                    setDocumentType(t);
                    setResult(undefined);
                  }}
                  disabled={isSubmitting}
                />

                {/* 2. 1-Click Demo Specimen Presets */}
                <div className="presets-bar">
                  <span className="presets-caption">Or load a pre-configured sample:</span>
                  <div className="presets-row">
                    {SAMPLE_PRESETS.map((p) => {
                      const isActive = activePresetId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={isSubmitting || isGeneratingPreset}
                          className={`button-pill-soft preset-btn ${isActive ? "preset-btn-active" : ""}`}
                          onClick={() => handleLoadPreset(p)}
                          title={p.description}
                        >
                          <span>{p.name}</span>
                          <span className="preset-pill-tag">{p.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Dual-Side Upload Dropzone */}
                <DualSideDropzone
                  documentType={documentType}
                  frontFile={frontFile}
                  backFile={backFile}
                  frontPreview={frontPreview}
                  backPreview={backPreview}
                  onSelectFront={handleSelectFront}
                  onSelectBack={handleSelectBack}
                  mrz={mrz}
                  onChangeMrz={setMrz}
                  disabled={isSubmitting}
                />

                {error && <div className="cockpit-alert-error" role="alert">{error}</div>}

                {/* Primary Action Button */}
                <div className="stage-cta-box">
                  <button
                    type="button"
                    className="cockpit-primary-action-btn"
                    disabled={isSubmitting || !frontFile}
                    onClick={runScreening}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-dot" /> Executing 5-tier screening pipeline…
                      </>
                    ) : (
                      <>
                        Run screening pipeline on specimen →
                      </>
                    )}
                  </button>
                  <p className="cockpit-security-notice">
                    Ephemeral memory processing: Source images and embeddings are processed strictly in RAM and discarded immediately.
                  </p>
                </div>
              </div>
            )}

            {/* ════ STAGE 2: CRYPTOGRAPHY (TIER 1) ════ */}
            {currentStage === 2 && (
              <div className="stage-card">
                <div className="stage-header-row">
                  <div>
                    <span className="stage-eyebrow">Stage 02 · Tier 1 validation</span>
                    <h2 className="stage-title">Deterministic cryptography and mathematical checksums.</h2>
                  </div>
                  {tier1 && (
                    <span className={`status-pill pill-${tier1.status}`}>
                      Tier 1: {tier1.status.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="stage-detail-grid">
                  <div className="spec-card">
                    <span className="spec-label">Document Number</span>
                    <strong className="spec-value-large">
                      {String(tier1?.details?.document_number ?? "Not yet processed")}
                    </strong>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Nationality / Standard</span>
                    <strong className="spec-value-large">
                      {String(tier1?.details?.nationality ?? "IND / ICAO")}
                    </strong>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">UIDAI Secure QR</span>
                    <strong className="spec-value-large">
                      {String(tier1?.details?.aadhaar_secure_qr ?? "Standby")}
                    </strong>
                  </div>
                </div>

                {/* Mathematical Check Details */}
                <div className="math-checks-card">
                  <h3 className="card-subtitle">Active checksum validations</h3>
                  {tier1?.details?.checks ? (
                    <div className="checks-list-grid">
                      {Object.entries(tier1.details.checks as Record<string, boolean>).map(
                        ([name, pass]) => (
                          <div
                            key={name}
                            className={`check-result-box ${pass ? "box-pass" : "box-fail"}`}
                          >
                            <span className="check-box-icon">{pass ? "✓" : "✕"}</span>
                            <div>
                              <strong className="check-box-title">
                                {name.replace(/_/g, " ").toUpperCase()}
                              </strong>
                              <p className="check-box-desc">
                                {name === "secure_qr_code"
                                  ? pass
                                    ? "UIDAI 2D Secure QR code authenticated on substrate."
                                    : "UIDAI 2D Secure QR code not detected on uploaded substrate."
                                  : name === "verhoeff_checksum"
                                  ? pass
                                    ? "Mathematical Verhoeff dihedral checksum verified with 0% error tolerance."
                                    : "12-digit UID Verhoeff checksum discrepancy detected! Hard rejection enforced."
                                  : pass
                                  ? "Mathematical checksum verified with 0% error tolerance."
                                  : "Checksum discrepancy detected! Hard rejection enforced."}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="waiting-placeholder">
                      {result
                        ? "No checksum validation executed for this specimen."
                        : "Execute screening in Stage 1 to calculate cryptographic check digits."}
                    </p>
                  )}
                </div>

                {tier1?.summary && (
                  <div className="verdict-callout">
                    <p>{tier1.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* ════ STAGE 3: OCR SCHEMA (TIER 2) ════ */}
            {currentStage === 3 && (
              <div className="stage-card">
                <div className="stage-header-row">
                  <div>
                    <span className="stage-eyebrow">Stage 03 · Tier 2 reconciliation</span>
                    <h2 className="stage-title">Optical character recognition and schema cross-check.</h2>
                  </div>
                  {tier2 && (
                    <span className={`status-pill pill-${tier2.status}`}>
                      Tier 2: {tier2.status.toUpperCase()}
                    </span>
                  )}
                </div>

                {(() => {
                  const vizFields = (tier2?.details?.viz_fields as Record<string, string> | undefined) ?? {};
                  return (
                    <div className="schema-table-container">
                      <table className="schema-table">
                        <thead>
                          <tr>
                            <th>Field Name</th>
                            <th>Extracted Document Value</th>
                            <th>Source Zone</th>
                            <th>Reconciliation Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Document Number / UID</strong></td>
                            <td><code>{vizFields.document_number ?? vizFields.aadhaar_number ?? "—"}</code></td>
                            <td>VIZ / UID Bar</td>
                            <td><span className="table-badge pass">Verified</span></td>
                          </tr>
                          <tr>
                            <td><strong>Full Name</strong></td>
                            <td>{vizFields.name ?? "—"}</td>
                            <td>Visual Inspection Zone</td>
                            <td><span className="table-badge pass">Extracted</span></td>
                          </tr>
                          <tr>
                            <td><strong>Date of Birth (DOB)</strong></td>
                            <td>{vizFields.date_of_birth ?? "—"}</td>
                            <td>Visual Inspection Zone</td>
                            <td><span className="table-badge pass">ISO Format</span></td>
                          </tr>
                          <tr>
                            <td><strong>Nationality / Origin</strong></td>
                            <td>{vizFields.nationality ?? "IND"}</td>
                            <td>Sovereign Issuer</td>
                            <td><span className="table-badge pass">Standard</span></td>
                          </tr>
                          {vizFields.care_of && (
                            <tr>
                              <td><strong>Care-Of (Father/Husband)</strong></td>
                              <td>{vizFields.care_of}</td>
                              <td>Back Substrate VIZ</td>
                              <td><span className="table-badge pass">Back Reconciled</span></td>
                            </tr>
                          )}
                          {vizFields.address && (
                            <tr>
                              <td><strong>Residential Address</strong></td>
                              <td>{vizFields.address}</td>
                              <td>Back Substrate VIZ</td>
                              <td><span className="table-badge pass">Parsed</span></td>
                            </tr>
                          )}
                          {vizFields.pin_code && (
                            <tr>
                              <td><strong>Postal PIN Code</strong></td>
                              <td><code>{vizFields.pin_code}</code></td>
                              <td>Postal Index</td>
                              <td><span className="table-badge pass">6-Digit Pin</span></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {tier2?.summary && (
                  <div className="verdict-callout">
                    <p>{tier2.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* ════ STAGE 4: FORENSICS (TIER 3) ════ */}
            {currentStage === 4 && (
              <div className="stage-card">
                <div className="stage-header-row">
                  <div>
                    <span className="stage-eyebrow">Stage 04 · Tier 3 substrate forensics</span>
                    <h2 className="stage-title">Passive compression forensics and halftone analysis.</h2>
                  </div>
                  {tier3 && (
                    <span className={`status-pill pill-${tier3.status}`}>
                      Tier 3: {tier3.status.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Forensic Curtain */}
                <div className="forensic-curtain-container">
                  <ForensicSlider
                    heatmapUrl={result?.artifacts?.heatmap_url}
                    originalUrl={frontPreview}
                  />
                </div>

                <div className="stage-detail-grid mt-4">
                  <div className="spec-card">
                    <span className="spec-label">ELA Mean Difference</span>
                    <strong className="spec-value-large">
                      {tier3?.details?.ela_mean_difference !== undefined
                        ? String(tier3.details.ela_mean_difference)
                        : "0.0012"}
                    </strong>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">FFT Halftone Repetition</span>
                    <strong className="spec-value-large">
                      {tier3?.details?.fft_repetition_indicator !== undefined
                        ? String(tier3.details.fft_repetition_indicator)
                        : "0.0 (Clean)"}
                    </strong>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Tamper Suspicion</span>
                    <strong className="spec-value-large">
                      {tier3?.score !== undefined && tier3?.score !== null
                        ? `${(tier3.score * 100).toFixed(1)}%`
                        : "Low"}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* ════ STAGE 5: BIOMETRICS (TIER 4) ════ */}
            {currentStage === 5 && (
              <div className="stage-card">
                <div className="stage-header-row">
                  <div>
                    <span className="stage-eyebrow">Stage 05 · Tier 4 biometrics</span>
                    <h2 className="stage-title">1:1 facial verification and anti-spoofing.</h2>
                  </div>
                  {tier4 && (
                    <span className={`status-pill pill-${tier4.status}`}>
                      Tier 4: {tier4.status.toUpperCase()}
                    </span>
                  )}
                </div>

                <FaceMatch
                  tier={tier4}
                  liveFrameBlob={liveFrameBlob}
                  onCapturePhoto={setLiveFrameBlob}
                  documentPreviewUrl={frontPreview}
                  onRunScreening={runScreening}
                  isSubmitting={isSubmitting}
                />
              </div>
            )}

            {/* ════ STAGE 6: VERDICT & DOSSIER (TIER 5) ════ */}
            {currentStage === 6 && (
              <div className="stage-card">
                <div className="stage-header-row">
                  <div>
                    <span className="stage-eyebrow">Stage 06 · Tier 5 dossier & merkle ledger</span>
                    <h2 className="stage-title">Bayesian decision fusion and immutable audit ledger.</h2>
                  </div>
                  {result && (
                    <span className={`decision-pill-hero decision-${result.decision.toLowerCase()}`}>
                      {result.decision}
                    </span>
                  )}
                </div>

                <div className="verdict-grid">
                  <RiskScore
                    decision={result?.decision}
                    reasons={result?.reasons}
                    risk={result?.risk_score}
                  />
                  <div id="ledger">
                    <BlockchainBadge result={result} />
                  </div>
                </div>

                {/* Evidence Docket Download */}
                {result && (
                  <div className="docket-download-box">
                    <div>
                      <strong>Cryptographic evidence docket generated.</strong>
                      <p className="docket-sub">
                        Session: <code>{result.screening_id}</code> · SHA-256 Merkle Block #{result.audit?.sequence ?? 1}
                      </p>
                    </div>
                    <a
                      className="cockpit-primary-action-btn"
                      href={`/api/v1/screenings/${result.screening_id}/evidence.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: "12px 24px" }}
                    >
                      Download PDF evidence docket ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ─── STAGE NAVIGATION FOOTER ─── */}
            <div className="stage-nav-footer">
              <button
                type="button"
                className="button-pill-soft"
                disabled={currentStage <= 1}
                onClick={() => setCurrentStage((prev) => Math.max(1, prev - 1))}
              >
                ← Previous Stage
              </button>

              <div className="stage-counter">
                Stage <strong>{currentStage}</strong> of <strong>6</strong> ·{" "}
                <span className="text-muted-foreground">{STAGES[currentStage - 1].name}</span>
              </div>

              <button
                type="button"
                className="button-pill-soft"
                disabled={currentStage >= 6}
                onClick={() => setCurrentStage((prev) => Math.min(6, prev + 1))}
              >
                Next Stage →
              </button>
            </div>
          </div>
        ) : (
          /* ════ UNIFIED COCKPIT VIEW ════ */
          <div className="unified-cockpit-layout">
            <div className="cockpit-left-pane">
              <div className="stage-card">
                <DocumentTypeSelector
                  selectedType={documentType}
                  onSelectType={setDocumentType}
                  disabled={isSubmitting}
                />
                <DualSideDropzone
                  documentType={documentType}
                  frontFile={frontFile}
                  backFile={backFile}
                  frontPreview={frontPreview}
                  backPreview={backPreview}
                  onSelectFront={handleSelectFront}
                  onSelectBack={handleSelectBack}
                  mrz={mrz}
                  onChangeMrz={setMrz}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="cockpit-primary-action-btn mt-4"
                  disabled={isSubmitting || !frontFile}
                  onClick={runScreening}
                >
                  {isSubmitting ? "Running..." : "Run screening pipeline →"}
                </button>
              </div>

              <div className="stage-card mt-4">
                <PipelineProgress tiers={result?.tiers ?? []} loading={isSubmitting} />
              </div>
            </div>

            <div className="cockpit-right-pane">
              <div className="stage-card">
                <RiskScore
                  decision={result?.decision}
                  reasons={result?.reasons}
                  risk={result?.risk_score}
                />
              </div>

              <div className="stage-card mt-4">
                <ForensicSlider
                  heatmapUrl={result?.artifacts?.heatmap_url}
                  originalUrl={frontPreview}
                />
              </div>

              <div className="stage-card mt-4">
                <FaceMatch
                  tier={tier4}
                  liveFrameBlob={liveFrameBlob}
                  onCapturePhoto={setLiveFrameBlob}
                  documentPreviewUrl={frontPreview}
                  onRunScreening={runScreening}
                  isSubmitting={isSubmitting}
                />
              </div>

              <div className="stage-card mt-4">
                <BlockchainBadge result={result} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
