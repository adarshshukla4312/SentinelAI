import type { Decision } from "../types";

export function RiskScore({ decision, risk, reasons }: { decision?: Decision; risk?: number; reasons?: string[] }) {
  const displayRisk = risk ?? 0;
  const label = decision ? decision.replace("_", " ") : "Awaiting scan";
  return (
    <section className="risk-card" aria-labelledby="risk-heading">
      <p className="eyebrow">Decision output</p>
      <div className="risk-headline">
        <h2 id="risk-heading">{label}.</h2>
        <span className="decision-chip">{decision ? "System decision" : "No result"}</span>
      </div>
      <div className="risk-meter" aria-label={`Risk score ${displayRisk} out of 100`}>
        <div className="risk-meter-fill" style={{ width: `${displayRisk}%` }} />
      </div>
      <div className="risk-value"><strong>{String(displayRisk).padStart(2, "0")}</strong><span>/100 risk</span></div>
      <ul className="reason-list">
        {(reasons?.length ? reasons : ["Run a screening to generate explainable decision notes."]).map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
    </section>
  );
}
