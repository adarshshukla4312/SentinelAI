import type { TierResult } from "../types";

export function FaceMatch({ tier }: { tier?: TierResult }) {
  const configured = tier?.status === "pass";
  return (
    <section className="face-card" aria-labelledby="biometrics-heading">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">Tier 4</p>
          <h2 id="biometrics-heading">Live biometrics.</h2>
        </div>
        <span className="soft-pill">Match & discard</span>
      </div>
      <div className="face-pair" aria-label="Document portrait and live camera placeholders">
        <div className="face-frame"><span className="frame-label">Document portrait</span><div className="silhouette" /></div>
        <div className="face-divider">↔</div>
        <div className="face-frame"><span className="frame-label">Live camera</span><div className="silhouette live" /></div>
      </div>
      <p className="biometric-note">{configured ? tier?.summary : "Webcam capture, ArcFace, and MiniFASNet are disabled until vetted model weights are configured."}</p>
    </section>
  );
}
