import type { TierResult } from "../types";

const tierLabels = [
  "Cryptographic validation",
  "OCR & schema checks",
  "Passive forensics",
  "Live biometrics",
  "Fusion & audit",
];

function statusCopy(status: TierResult["status"] | "waiting" | "running") {
  if (status === "pass") return "Verified";
  if (status === "fail") return "Failed";
  if (status === "review") return "Review";
  if (status === "unavailable") return "Pending setup";
  if (status === "running") return "Running";
  return "Waiting";
}

export function PipelineProgress({ tiers, loading }: { tiers: TierResult[]; loading: boolean }) {
  return (
    <section className="pipeline-card" aria-labelledby="pipeline-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Five-tier pipeline</p>
          <h2 id="pipeline-heading">Screening status.</h2>
        </div>
        <span className={`live-marker ${loading ? "is-running" : ""}`}>{loading ? "Processing" : "Local-first"}</span>
      </div>
      <ol className="tier-list">
        {tierLabels.map((label, index) => {
          const result = tiers.find((tier) => tier.tier === index + 1);
          const status = result?.status ?? (loading ? "running" : "waiting");
          return (
            <li className={`tier-row tier-${status}`} key={label}>
              <span className="tier-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="tier-copy">
                <span className="tier-name">{result?.title ?? label}</span>
                <span className="tier-summary">{result?.summary ?? "Awaiting a document scan."}</span>
              </div>
              <span className="tier-state">{statusCopy(status)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
