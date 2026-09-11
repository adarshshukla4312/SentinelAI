from __future__ import annotations

from dataclasses import dataclass
import logging

from logging_config import get_logger, log_event
from schemas import Decision, TierResult

logger = get_logger("sentinelai.pipeline.tier5", tier=5)


@dataclass(frozen=True)
class FusionResult:
    decision: Decision
    risk_score: int
    reasons: list[str]
    tier: TierResult


def fuse(tiers: list[TierResult]) -> FusionResult:
    log_event(
        logger,
        logging.DEBUG,
        "TIER5_FUSION_STARTED",
        data={"tiers": {str(t.tier): {"status": t.status, "score": t.score} for t in tiers}},
    )
    by_tier = {tier.tier: tier for tier in tiers}
    crypto = by_tier.get(1)
    ocr = by_tier.get(2)
    forensics = by_tier.get(3)
    biometrics = by_tier.get(4)
    unavailable = [tier.title for tier in tiers if tier.status == "unavailable"]
    failures = [tier for tier in tiers if tier.status == "fail"]
    reviews = [tier for tier in tiers if tier.status == "review"]

    # 1. HARD_REJECT: Cryptographic or Checksum validation failed
    if crypto and crypto.status == "fail":
        reasons = ["ICAO 9303 MRZ or Aadhaar Verhoeff check-digit failure; immediate hard rejection."]
        log_event(
            logger,
            logging.WARNING,
            "TIER5_HARD_REJECT",
            data={"reason": "Cryptographic check digit failure"},
        )
        return FusionResult(
            decision="HARD_REJECT",
            risk_score=100,
            reasons=reasons,
            tier=TierResult(
                tier=5,
                title="Fusion & audit",
                status="fail",
                score=0.0,
                summary="Hard rejection: deterministic cryptographic validation failed.",
            ),
        )

    # 2. Accumulate risk signals and explainable reasons
    risk = 0
    reasons: list[str] = []

    # Tier 1 Crypto
    if crypto and crypto.status != "pass":
        risk += 25
        reasons.append("Cryptographic document validation is incomplete.")

    # Tier 2 OCR
    if ocr:
        if ocr.status == "fail":
            risk += 45
            reasons.append("Visual text contradicts machine-readable data (tampering detected).")
        elif ocr.status != "pass":
            risk += 18
            reasons.append("OCR and schema cross-checking is incomplete.")

    # Tier 3 Forensics
    if forensics:
        if forensics.status == "fail":
            risk += 45
            reasons.append("Passive-forensics detected pixel-level splicing or paper forgery.")
        elif forensics.status == "review":
            risk += 28
            reasons.append("Passive-forensics signals require officer review.")

    # Tier 4 Biometrics
    if biometrics:
        if biometrics.status == "fail":
            risk += 50
            reasons.append("Live facial verification does not match document portrait.")
        elif biometrics.status != "pass":
            risk += 20
            reasons.append("Live facial verification was not completed.")

    # 3. Decision Determination based on codified border security policies:
    # - HARD_REJECT: Tier 1 fail (handled above)
    # - FLAG (50-74+): Any tier has failed (biometrics, OCR, or forensics)
    # - REVIEW (25-49): Any tier has review/unavailable status, or risk >= 25
    # - CLEAR (0-24): ONLY when all configured tiers passed with zero fails, zero reviews, zero unavailables!

    if failures:
        decision: Decision = "FLAG"
        risk = max(risk, 65)
    elif unavailable or reviews or risk >= 25:
        decision = "REVIEW"
        risk = max(risk, 28)
        if unavailable and not any("incomplete" in r or "not completed" in r for r in reasons):
            reasons.append(f"Pending verification: {', '.join(unavailable)}.")
    else:
        # All tiers passed with flying colors!
        decision = "CLEAR"
        risk = min(risk, 8)
        reasons = ["All configured tiers passed."]

    risk = min(100, max(0, risk))

    tier_status = "pass" if decision == "CLEAR" else "review" if decision == "REVIEW" else "fail"
    log_event(
        logger,
        logging.INFO,
        "TIER5_FUSION_DECISION",
        data={"decision": decision, "risk_score": risk, "reasons": reasons},
    )
    return FusionResult(
        decision=decision,
        risk_score=risk,
        reasons=reasons,
        tier=TierResult(
            tier=5,
            title="Fusion & audit",
            status=tier_status,
            score=round(1 - (risk / 100), 2),
            summary=f"{decision.replace('_', ' ')} decision produced by deterministic fusion.",
        ),
    )
