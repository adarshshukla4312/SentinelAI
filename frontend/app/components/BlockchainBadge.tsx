import type { ScreeningResponse } from "../types";

function shorten(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function BlockchainBadge({ result }: { result?: ScreeningResponse }) {
  const audit = result?.audit;
  return (
    <section className="ledger-card" aria-labelledby="ledger-heading">
      <div>
        <p className="eyebrow">Tier 5</p>
        <h2 id="ledger-heading">Blockchain audit ledger.</h2>
      </div>
      {audit ? (
        <>
          <div className="hash-block"><span>Chain hash</span><code>{shorten(audit.chain_hash)}</code></div>
          <div className="ledger-meta"><span>Record #{audit.sequence}</span><span>{audit.ledger_verified ? "Hash chain verified" : "Integrity check failed"}</span></div>
          <p className="ledger-note">{audit.polygon.status === "anchored" ? "Public Polygon anchor confirmed." : "Offline chain recorded. Polygon anchor awaits secure wallet configuration."}</p>
        </>
      ) : (
        <p className="ledger-note">Each completed screening will create a SHA-256 receipt linked to the prior record. No personal data goes on-chain.</p>
      )}
    </section>
  );
}
