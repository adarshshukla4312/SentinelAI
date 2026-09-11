from __future__ import annotations

from datetime import datetime, timezone
import hashlib
from pathlib import Path
from uuid import uuid4

from blockchain.merkle import AuditLedger
from blockchain.polygon import anchor_latest_hash
from config import LEDGER_PATH, SCAN_DIR
from pipeline import tier1_crypto, tier2_ocr, tier3_forensics, tier4_biometrics, tier5_fusion
from schemas import ScreeningResponse


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def screen(document_path: Path, mrz: str | None) -> ScreeningResponse:
    """Run the available pipeline and emit a privacy-minimized audit receipt."""
    screening_id = str(uuid4())
    created_at = datetime.now(timezone.utc)
    crypto = tier1_crypto.run(mrz)
    ocr = tier2_ocr.run(document_path, mrz_available=bool(mrz and mrz.strip()))
    forensics = tier3_forensics.run(document_path)
    heatmap_path = SCAN_DIR / f"{screening_id}-ela.png"
    forensics.heatmap.save(heatmap_path, format="PNG", optimize=True)
    biometrics = tier4_biometrics.run()

    first_four = [crypto, ocr, forensics.result, biometrics]
    fusion = tier5_fusion.fuse(first_four)
    receipt = {
        "schema_version": 1,
        "screening_id": screening_id,
        "timestamp": created_at.isoformat(),
        "document_hash": _sha256_file(document_path),
        "tier_statuses": {str(tier.tier): tier.status for tier in first_four},
        "tier_scores": {str(tier.tier): tier.score for tier in first_four},
        "final_decision": fusion.decision,
        "risk_score": fusion.risk_score,
        "model_versions": {
            "ocr": "PaddleOCR adapter",
            "forensics": "ELA + FFT heuristic",
            "biometrics": "ArcFace/MiniFASNet adapter",
        },
    }
    audit = AuditLedger(LEDGER_PATH).append(receipt)
    audit["ledger_verified"] = AuditLedger(LEDGER_PATH).verify()
    audit["polygon"] = anchor_latest_hash(audit["chain_hash"])

    tier_five = fusion.tier.model_copy(
        update={
            "details": {
                "receipt_hash": audit["receipt_hash"],
                "chain_hash": audit["chain_hash"],
                "polygon_anchor": audit["polygon"]["status"],
            }
        }
    )
    return ScreeningResponse(
        screening_id=screening_id,
        created_at=created_at,
        decision=fusion.decision,
        risk_score=fusion.risk_score,
        reasons=fusion.reasons,
        tiers=[*first_four, tier_five],
        audit=audit,
        artifacts={"heatmap_url": f"/api/v1/screenings/{screening_id}/heatmap"},
    )
