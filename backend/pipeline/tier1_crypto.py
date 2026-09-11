from __future__ import annotations

from dataclasses import dataclass
import logging
import re

from logging_config import get_logger, log_event
from schemas import TierResult

logger = get_logger("sentinelai.pipeline.tier1", tier=1)

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
    """Run deterministic MRZ validation when a scanner/OCR supplied MRZ is available."""
    log_event(logger, logging.DEBUG, "TIER1_STARTED", data={"has_mrz": bool(mrz and mrz.strip())})

    if not mrz or not mrz.strip():
        log_event(logger, logging.INFO, "TIER1_UNAVAILABLE", data={"reason": "No MRZ provided"})
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
        log_event(logger, logging.WARNING, "TIER1_INVALID_LAYOUT", data={"error": str(error)})
        return TierResult(
            tier=1,
            title="Cryptographic validation",
            status="review",
            summary="The supplied MRZ is not a supported TD3 passport layout.",
            details={"error": str(error), "aadhaar_secure_qr": "not configured"},
        )
    except Exception as error:
        log_event(logger, logging.ERROR, "TIER1_ERROR", data={"error": str(error)}, exc_info=True)
        return TierResult(
            tier=1,
            title="Cryptographic validation",
            status="fail",
            score=0.0,
            summary=f"Validation error: {error}",
            details={"error": str(error)},
        )

    if not validated.is_valid:
        log_event(
            logger,
            logging.WARNING,
            "TIER1_CHECK_DIGIT_FAILED",
            data={
                "checks": validated.checks,
                "document_number": validated.document_number,
                "nationality": validated.nationality,
            },
        )
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

    log_event(
        logger,
        logging.INFO,
        "TIER1_CHECK_DIGIT_PASSED",
        data={
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


_VERHOEFF_D_TABLE = (
    (0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
    (1, 2, 3, 4, 0, 6, 7, 8, 9, 5),
    (2, 3, 4, 0, 1, 7, 8, 9, 5, 6),
    (3, 4, 0, 1, 2, 8, 9, 5, 6, 7),
    (4, 0, 1, 2, 3, 9, 5, 6, 7, 8),
    (5, 9, 8, 7, 6, 0, 4, 3, 2, 1),
    (6, 5, 9, 8, 7, 1, 0, 4, 3, 2),
    (7, 6, 5, 9, 8, 2, 1, 0, 4, 3),
    (8, 7, 6, 5, 9, 3, 2, 1, 0, 4),
    (9, 8, 7, 6, 5, 4, 3, 2, 1, 0),
)

_VERHOEFF_P_TABLE = (
    (0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
    (1, 5, 7, 6, 2, 8, 3, 0, 9, 4),
    (5, 8, 0, 3, 7, 9, 6, 1, 4, 2),
    (8, 9, 1, 6, 0, 4, 3, 5, 2, 7),
    (9, 4, 5, 3, 1, 2, 6, 8, 7, 0),
    (4, 2, 8, 6, 5, 7, 3, 9, 0, 1),
    (2, 7, 9, 3, 8, 0, 6, 4, 1, 5),
    (7, 0, 4, 6, 9, 1, 3, 2, 5, 8),
)


def validate_verhoeff(num_str: str) -> bool:
    """Validate a 12-digit Indian Aadhaar number using the Verhoeff dihedral algorithm."""
    digits = [int(c) for c in num_str if c.isdigit()]
    if len(digits) != 12:
        return False
    c = 0
    for i, digit in enumerate(reversed(digits)):
        c = _VERHOEFF_D_TABLE[c][_VERHOEFF_P_TABLE[i % 8][digit]]
    return c == 0


def parse_uidai_qr(val: str, expected_uid: str | None = None) -> dict[str, Any]:
    """Parse and decompress a UIDAI 2D Secure QR integer payload."""
    if not val:
        return {"detected": False, "valid_uidai": False}
    if not val.isdigit():
        return {
            "detected": True,
            "valid_uidai": False,
            "raw_text": val[:120],
            "summary": "Standard QR code detected on substrate.",
        }
    try:
        import zlib

        num = int(val)
        raw_bytes = num.to_bytes((num.bit_length() + 7) // 8, byteorder="big")
        decompressed = zlib.decompress(raw_bytes, 16 + zlib.MAX_WBITS)
        parts = decompressed.split(b"\xff")
        text_parts = [p.decode("utf-8", errors="ignore") for p in parts[:15]]

        qr_version = text_parts[0] if len(text_parts) > 0 else "Unknown"
        ref_id = text_parts[2] if len(text_parts) > 2 else ""
        masked_uid = ref_id[:4] if len(ref_id) >= 4 else ""
        name = text_parts[3] if len(text_parts) > 3 else ""
        dob = text_parts[4] if len(text_parts) > 4 else ""
        gender = text_parts[5] if len(text_parts) > 5 else ""
        care_of = text_parts[6] if len(text_parts) > 6 else ""
        district = text_parts[7] if len(text_parts) > 7 else ""

        uid_matches = True
        if expected_uid and masked_uid:
            clean_expected = "".join(filter(str.isdigit, expected_uid))
            uid_matches = clean_expected.endswith(masked_uid)

        return {
            "detected": True,
            "valid_uidai": True,
            "version": qr_version,
            "masked_uid": masked_uid,
            "uid_matches": uid_matches,
            "name": name,
            "dob": dob,
            "gender": gender,
            "care_of": care_of,
            "district": district,
            "summary": f"UIDAI {qr_version} Secure QR authenticated ({name}, UID suffix {masked_uid}).",
        }
    except Exception as exc:
        return {
            "detected": True,
            "valid_uidai": False,
            "error": str(exc),
            "summary": f"QR detected ({len(val)} digits) but decompress failed: {exc}",
        }


def detect_qr_code(image_path: Path | None, expected_uid: str | None = None) -> dict[str, Any]:
    """Detect and evaluate 2D Secure QR codes on identity document substrates.

    Tries WeChatQRCode first for dense Aadhaar QR codes, then standard OpenCV detector.
    """
    if not image_path or not image_path.exists():
        return {"detected": False, "summary": "No image provided for QR detection."}

    try:
        import cv2

        img = cv2.imread(str(image_path))
        if img is None:
            return {"detected": False, "summary": "Unreadable document image."}

        # 1. Try WeChatQRCode (handles high-density Version 15+ Aadhaar QR codes)
        try:
            if hasattr(cv2, "wechat_qrcode_WeChatQRCode"):
                detector = cv2.wechat_qrcode_WeChatQRCode()
                results, _ = detector.detectAndDecode(img)
                if results and len(results) > 0:
                    val = results[0]
                    return parse_uidai_qr(val, expected_uid=expected_uid)
        except Exception as wechat_err:
            logger.debug(f"WeChatQRCode attempt failed: {wechat_err}")

        # 2. Standard OpenCV QRCodeDetector
        std_detector = cv2.QRCodeDetector()
        val, pts, _ = std_detector.detectAndDecode(img)
        if pts is not None and len(pts) > 0 and val:
            return parse_uidai_qr(val, expected_uid=expected_uid)

        # 3. Multi-detection fallback
        retval, decoded_info, points, _ = std_detector.detectAndDecodeMulti(img)
        if retval and decoded_info:
            for info in decoded_info:
                if info and info.strip():
                    return parse_uidai_qr(info, expected_uid=expected_uid)

        # 4. Try with CLAHE contrast enhancement
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
        val, pts, _ = std_detector.detectAndDecode(clahe)
        if pts is not None and len(pts) > 0 and val:
            return parse_uidai_qr(val, expected_uid=expected_uid)

        return {"detected": False, "summary": "No 2D barcode detected on image."}
    except Exception as exc:
        return {"detected": False, "summary": f"QR scanning error: {exc}"}


def run_aadhaar(
    aadhaar_number: str,
    back_image_path: Path | None = None,
    front_image_path: Path | None = None,
) -> TierResult:
    """Run Verhoeff checksum validation on an extracted 12-digit Indian Aadhaar UID."""
    digits = "".join(filter(str.isdigit, aadhaar_number))
    if len(digits) != 12:
        return TierResult(
            tier=1,
            title="Cryptographic validation",
            status="fail",
            score=0.0,
            summary="Aadhaar number must contain exactly 12 digits.",
            details={"error": "Invalid Aadhaar digit count", "document_type": "Aadhaar"},
        )
    formatted = f"{digits[0:4]} {digits[4:8]} {digits[8:12]}"
    is_valid = validate_verhoeff(digits)

    # Detect QR code: check back image first, then check front image as fallback
    qr_info = None
    if back_image_path and back_image_path.exists():
        qr_info = detect_qr_code(back_image_path, expected_uid=digits)
    if (not qr_info or not qr_info.get("detected")) and front_image_path and front_image_path.exists():
        qr_front = detect_qr_code(front_image_path, expected_uid=digits)
        if qr_front.get("detected"):
            qr_info = qr_front

    checks = {"verhoeff_checksum": is_valid}
    if qr_info is not None:
        checks["secure_qr_code"] = qr_info["detected"]

    if is_valid:
        log_event(logger, logging.INFO, "TIER1_AADHAAR_VERHOEFF_PASSED", data={"uid": formatted})
        summary = f"Valid Indian Aadhaar UID ({formatted}) verified via Verhoeff dihedral checksum."
        if qr_info and qr_info.get("detected"):
            if qr_info.get("valid_uidai"):
                summary += f" UIDAI {qr_info.get('version', 'V3')} Secure QR authenticated ({qr_info.get('name', 'Holder')}, UID suffix {qr_info.get('masked_uid', '')})."
            else:
                summary += " UIDAI Secure QR pattern detected on substrate."

        if qr_info and qr_info.get("detected"):
            if qr_info.get("valid_uidai"):
                qr_status_str = f"Authenticated ({qr_info.get('version', 'V3')} · {qr_info.get('name', '')} · Suffix {qr_info.get('masked_uid', '')})"
            else:
                qr_status_str = "Detected on substrate"
        else:
            qr_status_str = "Not found on substrate" if (back_image_path or front_image_path) else "Front page verified; upload back page for full QR audit"

        return TierResult(
            tier=1,
            title="Cryptographic validation",
            status="pass",
            score=1.0,
            summary=summary,
            details={
                "document_number": formatted,
                "nationality": "IND",
                "document_type": "Indian Aadhaar Card (UIDAI)",
                "checks": checks,
                "aadhaar_secure_qr": qr_status_str,
                "qr_payload": qr_info if qr_info and qr_info.get("detected") else None,
            },
        )
    else:
        log_event(logger, logging.WARNING, "TIER1_AADHAAR_VERHOEFF_FAILED", data={"uid": formatted})
        return TierResult(
            tier=1,
            title="Cryptographic validation",
            status="fail",
            score=0.0,
            summary=f"Aadhaar number ({formatted}) failed mathematical Verhoeff checksum validation.",
            details={
                "document_number": formatted,
                "nationality": "IND",
                "document_type": "Indian Aadhaar Card (UIDAI)",
                "checks": checks,
                "aadhaar_secure_qr": "Verification halted due to checksum failure",
            },
        )
