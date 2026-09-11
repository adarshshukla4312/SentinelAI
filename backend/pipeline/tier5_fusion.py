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
    crypto = by_tier[1]
    forensics = by_tier[3]
    biometrics = by_tier[4]
    unavailable = [tier.title for tier in tiers if tier.status == "unavailable"]

    if crypto.status == "fail":
        reasons = ["ICAO 9303 MRZ check-digit validation failed; this is a hard rejection."]
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

    risk = 8
    reasons: list[str] = []
    if crypto.status != "pass":
        risk += 24
        reasons.append("Cryptographic document validation is incomplete.")
    if by_tier[2].status != "pass":
        risk += 18
        reasons.append("OCR and schema cross-checking is incomplete.")
    if forensics.status == "review":
        risk += 34
        reasons.append("Passive-forensics signals require officer review.")
    if biometrics.status != "pass":
        risk += 20
        reasons.append("Live face match and liveness verification are incomplete.")

    if forensics.status == "review" and biometrics.status == "fail":
        decision: Decision = "FLAG"
        risk = max(risk, 85)
        reasons.append("Forensic concern and biometric mismatch occurred together.")
    elif unavailable or any(tier.status == "review" for tier in tiers):
        decision = "REVIEW"
    else:
        decision = "CLEAR"

    risk = min(100, risk)
    if decision == "CLEAR":
        reasons = ["All configured tiers passed."]
    elif unavailable:
        reasons.append(f"Pending integrations: {', '.join(unavailable)}.")

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
