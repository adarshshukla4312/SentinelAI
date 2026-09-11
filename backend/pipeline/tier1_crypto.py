from __future__ import annotations

from dataclasses import dataclass
import re

from schemas import TierResult


_WEIGHTS = (7, 3, 1)
_TD3_LINE_LENGTH = 44


def mrz_character_value(character: str) -> int:
    """Return the ICAO 9303 value for an MRZ character."""
    if character.isdigit():
        return int(character)
    if "A" <= character <= "Z":
        return ord(character) - ord("A") + 10
    if character == "<":
        return 0
    raise ValueError(f"Unsupported MRZ character: {character!r}")


def calculate_check_digit(value: str) -> str:
    total = sum(
        mrz_character_value(character) * _WEIGHTS[index % len(_WEIGHTS)]
        for index, character in enumerate(value)
    )
    return str(total % 10)


@dataclass(frozen=True)
class TD3Validation:
    is_valid: bool
    checks: dict[str, bool]
    document_number: str
    nationality: str


def _normalise_mrz(mrz: str) -> list[str]:
    lines = [re.sub(r"\s+", "", line.upper()) for line in mrz.splitlines() if line.strip()]
    if len(lines) != 2 or any(len(line) != _TD3_LINE_LENGTH for line in lines):
        raise ValueError("A TD3 passport MRZ must contain two 44-character lines.")
    return lines


def validate_td3_mrz(mrz: str) -> TD3Validation:
    """Validate the mandatory check digits in a two-line passport TD3 MRZ."""
    line_one, line_two = _normalise_mrz(mrz)
    checks = {
        "document_number": calculate_check_digit(line_two[0:9]) == line_two[9],
        "date_of_birth": calculate_check_digit(line_two[13:19]) == line_two[19],
        "expiry_date": calculate_check_digit(line_two[21:27]) == line_two[27],
        "personal_number": calculate_check_digit(line_two[28:42]) == line_two[42],
        "composite": calculate_check_digit(line_two[0:10] + line_two[13:20] + line_two[21:43]) == line_two[43],
    }
    return TD3Validation(
        is_valid=all(checks.values()),
        checks=checks,
        document_number=line_two[0:9].replace("<", ""),
        nationality=line_two[10:13],
    )


def run(mrz: str | None) -> TierResult:
    """Run deterministic MRZ validation when a scanner/OCR supplied MRZ is available.

    Aadhaar Secure QR PKI verification is intentionally an integration boundary: a
    trusted UIDAI public-key bundle and QR payload parser are required before it can
    be enabled in production.
    """
    if not mrz or not mrz.strip():
        return TierResult(
            tier=1,
            title="Cryptographic validation",
            status="unavailable",
            summary="No machine-readable zone was supplied for deterministic validation.",
            details={"mrz": "not supplied", "aadhaar_secure_qr": "not configured"},
        )

    try:
        validated = validate_td3_mrz(mrz)
    except ValueError as error:
        return TierResult(
            tier=1,
            title="Cryptographic validation",
            status="review",
            summary="The supplied MRZ is not a supported TD3 passport layout.",
            details={"error": str(error), "aadhaar_secure_qr": "not configured"},
        )

    if not validated.is_valid:
        return TierResult(
            tier=1,
            title="Cryptographic validation",
            status="fail",
            score=0.0,
            summary="One or more ICAO 9303 MRZ check digits failed.",
            details={
                "checks": validated.checks,
                "document_number": validated.document_number,
                "nationality": validated.nationality,
            },
        )

    return TierResult(
        tier=1,
        title="Cryptographic validation",
        status="pass",
        score=1.0,
        summary="All supported ICAO 9303 TD3 MRZ check digits are valid.",
        details={
            "checks": validated.checks,
            "document_number": validated.document_number,
            "nationality": validated.nationality,
            "aadhaar_secure_qr": "not configured",
        },
    )
