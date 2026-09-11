from __future__ import annotations

from schemas import TierResult


def run() -> TierResult:
    """Report an honest integration boundary for biometric processing.

    The final system will receive a cropped document portrait and short webcam frame
    sequence, run ArcFace 1:1 similarity in memory, and discard the embeddings.
    It intentionally does not use an uploaded document as a biometric substitute.
    """
    return TierResult(
        tier=4,
        title="Live biometrics",
        status="unavailable",
        summary="Live webcam capture and vetted ArcFace/MiniFASNet weights are required before biometric screening can run.",
        details={
            "face_match": "not run",
            "liveness": "not run",
            "privacy": "No biometric template was stored.",
        },
    )
