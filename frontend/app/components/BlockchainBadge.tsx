"use client";

import { useState } from "react";
import type { ScreeningResponse } from "../types";

function shorten(value: string) {
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function BlockchainBadge({ result }: { result?: ScreeningResponse }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const audit = result?.audit;
  const isAnchored = audit?.polygon.status === "anchored" || Boolean(audit?.polygon.transaction_hash);
  const txHash = audit?.polygon.transaction_hash;
  const chainHash = audit?.chain_hash;

  async function copyToClipboard(text: string, key: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2200);
      } catch {
        // Fallback or ignore
      }
    }
  }

  return (
    <section className="ledger-card" aria-labelledby="ledger-heading">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">Tier 5 audit trail</p>
          <h2 id="ledger-heading">Blockchain audit ledger.</h2>
        </div>
        {isAnchored ? (
          <span className="badge-polygon-pill" aria-label="Anchored on-chain status">
            <span className="glowing-emerald-dot" /> Polygon Anchored
          </span>
        ) : (
          <span className="soft-pill">SHA-256 Local Chain</span>
        )}
      </div>

      {audit ? (
        <>
          {/* Chain Hash Row with 1-Click Copy */}
          <div className="hash-block">
            <div className="hash-info">
              <span className="hash-label">Chain receipt hash</span>
              <code className="hash-value" title={chainHash}>
                {shorten(chainHash || "")}
              </code>
            </div>
            <button
              className="copy-pill-button"
              type="button"
              onClick={() => chainHash && copyToClipboard(chainHash, "chain")}
              aria-label="Copy SHA-256 chain hash to clipboard"
            >
              {copiedKey === "chain" ? (
                <span className="copy-feedback-success">✓ Copied!</span>
              ) : (
                <span className="copy-action">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy hash
                </span>
              )}
            </button>
          </div>

          {/* Polygon Transaction Row */}
          {txHash ? (
            <div className="hash-block">
              <div className="hash-info">
                <span className="hash-label">Polygon Amoy Tx</span>
                <code className="hash-value">{shorten(txHash)}</code>
              </div>
              <div className="hash-actions">
                <button
                  className="copy-pill-button"
                  type="button"
                  onClick={() => copyToClipboard(txHash, "tx")}
                  aria-label="Copy Polygon transaction hash"
                >
                  {copiedKey === "tx" ? (
                    <span className="copy-feedback-success">✓ Copied!</span>
                  ) : (
                    <span className="copy-action">Copy Tx</span>
                  )}
                </button>
                <a
                  href={`https://amoy.polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-pill-soft tx-explorer-link"
                  title="Inspect raw transaction on Polygonscan"
                >
                  Polygonscan ↗
                </a>
              </div>
            </div>
          ) : isAnchored ? (
            <div className="hash-block">
              <div className="hash-info">
                <span className="hash-label">Polygon Status</span>
                <code className="hash-value">Batched on Amoy</code>
              </div>
              <span className="soft-pill">Pending broadcast</span>
            </div>
          ) : null}

          {/* Ledger Metadata */}
          <div className="ledger-meta-table">
            <div className="ledger-meta-row">
              <span className="meta-key">Sequence Block</span>
              <strong className="meta-val">#{audit.sequence}</strong>
            </div>
            <div className="ledger-meta-row">
              <span className="meta-key">Cryptographic Link</span>
              <span className="meta-val verified-chain">
                {audit.ledger_verified ? "✓ Strict Hash Chain Intact" : "✗ Verification Failed"}
              </span>
            </div>
            <div className="ledger-meta-row">
              <span className="meta-key">Previous Receipt Hash</span>
              <code className="meta-val meta-code">{shorten(audit.previous_hash || "genesis")}</code>
            </div>
          </div>

          <p className="ledger-note">
            {isAnchored
              ? "Public anchor confirmed. An immutable, zero-knowledge audit receipt is permanently timestamped on Polygon Amoy."
              : "Locally sealed SHA-256 chain recorded. All five tier hashes are cryptographically bound without persisting PII."}
          </p>
        </>
      ) : (
        <div className="ledger-empty-state">
          <div className="ledger-meta-table">
            <div className="ledger-meta-row">
              <span className="meta-key">Consensus Network</span>
              <span className="meta-val">Polygon Amoy (Testnet)</span>
            </div>
            <div className="ledger-meta-row">
              <span className="meta-key">Hashing Algorithm</span>
              <span className="meta-val">SHA-256 Chained Receipts</span>
            </div>
            <div className="ledger-meta-row">
              <span className="meta-key">Privacy Guarantee</span>
              <span className="meta-val">Zero PII / On-Chain Hashes Only</span>
            </div>
          </div>
          <p className="ledger-note">
            Upon screening completion, a cryptographic receipt is added to the append-only ledger and signed with the prior block hash.
          </p>
        </div>
      )}
    </section>
  );
}
