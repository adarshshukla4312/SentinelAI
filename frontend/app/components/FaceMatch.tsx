"use client";

import { useEffect, useRef, useState } from "react";
import type { TierResult } from "../types";

interface FaceMatchProps {
  tier?: TierResult;
  liveFrameBlob?: Blob | null;
  onCapturePhoto?: (blob: Blob | null) => void;
  documentPreviewUrl?: string | null;
  onRunScreening?: () => void;
  isSubmitting?: boolean;
}

export function FaceMatch({
  tier,
  liveFrameBlob,
  onCapturePhoto,
  documentPreviewUrl,
  onRunScreening,
  isSubmitting = false,
}: FaceMatchProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Manage preview URL for captured blob
  useEffect(() => {
    if (!liveFrameBlob) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(liveFrameBlob);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [liveFrameBlob]);

  // Clean up media tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Callback ref to connect video element when mounted
  const setVideoElement = (element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && streamRef.current) {
      element.srcObject = streamRef.current;
      element.play().catch(() => {});
    }
  };

  async function startWebcam() {
    setCameraError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Webcam access is not supported in this browser environment.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setIsStreaming(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraError("Webcam permission denied or camera device unavailable.");
    }
  }

  function stopWebcam() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob && onCapturePhoto) {
          onCapturePhoto(blob);
        }
        stopWebcam();
      },
      "image/jpeg",
      0.92
    );
  }

  function handleRetake() {
    if (onCapturePhoto) {
      onCapturePhoto(null);
    }
    startWebcam();
  }

  function cancelWebcam() {
    stopWebcam();
  }

  // Result parsing
  const hasResult = tier !== undefined && tier.status !== "unavailable";

  let similarityStr = "N/A";
  if (typeof tier?.score === "number") {
    similarityStr = `${(tier.score * 100).toFixed(1)}%`;
  } else if (typeof tier?.details?.similarity === "number") {
    similarityStr = `${(Number(tier.details.similarity) * 100).toFixed(1)}%`;
  } else if (typeof tier?.details?.similarity === "string") {
    similarityStr = tier.details.similarity;
  }

  const rawMatch = tier?.details?.face_match;
  const isMatch =
    rawMatch === true ||
    rawMatch === "true" ||
    rawMatch === "match" ||
    (rawMatch === undefined && tier?.status === "pass");
  const isMismatch =
    rawMatch === false ||
    rawMatch === "false" ||
    rawMatch === "mismatch" ||
    (rawMatch === undefined && tier?.status === "fail" && !String(tier?.details?.liveness).includes("spoof"));

  const rawLiveness = String(tier?.details?.liveness ?? "").toLowerCase();
  const isAttended =
    rawLiveness === "attended" ||
    tier?.details?.mode === "In-person attended kiosk" ||
    rawLiveness === "live";
  const isLive =
    isAttended ||
    rawLiveness === "real" ||
    rawLiveness === "pass" ||
    tier?.details?.liveness === true ||
    (tier?.status === "pass" && rawLiveness !== "spoof");
  const isSpoof =
    !isAttended &&
    (rawLiveness === "spoof" ||
      rawLiveness === "fail" ||
      tier?.details?.liveness === false ||
      (tier?.status === "fail" &&
        (rawLiveness === "spoof" ||
          tier?.summary.toLowerCase().includes("spoof") ||
          tier?.summary.toLowerCase().includes("attack"))));

  return (
    <section className="face-card" aria-labelledby="biometrics-heading">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">Tier 4 active biometrics</p>
          <h2 id="biometrics-heading">Live biometrics.</h2>
        </div>
        <span className="soft-pill">1:1 ArcFace · In-Person Attended</span>
      </div>

      <div className="face-pair" aria-label="Document portrait and live camera feed comparison">
        {/* Document Portrait Column */}
        <div className="face-frame">
          <div className="frame-header">
            <span className="frame-label">Document portrait</span>
            <span className="frame-badge">VIZ Crop</span>
          </div>
          {documentPreviewUrl ? (
            <div className="media-tile-wrapper">
              <img src={documentPreviewUrl} alt="Document portrait" className="face-media-preview" />
            </div>
          ) : (
            <div className="silhouette-wrapper">
              <div className="silhouette" />
              <span className="silhouette-caption">Awaiting scan</span>
            </div>
          )}
        </div>

        <div className="face-divider" aria-hidden="true">
          <div className="face-divider-pill">↔</div>
        </div>

        {/* Live Camera Feed / Snapshot Column */}
        <div className="face-frame">
          <div className="frame-header">
            <span className="frame-label">Live camera</span>
            {isStreaming ? (
              <span className="frame-badge frame-badge-live">
                <span className="glowing-emerald-dot" /> Live Camera Active
              </span>
            ) : photoPreviewUrl ? (
              <span className="frame-badge frame-badge-success">✓ Captured</span>
            ) : (
              <span className="frame-badge">Standby</span>
            )}
          </div>

          {photoPreviewUrl ? (
            <div className="media-tile-wrapper">
              <img src={photoPreviewUrl} alt="Captured live photo" className="face-media-preview" />
            </div>
          ) : isStreaming ? (
            <div className="viewfinder-container">
              <video ref={setVideoElement} autoPlay playsInline muted className="viewfinder-video" />
              {/* Subtle face framing guide */}
              <div className="viewfinder-overlay" aria-hidden="true">
                <div className="viewfinder-reticle-oval" />
                <div className="viewfinder-corner top-left" />
                <div className="viewfinder-corner top-right" />
                <div className="viewfinder-corner bottom-left" />
                <div className="viewfinder-corner bottom-right" />
                <span className="viewfinder-hint">Align face inside guide</span>
              </div>
            </div>
          ) : (
            <div className="silhouette-wrapper">
              <div className="silhouette live" />
              <span className="silhouette-caption">Webcam inactive</span>
            </div>
          )}
        </div>
      </div>

      <div className="face-actions">
        {!isStreaming && !liveFrameBlob && (
          <button className="button-primary face-btn" type="button" onClick={startWebcam}>
            <span className="btn-icon">📷</span> Enable live camera
          </button>
        )}
        {isStreaming && (
          <div className="button-group">
            <button className="button-primary face-btn pulse-glow" type="button" onClick={takePhoto}>
              <span className="btn-icon">📸</span> Capture snapshot
            </button>
            <button className="button-outline face-btn" type="button" onClick={cancelWebcam}>
              Cancel
            </button>
          </div>
        )}
        {liveFrameBlob && (
          <div className="face-capture-status" style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <span className="capture-indicator-pill">✓ Selfie captured</span>
              <button className="button-pill-soft face-btn" type="button" onClick={handleRetake}>
                Retake snapshot
              </button>
            </div>
            {onRunScreening && (
              <button
                className="button-primary face-btn"
                type="button"
                disabled={isSubmitting}
                onClick={onRunScreening}
                style={{
                  background: "linear-gradient(135deg, #0066ff, #2563eb)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "13px",
                  padding: "10px 20px",
                  borderRadius: "9999px",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  width: "100%",
                  border: "none",
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-dot" /> Running screening with selfie…
                  </>
                ) : (
                  <>
                    <span>⚡</span> Run Screening with This Selfie →
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {cameraError && <p className="form-error face-error">{cameraError}</p>}

      {hasResult ? (
        <>
          <div className="biometric-results">
            <div className="biometric-metric">
              <span className="metric-label">Similarity</span>
              <strong className="metric-value">{similarityStr}</strong>
            </div>
            <div className="biometric-metric">
              <span className="metric-label">Face Match</span>
              <span
                className={`biometric-pill ${
                  isMatch ? "pill-pass" : isMismatch ? "pill-fail" : "pill-neutral"
                }`}
              >
                {isMatch ? "✓ Face Verified" : isMismatch ? "✕ Mismatch" : "? Review"}
              </span>
            </div>
            <div className="biometric-metric">
              <span className="metric-label">{isAttended ? "Inspection" : "Liveness"}</span>
              <span
                className={`biometric-pill ${
                  isAttended || isLive ? "pill-pass" : isSpoof ? "pill-fail" : "pill-neutral"
                }`}
              >
                {isAttended ? "✓ Attended Live" : isLive ? "✓ Live Human" : isSpoof ? "✕ Spoof Detected" : "? Inconclusive"}
              </span>
            </div>
          </div>
          {tier?.summary && <p className="biometric-note">{tier.summary}</p>}
        </>
      ) : (
        <p className="biometric-note">
          {liveFrameBlob ? (
            <span style={{ color: "#059669", fontWeight: 500 }}>
              ✓ Selfie is staged! Click <strong>&quot;Run Screening with This Selfie&quot;</strong> above (or <strong>&quot;Run screening&quot;</strong> at the top) to test 1:1 ArcFace matching against your document.
            </span>
          ) : (
            tier?.summary ?? "Live camera provides 1:1 facial verification against the document crop under attended inspection. All biometric vectors are strictly ephemeral."
          )}
        </p>
      )}
    </section>
  );
}
