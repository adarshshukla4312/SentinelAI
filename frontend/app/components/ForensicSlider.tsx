"use client";

import { useState, type CSSProperties } from "react";

export function ForensicSlider({ originalUrl, heatmapUrl }: { originalUrl: string | null; heatmapUrl?: string }) {
  const [position, setPosition] = useState(54);
  const style = { "--slider-position": `${position}%` } as CSSProperties;

  if (!originalUrl) {
    return (
      <section className="forensics-card empty-evidence" aria-labelledby="forensics-heading">
        <p className="eyebrow">Tier 3 evidence</p>
        <h2 id="forensics-heading">Forensic curtain.</h2>
        <p>Upload a document to compare it with the generated error-level analysis.</p>
      </section>
    );
  }

  return (
    <section className="forensics-card" aria-labelledby="forensics-heading">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">Tier 3 evidence</p>
          <h2 id="forensics-heading">Forensic curtain.</h2>
        </div>
        <span className="soft-pill">ELA / FFT</span>
      </div>
      <div className="curtain" style={style}>
        <img className="curtain-base" src={originalUrl} alt="Uploaded document" />
        {heatmapUrl ? (
          <div className="curtain-overlay">
            <img src={heatmapUrl} alt="Generated error-level analysis heatmap" />
          </div>
        ) : (
          <div className="curtain-overlay curtain-pending">Heatmap appears after screening.</div>
        )}
        <div className="curtain-divider" aria-hidden="true"><span>↔</span></div>
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
      <div className="curtain-legend"><span>Original scan</span><span>Derived ELA evidence</span></div>
    </section>
  );
}
