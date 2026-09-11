"use client";

import { useRef, useState, type CSSProperties, type MouseEvent, type TouchEvent } from "react";

export function ForensicSlider({
  originalUrl,
  heatmapUrl,
}: {
  originalUrl: string | null;
  heatmapUrl?: string;
}) {
  const [position, setPosition] = useState(54);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  function handleMove(clientX: number) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    setPosition(Math.round(percentage));
  }

  function handlePointerDown(e: MouseEvent) {
    setIsDragging(true);
    handleMove(e.clientX);
  }

  function handleTouchStart(e: TouchEvent) {
    if (e.touches[0]) {
      setIsDragging(true);
      handleMove(e.touches[0].clientX);
    }
  }

  const style = { "--slider-position": `${position}%` } as CSSProperties;

  if (!originalUrl) {
    return (
      <section className="forensics-card empty-evidence" aria-labelledby="forensics-heading">
        <div className="empty-forensics-box">
          <div className="app-icon-squircle empty-glyph">🔍</div>
          <p className="eyebrow">Tier 3 passive forensics</p>
          <h2 id="forensics-heading">Forensic curtain.</h2>
          <p className="empty-copy">
            Upload or select a document scan to compare the original specimen with the derived Error Level Analysis (ELA) compression differential.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="forensics-card" aria-labelledby="forensics-heading">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">Tier 3 passive forensics</p>
          <h2 id="forensics-heading">Forensic curtain.</h2>
        </div>
        <div className="forensic-meta-group">
          <span className="drawer-badge drawer-badge-violet">Tier 3 ELA / FFT</span>
          <span className="soft-pill percentage-pill">{position}% ELA</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`curtain ${isDragging ? "is-dragging" : ""}`}
        style={style}
        onMouseDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onMouseMove={(e) => {
          if (e.buttons === 1) handleMove(e.clientX);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handleMove(e.touches[0].clientX);
        }}
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
      >
        <img className="curtain-base" src={originalUrl} alt="Uploaded document (grayscale base)" />

        {heatmapUrl ? (
          <div className="curtain-overlay">
            <img src={heatmapUrl} alt="Generated error-level analysis heatmap" />
          </div>
        ) : (
          <div className="curtain-overlay curtain-pending">
            <span className="pending-badge">Heatmap generates after screening</span>
          </div>
        )}

        {/* Floating badge overlays */}
        <span className="curtain-badge-left badge-overlay">Original scan</span>
        <span className="curtain-badge-right badge-overlay">ELA heatmap</span>

        {/* Draggable Divider Handle */}
        <div className="curtain-divider" aria-hidden="true">
          <div className="curtain-handle">
            <span className="handle-arrow">↔</span>
          </div>
        </div>

        <input
          aria-label="Move forensic comparison divider"
          className="curtain-range"
          max="100"
          min="0"
          onChange={(event) => setPosition(Number(event.target.value))}
          type="range"
          value={position}
        />
      </div>

      <div className="curtain-footer">
        <div className="curtain-legend">
          <span className="legend-indicator original-dot">Original scan (grayscale)</span>
          <span className="legend-indicator ela-dot">Amplified ELA compression differential</span>
        </div>
        <div className="curtain-presets">
          <button
            type="button"
            className={`preset-pill ${position === 0 ? "is-active" : ""}`}
            onClick={() => setPosition(0)}
          >
            Scan (0%)
          </button>
          <button
            type="button"
            className={`preset-pill ${position === 50 ? "is-active" : ""}`}
            onClick={() => setPosition(50)}
          >
            Split (50%)
          </button>
          <button
            type="button"
            className={`preset-pill ${position === 100 ? "is-active" : ""}`}
            onClick={() => setPosition(100)}
          >
            ELA (100%)
          </button>
        </div>
      </div>
    </section>
  );
}
