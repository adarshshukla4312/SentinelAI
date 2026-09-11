from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import logging
from pathlib import Path
import time
from uuid import uuid4

from blockchain.merkle import AuditLedger
from blockchain.polygon import anchor_latest_hash
from config import LEDGER_PATH, SCAN_DIR
from logging_config import (
    get_logger,
    log_event,
    reset_screening_context,
    set_screening_context,
    set_tier_context,
)
from pipeline import tier1_crypto, tier2_ocr, tier3_forensics, tier4_biometrics, tier5_fusion
from schemas import ScreeningResponse

logger = get_logger("sentinelai.pipeline.orchestrator")


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def screen(
    document_path: Path,
    mrz: str | None = None,
    live_frame_path: Path | None = None,
    document_back_path: Path | None = None,
    document_type: str = "auto",
) -> ScreeningResponse:
    """Run the available pipeline and emit a privacy-minimized audit receipt."""
    screening_id = str(uuid4())
    tokens = set_screening_context(screening_id)
    start_total = time.perf_counter()

    log_event(
        logger,
        logging.INFO,
        "SCREENING_STARTED",
        data={
            "screening_id": screening_id,
            "document": document_path.name,
            "has_mrz": bool(mrz and mrz.strip()),
            "has_live_frame": live_frame_path is not None,
            "has_document_back": document_back_path is not None,
            "document_type": document_type,
        },
    )

    try:
        created_at = datetime.now(timezone.utc)

        # Tier 1: Cryptographic validation
        t_token = set_tier_context(1)
        t1_start = time.perf_counter()
        crypto = tier1_crypto.run(mrz)
        t1_ms = round((time.perf_counter() - t1_start) * 1000, 2)

        # Tier 2: OCR & schema checks
        set_tier_context(2)
        t2_start = time.perf_counter()
        ocr = tier2_ocr.run(
            document_path,
            mrz_available=bool(mrz and mrz.strip()),
            mrz=mrz,
            document_back=document_back_path,
            document_type=document_type,
        )
        if not (mrz and mrz.strip()) and ocr.details.get("extracted_mrz"):
            extracted_mrz = ocr.details["extracted_mrz"]
            log_event(logger, logging.INFO, "MRZ auto-extracted by OCR and fed to Tier 1 for validation")
            crypto = tier1_crypto.run(extracted_mrz)
        elif not (mrz and mrz.strip()) and ocr.details.get("viz_fields", {}).get("aadhaar_number"):
            aadhaar_num = ocr.details["viz_fields"]["aadhaar_number"]
            log_event(logger, logging.INFO, "Aadhaar UID auto-extracted by OCR and fed to Tier 1 for Verhoeff validation", data={"uid": aadhaar_num})
            crypto = tier1_crypto.run_aadhaar(aadhaar_num, back_image_path=document_back_path)
        t2_ms = round((time.perf_counter() - t2_start) * 1000, 2)

        # Tier 3: Passive forensics
        set_tier_context(3)
        t3_start = time.perf_counter()
        forensics = tier3_forensics.run(document_path)
        heatmap_path = SCAN_DIR / f"{screening_id}-ela.png"
        forensics.heatmap.save(heatmap_path, format="PNG", optimize=True)
        t3_ms = round((time.perf_counter() - t3_start) * 1000, 2)

        # Tier 4: Live biometrics
        set_tier_context(4)
        t4_start = time.perf_counter()
        biometrics = tier4_biometrics.run(document_image=document_path, live_frame=live_frame_path)
        t4_ms = round((time.perf_counter() - t4_start) * 1000, 2)

        # Tier 5: Fusion & audit
        set_tier_context(5)
        t5_start = time.perf_counter()
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
                "ocr": "PaddleOCR/RapidOCR adapter",
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
        t5_ms = round((time.perf_counter() - t5_start) * 1000, 2)

        total_duration_ms = round((time.perf_counter() - start_total) * 1000, 2)
        all_tiers = [*first_four, tier_five]

        # Request-Level Summary Log
        set_tier_context(None)
        log_event(
            logger,
            logging.INFO,
            "SCREENING_COMPLETE",
            data={
                "message": "SCREENING_COMPLETE",
                "screening_id": screening_id,
                "decision": fusion.decision,
                "risk_score": fusion.risk_score,
                "tier_statuses": [t.status for t in all_tiers],
                "total_duration_ms": total_duration_ms,
                "tier_durations_ms": [t1_ms, t2_ms, t3_ms, t4_ms, t5_ms],
            },
        )

        detected_doc_type = document_type
        if detected_doc_type == "auto":
            if "aadhaar_number" in ocr.details.get("viz_fields", {}):
                detected_doc_type = "aadhaar"
            else:
                detected_doc_type = "passport"

        return ScreeningResponse(
            screening_id=screening_id,
            created_at=created_at,
            decision=fusion.decision,
            risk_score=fusion.risk_score,
            reasons=fusion.reasons,
            tiers=all_tiers,
            audit=audit,
            document_type=detected_doc_type,
            artifacts={"heatmap_url": f"/api/v1/screenings/{screening_id}/heatmap"},
        )
    finally:
        reset_screening_context(tokens)
