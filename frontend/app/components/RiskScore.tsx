import type { Decision } from "../types";

export function RiskScore({
  decision,
  risk,
  reasons,
}: {
  decision?: Decision;
  risk?: number;
  reasons?: string[];
}) {
  const displayRisk = risk ?? 0;
  const hasDecision = Boolean(decision);
  const riskSeverity = !hasDecision && displayRisk === 0
    ? "risk-neutral"
    : displayRisk < 25
    ? "risk-low"
    : displayRisk < 60
    ? "risk-moderate"
    : "risk-high";

  function formatDecisionTitle(d?: Decision) {
    if (d === "CLEAR") return "Clear.";
    if (d === "REVIEW") return "Officer review.";
    if (d === "FLAG") return "Flagged anomaly.";
    if (d === "HARD_REJECT") return "Hard rejection.";
    return "Awaiting scan.";
  }

  function getDecisionBadgeLabel(d?: Decision) {
    if (d === "CLEAR") return "Verified Pass";
    if (d === "REVIEW") return "Manual Review Required";
    if (d === "FLAG") return "Multiple Anomalies";
    if (d === "HARD_REJECT") return "Security Violation";
    return "Standby";
  }

  return (
    <section className="risk-card" aria-labelledby="risk-heading">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow eyebrow-inverted">Tier 5 fusion engine</p>
          <h2 id="risk-heading" className="risk-title">
            {formatDecisionTitle(decision)}
          </h2>
        </div>
        <span className={`decision-chip ${decision ? `decision-${decision.toLowerCase()}` : "decision-standby"}`}>
          {getDecisionBadgeLabel(decision)}
        </span>
      </div>

      <div className="risk-meter" aria-label={`Risk score ${displayRisk} out of 100`}>
        <div
          className={`risk-meter-fill ${riskSeverity}`}
          style={{ width: `${Math.max(3, Math.min(100, displayRisk))}%` }}
        />
      </div>

      <div className="risk-value">
        <strong className={`risk-number ${riskSeverity}`}>{String(displayRisk).padStart(2, "0")}</strong>
        <div className="risk-value-meta">
          <span>/100 risk score</span>
          <span className="risk-sub-status">
            {displayRisk === 0 && !decision
              ? "Awaiting document telemetry"
              : displayRisk < 25
              ? "Low risk threshold"
              : displayRisk < 60
              ? "Moderate risk threshold"
              : "High risk threshold"}
          </span>
        </div>
      </div>

      <div className="reasons-wrapper">
        <span className="section-eyebrow eyebrow-inverted">Explainable telemetry notes:</span>
        <ul className="reason-list">
          {(reasons?.length
            ? reasons
            : ["Run a screening to execute deterministic five-tier risk aggregation and telemetry."]
          ).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
