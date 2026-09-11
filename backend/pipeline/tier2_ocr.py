from __future__ import annotations

from pathlib import Path

from schemas import TierResult


def run(document_path: Path, mrz_available: bool) -> TierResult:
    """Describe the OCR adapter state without pretending inference has run.

    PaddleOCR is intentionally optional during the initial skeleton so the API can
    run on a developer laptop without downloading model weights at request time.
    """
    try:
        import paddleocr  # type: ignore # noqa: F401
    except ImportError:
        return TierResult(
            tier=2,
            title="OCR & schema checks",
            status="unavailable",
            summary="PaddleOCR is not installed; VIZ-to-MRZ cross-checking was not run.",
            details={"adapter": "PaddleOCR v4", "document": document_path.name},
        )

    return TierResult(
        tier=2,
        title="OCR & schema checks",
        status="review",
        summary="PaddleOCR runtime is present; model loading and field extractors are pending configuration.",
        details={"adapter": "PaddleOCR v4", "mrz_available": mrz_available},
    )
