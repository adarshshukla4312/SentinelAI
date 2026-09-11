"use client";

import { useEffect, useMemo, useState } from "react";
import { BlockchainBadge } from "./components/BlockchainBadge";
import { FaceMatch } from "./components/FaceMatch";
import { ForensicSlider } from "./components/ForensicSlider";
import { PipelineProgress } from "./components/PipelineProgress";
import { RiskScore } from "./components/RiskScore";
import type { ScreeningResponse } from "./types";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export default function CommandCenter() {
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mrz, setMrz] = useState("");
  const [result, setResult] = useState<ScreeningResponse>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!documentFile) {
      setPreviewUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(documentFile);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [documentFile]);

  const biometricTier = useMemo(() => result?.tiers.find((tier) => tier.tier === 4), [result]);

  function selectDocument(file?: File) {
    setError(undefined);
    setResult(undefined);
    if (!file) return;
    if (!acceptedTypes.includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP document image.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("The document image must be 12 MB or smaller.");
      return;
    }
    setDocumentFile(file);
  }

  async function runScreening() {
    if (!documentFile) {
      setError("Choose a document image before starting the screening.");
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    setResult(undefined);
    const payload = new FormData();
    payload.append("document", documentFile);
    if (mrz.trim()) payload.append("mrz", mrz.trim());

    try {
      const response = await fetch("/api/v1/screenings", { method: "POST", body: payload });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? "The screening service could not process this document.");
      setResult(body as ScreeningResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The screening request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetScreening() {
    setDocumentFile(null);
    setMrz("");
    setResult(undefined);
    setError(undefined);
  }

  return (
    <main>
      <nav className="nav-pill" aria-label="SentinelAI navigation">
        <a className="brand" href="#command-center" aria-label="SentinelAI command center">
          <span className="brand-mark">S</span><span>SentinelAI</span>
        </a>
        <div className="nav-links"><a href="#pipeline">Pipeline</a><a href="#evidence">Evidence</a><a href="#ledger">Audit ledger</a></div>
        <span className="nav-security">Cybersecurity / SIH26188</span>
      </nav>

      <section className="hero" id="command-center">
        <p className="eyebrow">Ctrl S · Ministry of Home Affairs · Blockchain & Cybersecurity</p>
        <h1>Verify identity with evidence.</h1>
        <p className="hero-copy">An offline-first command center for five-tier document screening. Every completed check is explainable, and every decision is protected by a hash-chained audit receipt.</p>
      </section>

      <section className="workspace" aria-label="Screening workspace">
        <section className="upload-card" aria-labelledby="upload-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">New screening</p>
              <h2 id="upload-heading">Scan a document.</h2>
            </div>
            {documentFile && <button className="text-button" type="button" onClick={resetScreening}>Reset</button>}
          </div>

          <label className={`dropzone ${documentFile ? "has-file" : ""}`} htmlFor="document-upload">
            <input
              accept="image/jpeg,image/png,image/webp"
              id="document-upload"
              onChange={(event) => selectDocument(event.target.files?.[0])}
              type="file"
            />
            {previewUrl ? <img src={previewUrl} alt="Selected document preview" /> : <span className="scan-glyph">⌁</span>}
            <span className="dropzone-title">{documentFile ? documentFile.name : "Drop a scan here."}</span>
            <span className="dropzone-copy">{documentFile ? `${Math.ceil(documentFile.size / 1024)} KB · ready to screen` : "JPEG, PNG or WebP · maximum 12 MB"}</span>
          </label>

          <label className="mrz-field" htmlFor="mrz-input">
            <span>Optional passport MRZ</span>
            <textarea
              id="mrz-input"
              maxLength={90}
              onChange={(event) => setMrz(event.target.value)}
              placeholder={"Paste the two-line TD3 MRZ to enable ICAO check-digit validation.\nIt is normally populated by the OCR adapter."}
              rows={3}
              value={mrz}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button-primary screen-button" disabled={isSubmitting} onClick={runScreening} type="button">
            {isSubmitting ? "Screening document…" : "Run screening"}
          </button>
          <p className="privacy-line">Source image is removed after processing. Biometric templates are never stored.</p>
        </section>

        <div id="pipeline"><PipelineProgress tiers={result?.tiers ?? []} loading={isSubmitting} /></div>
      </section>

      <section className="results-grid" id="evidence">
        <ForensicSlider heatmapUrl={result?.artifacts.heatmap_url} originalUrl={previewUrl} />
        <RiskScore decision={result?.decision} reasons={result?.reasons} risk={result?.risk_score} />
        <FaceMatch tier={biometricTier} />
        <div id="ledger"><BlockchainBadge result={result} /></div>
      </section>

      {result && (
        <section className="receipt-bar" aria-label="Evidence receipt actions">
          <div>
            <p className="eyebrow">Screening receipt</p>
            <p>Session <code>{result.screening_id}</code> · {new Date(result.created_at).toLocaleString()}</p>
          </div>
          <a className="button-primary" href={`/api/v1/screenings/${result.screening_id}/evidence.pdf`}>Download PDF receipt</a>
        </section>
      )}

      <footer>
        <div><span className="footer-mark">S</span><strong>SentinelAI</strong></div>
        <p>AI-based fake identity and document screening for accountable checkpoints.</p>
        <span>Ctrl S · SIH26188</span>
      </footer>
    </main>
  );
}
