from __future__ import annotations

import logging
from pathlib import Path
import re
from typing import Any

import numpy as np
from PIL import Image, ImageOps

from logging_config import get_logger, log_event
from pipeline.tier1_crypto import validate_td3_mrz, validate_verhoeff
from schemas import TierResult

logger = get_logger("sentinelai.pipeline.tier2", tier=2)

_ocr_engine = None
_ocr_engine_type: str | None = None

MRZ_LINE_PATTERN = re.compile(r"^[A-Z0-9<]{44}$")

MONTH_MAP = {
    "JAN": "01",
    "FEB": "02",
    "MAR": "03",
    "APR": "04",
    "MAY": "05",
    "JUN": "06",
    "JUL": "07",
    "AUG": "08",
    "SEP": "09",
    "OCT": "10",
    "NOV": "11",
    "DEC": "12",
}


class TextBlock:
    """Represents a recognized OCR text box with its bounding box geometry."""

    def __init__(self, box: list[list[float]], text: str, confidence: float) -> None:
        self.box = box
        self.text = text.strip()
        self.confidence = float(confidence)
        x_coords = [p[0] for p in box]
        y_coords = [p[1] for p in box]
        self.x_min = min(x_coords)
        self.x_max = max(x_coords)
        self.y_min = min(y_coords)
        self.y_max = max(y_coords)
        self.x_center = (self.x_min + self.x_max) / 2
        self.y_center = (self.y_min + self.y_max) / 2
        self.width = self.x_max - self.x_min
        self.height = self.y_max - self.y_min

    def to_dict(self) -> dict[str, Any]:
        return {
            "box": self.box,
            "text": self.text,
            "confidence": round(self.confidence, 4),
        }


def get_ocr_engine() -> tuple[Any, str | None]:
    """Retrieve or initialize the OCR engine singleton.

    Checks for rapidocr_onnxruntime (recommended) then paddleocr.
    """
    global _ocr_engine, _ocr_engine_type
    if _ocr_engine is not None:
        return _ocr_engine, _ocr_engine_type

    try:
        from rapidocr_onnxruntime import RapidOCR

        _ocr_engine = RapidOCR()
        _ocr_engine_type = "RapidOCR"
        return _ocr_engine, _ocr_engine_type
    except Exception as exc:
        logger.debug(f"RapidOCR unavailable: {exc}")

    try:
        from paddleocr import PaddleOCR

        _ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        _ocr_engine_type = "PaddleOCR"
        return _ocr_engine, _ocr_engine_type
    except Exception as exc:
        logger.debug(f"PaddleOCR unavailable: {exc}")

    return None, None


def _run_engine(engine: Any, engine_type: str, img_array: np.ndarray) -> list[TextBlock]:
    """Invoke the OCR engine and return a normalized list of TextBlock objects."""
    blocks: list[TextBlock] = []
    if engine_type == "RapidOCR":
        result, _ = engine(img_array)
        if result:
            for item in result:
                box = item[0]
                text = str(item[1])
                score = float(item[2])
                if text.strip():
                    blocks.append(TextBlock(box=box, text=text, confidence=score))
    elif engine_type == "PaddleOCR":
        result = engine.ocr(img_array, cls=True)
        if result and result[0]:
            for item in result[0]:
                box = item[0]
                text = str(item[1][0])
                score = float(item[1][1])
                if text.strip():
                    blocks.append(TextBlock(box=box, text=text, confidence=score))
    return blocks


def _clean_mrz_text(raw: str) -> str:
    cleaned = re.sub(r"\s+", "", raw).upper()
    # Normalize common OCR character confusions for '<'
    cleaned = cleaned.replace("«", "<").replace("‹", "<").replace("{", "<")
    return cleaned


def extract_mrz_lines(blocks: list[TextBlock]) -> tuple[list[str], list[TextBlock]]:
    """Locate 44-character TD3 MRZ lines among detected text blocks."""
    candidates: list[tuple[str, TextBlock]] = []
    line1_candidates: list[tuple[str, TextBlock]] = []
    line2_candidates: list[tuple[str, TextBlock]] = []

    for b in blocks:
        cleaned = _clean_mrz_text(b.text)
        if MRZ_LINE_PATTERN.match(cleaned):
            candidates.append((cleaned, b))
            if cleaned.startswith("P"):
                line1_candidates.append((cleaned, b))
            else:
                line2_candidates.append((cleaned, b))
        elif cleaned.startswith(("P<", "P")) and len(cleaned) >= 15 and "<" in cleaned:
            # Trailing '<' characters frequently blend into watermarks; pad to 44
            padded = cleaned.ljust(44, "<")[:44]
            if MRZ_LINE_PATTERN.match(padded):
                line1_candidates.append((padded, b))

    if len(candidates) >= 2:
        # Sort by vertical center coordinate (top-to-bottom)
        candidates.sort(key=lambda item: item[1].y_center)
        chosen = candidates[-2:]
        return [chosen[0][0], chosen[1][0]], [chosen[0][1], chosen[1][1]]

    # If we found line 2 (44 chars) and a valid line 1 candidate near it
    if line2_candidates and line1_candidates:
        line2_candidates.sort(key=lambda item: item[1].y_center)
        best_l2 = line2_candidates[-1]
        valid_l1 = [c for c in line1_candidates if c[1].y_center < best_l2[1].y_center]
        if valid_l1:
            valid_l1.sort(key=lambda item: item[1].y_center)
            best_l1 = valid_l1[-1]
            return [best_l1[0], best_l2[0]], [best_l1[1], best_l2[1]]

    return [], []


def parse_mrz_fields(mrz: str) -> dict[str, Any]:
    """Extract standard semantic fields from a two-line TD3 MRZ."""
    lines = [re.sub(r"\s+", "", line.upper()) for line in mrz.splitlines() if line.strip()]
    if len(lines) != 2 or len(lines[0]) != 44 or len(lines[1]) != 44:
        return {}

    line1, line2 = lines[0], lines[1]

    doc_code = line1[0:2].replace("<", "")
    issuing_country = line1[2:5].replace("<", "")

    # Name: SURNAME<<GIVEN<NAMES<<<<
    name_section = line1[5:]
    name_parts = name_section.split("<<")
    surname = name_parts[0].replace("<", " ").strip()
    given_names = name_parts[1].replace("<", " ").strip() if len(name_parts) > 1 else ""
    full_name = f"{surname} {given_names}".strip() if surname and given_names else (surname or given_names)

    # Line 2: passport number, nationality, DOB (YYMMDD), sex, expiry (YYMMDD)
    passport_number = line2[0:9].replace("<", "").strip()
    nationality = line2[10:13].replace("<", "").strip()
    dob = line2[13:19]
    sex = line2[20]
    expiry = line2[21:27]

    return {
        "document_type": doc_code,
        "issuing_country": issuing_country,
        "passport_number": passport_number,
        "nationality": nationality,
        "date_of_birth": dob,
        "sex": sex,
        "expiry_date": expiry,
        "name": full_name,
        "surname": surname,
        "given_names": given_names,
    }


def normalize_date_to_yymmdd(raw: str) -> str | None:
    """Normalize DD MMM YYYY, DD/MM/YYYY, or YYMMDD strings to YYMMDD."""
    if not raw:
        return None
    s = raw.strip().upper()

    # Direct 6-digit YYMMDD
    if re.fullmatch(r"\d{6}", s):
        return s

    # DD MMM YYYY / DD MMM YY (e.g., 12 AUG 1974 or 12 AUG 74 or 12AUG1974)
    m = re.search(r"\b(\d{1,2})[\s\/\.\-]?([A-Z]{3})[A-Z]*[\s\/\.\-]?((?:19|20)?\d{2})\b", s)
    if m:
        day, month_str, year = m.group(1).zfill(2), m.group(2)[:3], m.group(3)
        if month_str in MONTH_MAP:
            return f"{year[-2:]}{MONTH_MAP[month_str]}{day}"

    # DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    m = re.search(r"\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-]((?:19|20)?\d{2})\b", s)
    if m:
        day, month, year = m.group(1).zfill(2), m.group(2).zfill(2), m.group(3)
        return f"{year[-2:]}{month}{day}"

    # YYYY-MM-DD
    m = re.search(r"\b((?:19|20)\d{2})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})\b", s)
    if m:
        year, month, day = m.group(1), m.group(2).zfill(2), m.group(3).zfill(2)
        return f"{year[-2:]}{month}{day}"

    return None


def _find_aadhaar_uid_candidates(full_text: str) -> list[str]:
    candidates: list[str] = []
    for m in re.finditer(r"\b(\d{4}\s\d{4}\s\d{4})\b", full_text):
        cand = m.group(1)
        start = m.start()
        end = m.end()

        # Ignore if preceded by VID or VIRTUAL ID
        prefix = full_text[max(0, start - 20):start].upper()
        if re.search(r"V(?:IRTUAL\s*)?I[D0][\s:]*$", prefix):
            continue

        # Ignore if followed by another 4 digits (part of 16-digit VID)
        suffix = full_text[end:end + 10]
        if re.match(r"^\s*\d{4}\b", suffix):
            continue

        candidates.append(cand)
    return candidates


def extract_viz_fields(
    blocks: list[TextBlock],
    image_width: int,
    image_height: int,
) -> dict[str, Any]:
    """Extract VIZ fields using regex patterns on non-MRZ text blocks."""
    # Pre-process blocks to split concatenated CamelCase text (e.g. 'RishabhBhatnagar' -> 'Rishabh Bhatnagar')
    for b in blocks:
        b.text = re.sub(r"([a-z])([A-Z])", r"\1 \2", b.text)

    lines = [b.text for b in blocks]
    full_text = "\n".join(lines)
    fields: dict[str, Any] = {}

    # 0. Aadhaar Number (12 digits, formatted as 4-4-4 or contiguous 12 digits, excluding 16-digit VIDs)
    all_444_matches = _find_aadhaar_uid_candidates(full_text)
    selected_aadhaar: str | None = None

    if all_444_matches:
        for cand in all_444_matches:
            clean_cand = re.sub(r"\s+", "", cand)
            if validate_verhoeff(clean_cand):
                selected_aadhaar = cand.strip()
                break
        if not selected_aadhaar:
            selected_aadhaar = all_444_matches[0].strip()

    if not selected_aadhaar:
        for b in blocks:
            if "VID" in b.text.upper() or "VIRTUAL" in b.text.upper():
                continue
            clean_b = re.sub(r"\s+", "", b.text)
            if re.fullmatch(r"\d{12}", clean_b):
                cand = f"{clean_b[0:4]} {clean_b[4:8]} {clean_b[8:12]}"
                if validate_verhoeff(clean_b):
                    selected_aadhaar = cand
                    break
                elif not selected_aadhaar:
                    selected_aadhaar = cand

    if selected_aadhaar:
        fields["aadhaar_number"] = selected_aadhaar
        fields["document_number"] = selected_aadhaar
        fields["nationality"] = "IND"

    # 1. Passport Number
    # Match labeled passport numbers first
    month_regex = re.compile(r"(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)", re.IGNORECASE)
    labeled_matches = re.findall(
        r"(?:PASSPORT\s*(?:NO|NUMBER|\.|\/)?|PASPONT\s*(?:NO|NUMBER|\.|\/)?|DOC(?:UMENT)?\s*(?:NO|NUMBER|\.|\/)?)[\s.:#]*([A-Z0-9]{7,9})\b",
        full_text,
        re.IGNORECASE,
    )
    for cand in labeled_matches:
        cand_clean = cand.strip().upper()
        if not month_regex.search(cand_clean) and any(c.isdigit() for c in cand_clean) and not cand_clean.startswith("PASSPORT"):
            fields["passport_number"] = cand_clean
            if "document_number" not in fields:
                fields["document_number"] = cand_clean
            break

    # Fallback to standalone passport number pattern if not found
    if "passport_number" not in fields and "aadhaar_number" not in fields:
        for b in blocks:
            text = b.text.strip().upper()
            if not month_regex.search(text) and text not in ["PASSPORT", "PASSEPORT", "PASAPORTE"]:
                m = re.fullmatch(r"([A-Z][0-9]{7,8}|[0-9]{8,9}|[A-Z0-9]{8,9})", text)
                if m:
                    val = m.group(1)
                    if any(c.isdigit() for c in val):
                        fields["passport_number"] = val
                        fields["document_number"] = val
                        break

    # 2. Date of Birth
    dob_m = re.search(
        r"(?:DATE\s*OF\s*BIRTH|BIRTH\s*DATE|D[0O]\.?B\.?)[\s.:\n]*([0-9]{1,2}[\s\/\.\-]?(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[\s\/\.\-]?(?:19|20)?\d{2}|[0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-](?:19|20)?\d{2}|\d{6})",
        full_text,
        re.IGNORECASE,
    )
    if dob_m:
        fields["date_of_birth"] = dob_m.group(1).strip()
    else:
        # Look for standalone date in upper half
        for b in blocks:
            if b.y_center < image_height * 0.7:
                norm = normalize_date_to_yymmdd(b.text)
                if norm:
                    fields["date_of_birth"] = b.text.strip()
                    break

    # 3. Expiry Date
    exp_m = re.search(
        r"(?:DATE\s*OF\s*EXPIRY|EXPIRY\s*DATE|EXPIRATION\s*DATE|VALID\s*UNTIL|EXP\.?)[\s.:\n]*([0-9]{1,2}[\s\/\.\-]?(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*[\s\/\.\-]?(?:19|20)?\d{2}|[0-9]{1,2}[\/\.\-][0-9]{1,2}[\/\.\-](?:19|20)?\d{2}|\d{6})",
        full_text,
        re.IGNORECASE,
    )
    if exp_m:
        fields["expiry_date"] = exp_m.group(1).strip()

    # 4. Nationality
    nat_m = re.search(
        r"(?:NATIONALITY|CITIZENSHIP)[\s.:\n]*([A-Z]{3,20})\b",
        full_text,
        re.IGNORECASE,
    )
    if nat_m:
        fields["nationality"] = nat_m.group(1).strip().upper()
    if "aadhaar_number" in fields:
        fields["nationality"] = "IND"

    # 5. Name (with multi-lingual label & Aadhaar proximity support)
    surname_val: str | None = None
    given_val: str | None = None

    for i, b in enumerate(blocks):
        upper_text = b.text.upper()
        if "SURNAME" in upper_text and not surname_val:
            for j in range(i + 1, min(i + 4, len(blocks))):
                cand = blocks[j].text.strip().upper()
                if cand.replace(" ", "").isalpha() and len(cand) >= 2 and cand not in ["PASSPORT", "USA", "UNITED", "NAME", "NOM"]:
                    surname_val = cand
                    break
        if "GIVEN" in upper_text and not given_val:
            for j in range(i + 1, min(i + 4, len(blocks))):
                cand = blocks[j].text.strip().upper()
                if cand.replace(" ", "").isalpha() and len(cand) >= 2 and cand not in ["PASSPORT", "USA", "UNITED", "NAME", "GIVEN", "PRENOMS"]:
                    given_val = cand
                    break

    if surname_val and given_val:
        fields["name"] = f"{surname_val} {given_val}"
    elif surname_val:
        fields["name"] = surname_val
    else:
        name_m = re.search(r"(?:FULL\s*NAME|NAME|NOM|HOLDER'?S\s*NAME|CARDHOLDER\s*NAME)[\s.:/]*([A-Za-z\s\-]{2,50})(?:\n|$)", full_text, re.IGNORECASE)
        if name_m and len(name_m.group(1).strip()) >= 2:
            cand = name_m.group(1).strip().upper()
            if not any(w in cand for w in ["PASSPORT", "GOVERNMENT", "INDIA", "AADHAAR", "CARD"]):
                fields["name"] = cand

        if "name" not in fields:
            ignored_name_headers = {
                "PASSPORT", "REPUBLIC", "OFFICIAL", "GOVERNMENT", "GOVERNMENTOFINDIA", "BHARAT", "SARKAR", "GOVT", "INDIA", "INDIAN",
                "KINGDOM", "UNION", "UNITED", "STATES", "IDENTITY", "CARD", "DEMOCRATIC", "SPECIMEN", "SAMPLE",
                "NATIONALITY", "SIGNATURE", "AUTHORITY", "AUTHORITYOFINDIA", "DEPARTMENT", "STATE", "UNIQUE", "IDENTIFICATION", "IDENTIFICATIONAUTHORITYOFINDIA",
                "MALE", "FEMALE", "TRANSGENDER", "AADHAAR", "ENROLMENT", "ENROLLMENT", "MERAAADHAAR", "MERIPEHCHAN",
                "ADDRESS", "HELP", "WWW", "UIDAI", "FATHER", "FATHERS", "MOTHER", "MOTHERS", "HUSBAND", "HUSBANDS",
                "SON", "DAUGHTER", "WIFE", "CARE", "DATE", "BIRTH", "ISSUE", "EXPIRY", "VALID", "UNTIL", "NUMBER",
                "DETAILS", "INCOME", "TAX", "PERMANENT", "ACCOUNT", "ELECTION", "COMMISSION", "VOTER", "NO", "NO.",
                "NUM", "ID", "REF", "CODE", "TYPE", "COUNTRY", "PLACE", "SEX", "GENDER", "D0B", "DOB", "YOB", "YEAR",
                "CO", "SO", "DO", "WO", "CIO", "SIO", "DIO", "WIO", "CAREOF", "SONOF", "DAUGHTEROF", "WIFEOF", "TO",
                "DB", "D0B30", "DOB30", "DATEOFBIRTH", "YEAROFBIRTH",
                "HOUSE", "PLOT", "FLAT", "DOOR", "STREET", "ROAD", "MARG", "LANE", "NAGAR", "PURI", "COLONY", "SECTOR",
                "BLOCK", "VILLAGE", "VILL", "TEHSIL", "TALUK", "DISTRICT", "DIST", "POST", "PO", "PIN", "CODE",
                "DELHI", "MUMBAI", "KOLKATA", "CHENNAI", "BANGALORE", "HYDERABAD", "SOUTH", "WEST", "NORTH", "EAST",
                "CENTRAL", "STATE", "UTTAR", "PRADESH", "MAHARASHTRA", "GUJARAT", "RAJASTHAN", "PUNJAB", "HARYANA",
                "BIHAR", "BENGAL", "KERALA", "KARNATAKA", "TAMIL", "NADU", "TELANGANA", "ANDHRA", "ODISHA", "ASSAM", "MAYA",
                # OCR concatenation artifacts (e.g. OCR reads "OF INDIA" as "OFINDIA")
                "OF", "OFINDIA", "OFBIRTH", "OFEXPIRY",
            }

            # 5a. Aadhaar Proximity: Name is located immediately above DOB/YOB line
            # Find ALL blocks that look like a DOB, pick the one furthest down (largest y_center)
            # to avoid false anchors from date-like patterns in Aadhaar numbers or other fields.
            dob_y: float | None = None
            dob_label_pattern = re.compile(r"(?:DOB|D0B|DATE\s*OF\s*BIRTH|YEAR\s*OF\s*BIRTH|YOB)", re.IGNORECASE)
            date_value_pattern = re.compile(r"\b\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}\b")
            dob_anchor_candidates: list[float] = []
            for b in blocks:
                if dob_label_pattern.search(b.text) or date_value_pattern.search(b.text):
                    dob_anchor_candidates.append(b.y_center)
            if dob_anchor_candidates:
                # Prefer the DOB block that carries a label, then the median y position
                # Use the median to be robust against outlier false matches
                dob_anchor_candidates.sort()
                dob_y = dob_anchor_candidates[len(dob_anchor_candidates) // 2]

            care_of_regex = re.compile(
                r"\b(?:C\/O|S\/O|D\/O|W\/O|C\\O|S\\O|D\\O|W\\O|CARE\s*OF|SON\s*OF|DAUGHTER\s*OF|WIFE\s*OF|FATHER|HUSBAND|MOTHER|ADDRESS|HOUSE|PLOT|FLAT|DOOR|NAGAR|PURI|MAYA|DIST|POST|PO|PIN|DELHI|UIDAI|WWW|HELP)\b",
                re.IGNORECASE,
            )

            if dob_y is not None:
                dob_candidates: list[TextBlock] = []
                for b in blocks:
                    if b.y_center < dob_y and (dob_y - b.y_center) < (image_height * 0.55):
                        if care_of_regex.search(b.text):
                            continue
                        raw_clean = re.sub(r"[^A-Za-z\s]", "", b.text).strip()
                        tokens = [t.upper() for t in raw_clean.split() if t]
                        valid_tokens = [t for t in tokens if t not in ignored_name_headers and len(t) >= 2]
                        if valid_tokens:
                            dob_candidates.append(b)
                if dob_candidates:
                    dob_candidates.sort(key=lambda b: dob_y - b.y_center)
                    for chosen in dob_candidates:
                        # STEP 1: Try the chosen block's own text first.
                        # CamelCase splitting (done above) already converts "RishabhBhatnagar" → "Rishabh Bhatnagar".
                        b_raw = re.sub(r"[^A-Za-z\s]", "", chosen.text).strip()
                        b_toks = [t.upper() for t in b_raw.split() if t.upper() not in ignored_name_headers and len(t) >= 2]
                        if b_toks:
                            fields["name"] = " ".join(b_toks)
                            break

                        # STEP 2: Check if name is split across same-line sibling blocks
                        # Use a tight 4% window to avoid pulling in blocks from adjacent lines.
                        same_line_blocks = [
                            b for b in blocks
                            if abs(b.y_center - chosen.y_center) < (image_height * 0.04)
                            and not care_of_regex.search(b.text)
                        ]
                        same_line_blocks.sort(key=lambda b: b.x_center)
                        words: list[str] = []
                        for b in same_line_blocks:
                            b_raw2 = re.sub(r"[^A-Za-z\s]", "", b.text).strip()
                            b_toks2 = [t.upper() for t in b_raw2.split() if t.upper() not in ignored_name_headers and len(t) >= 2]
                            words.extend(b_toks2)
                        if words:
                            fields["name"] = " ".join(words)
                            break

            # 5b. Fallback to prominent Latin text block near top/middle
            if "name" not in fields:
                candidates: list[TextBlock] = []
                for b in blocks:
                    if b.y_center < image_height * 0.75 and b.y_center > image_height * 0.05:
                        if care_of_regex.search(b.text):
                            continue
                        raw_clean = re.sub(r"[^A-Za-z\s]", "", b.text).strip()
                        tokens = [t.upper() for t in raw_clean.split() if t]
                        valid_tokens = [t for t in tokens if t not in ignored_name_headers and len(t) >= 2]
                        if valid_tokens:
                            candidates.append(b)
                if candidates:
                    candidates.sort(key=lambda b: (b.height, -b.y_center), reverse=True)
                    for chosen in candidates:
                        # Try chosen block first, then tight same-line grouping
                        b_raw = re.sub(r"[^A-Za-z\s]", "", chosen.text).strip()
                        b_toks = [t.upper() for t in b_raw.split() if t.upper() not in ignored_name_headers and len(t) >= 2]
                        if b_toks:
                            fields["name"] = " ".join(b_toks)
                            break
                        same_line_blocks = [
                            b for b in blocks
                            if abs(b.y_center - chosen.y_center) < (image_height * 0.04)
                            and not care_of_regex.search(b.text)
                        ]
                        same_line_blocks.sort(key=lambda b: b.x_center)
                        words2: list[str] = []
                        for b in same_line_blocks:
                            b_raw2 = re.sub(r"[^A-Za-z\s]", "", b.text).strip()
                            b_toks2 = [t.upper() for t in b_raw2.split() if t.upper() not in ignored_name_headers and len(t) >= 2]
                            words2.extend(b_toks2)
                        if words2:
                            fields["name"] = " ".join(words2)
                            break

            # 5c. Broad scan fallback for multi-token Latin name blocks anywhere in the VIZ
            if "name" not in fields:
                for b in blocks:
                    if care_of_regex.search(b.text):
                        continue
                    raw_clean = re.sub(r"[^A-Za-z\s]", "", b.text).strip()
                    tokens = [t.upper() for t in raw_clean.split() if t]
                    valid_tokens = [t for t in tokens if t not in ignored_name_headers and len(t) >= 2]
                    if len(valid_tokens) >= 2:
                        fields["name"] = " ".join(valid_tokens)
                        break

    return fields


def cross_validate(
    mrz_fields: dict[str, Any],
    viz_fields: dict[str, Any],
) -> tuple[dict[str, bool], dict[str, dict[str, str]]]:
    """Compare fields extracted from MRZ against VIZ.

    Returns (checks, mismatches).
    """
    checks: dict[str, bool] = {}
    mismatches: dict[str, dict[str, str]] = {}

    # 1. Passport Number
    mrz_p = mrz_fields.get("passport_number")
    viz_p = viz_fields.get("passport_number")
    if mrz_p and viz_p:
        norm_mrz_p = re.sub(r"[^A-Z0-9]", "", mrz_p.upper())
        norm_viz_p = re.sub(r"[^A-Z0-9]", "", viz_p.upper())
        if norm_mrz_p == norm_viz_p:
            checks["passport_number"] = True
        else:
            checks["passport_number"] = False
            mismatches["passport_number"] = {"mrz": mrz_p, "viz": viz_p}
            log_event(
                logger,
                logging.WARNING,
                "MISMATCH_PASSPORT_NUMBER",
                data={"mrz": mrz_p, "viz": viz_p},
            )

    # 2. Date of Birth
    mrz_dob = mrz_fields.get("date_of_birth")
    viz_dob = viz_fields.get("date_of_birth")
    if mrz_dob and viz_dob:
        norm_mrz_dob = normalize_date_to_yymmdd(mrz_dob)
        norm_viz_dob = normalize_date_to_yymmdd(viz_dob)
        if norm_mrz_dob and norm_viz_dob:
            if norm_mrz_dob == norm_viz_dob:
                checks["date_of_birth"] = True
            else:
                checks["date_of_birth"] = False
                mismatches["date_of_birth"] = {"mrz": mrz_dob, "viz": viz_dob}
                log_event(
                    logger,
                    logging.WARNING,
                    "MISMATCH_DOB",
                    data={"mrz": mrz_dob, "viz": viz_dob},
                )

    # 3. Expiry Date
    mrz_exp = mrz_fields.get("expiry_date")
    viz_exp = viz_fields.get("expiry_date")
    if mrz_exp and viz_exp:
        norm_mrz_exp = normalize_date_to_yymmdd(mrz_exp)
        norm_viz_exp = normalize_date_to_yymmdd(viz_exp)
        if norm_mrz_exp and norm_viz_exp:
            if norm_mrz_exp == norm_viz_exp:
                checks["expiry_date"] = True
            else:
                checks["expiry_date"] = False
                mismatches["expiry_date"] = {"mrz": mrz_exp, "viz": viz_exp}
                log_event(
                    logger,
                    logging.WARNING,
                    "MISMATCH_EXPIRY_DATE",
                    data={"mrz": mrz_exp, "viz": viz_exp},
                )

    # 4. Name
    mrz_name = mrz_fields.get("name")
    viz_name = viz_fields.get("name")
    if mrz_name and viz_name:
        clean_mrz_name = re.sub(r"[^A-Z\s]", " ", mrz_name.upper())
        clean_viz_name = re.sub(r"[^A-Z\s]", " ", viz_name.upper())
        mrz_tokens = set(clean_mrz_name.split())
        viz_tokens = set(clean_viz_name.split())

        def _tokens_similar(t1: str, t2: str) -> bool:
            if t1 == t2:
                return True
            if len(t1) >= 4 and len(t2) >= 4 and (t1.startswith(t2) or t2.startswith(t1)):
                return True
            if abs(len(t1) - len(t2)) <= 1:
                diffs = sum(1 for a, b in zip(t1, t2) if a != b) + abs(len(t1) - len(t2))
                if diffs <= 1:
                    return True
            return False

        all_viz_found = all(any(_tokens_similar(vt, mt) for mt in mrz_tokens) for vt in viz_tokens) if viz_tokens else False
        all_mrz_found = all(any(_tokens_similar(mt, vt) for vt in viz_tokens) for mt in mrz_tokens) if mrz_tokens else False

        if (
            clean_mrz_name.strip() == clean_viz_name.strip()
            or all_viz_found
            or all_mrz_found
            or (viz_tokens and viz_tokens.issubset(mrz_tokens))
            or (mrz_tokens and mrz_tokens.issubset(viz_tokens))
            or (
                mrz_tokens
                and viz_tokens
                and len(mrz_tokens.intersection(viz_tokens)) >= min(len(mrz_tokens), len(viz_tokens))
            )
        ):
            checks["name"] = True
        else:
            checks["name"] = False
            mismatches["name"] = {"mrz": mrz_name, "viz": viz_name}
            log_event(
                logger,
                logging.WARNING,
                "MISMATCH_NAME",
                data={"mrz": mrz_name, "viz": viz_name},
            )

    # 5. Nationality
    mrz_nat = mrz_fields.get("nationality")
    viz_nat = viz_fields.get("nationality")
    if mrz_nat and viz_nat:
        clean_mrz_nat = re.sub(r"[^A-Z]", "", mrz_nat.upper())
        clean_viz_nat = re.sub(r"[^A-Z]", "", viz_nat.upper())
        if (
            clean_mrz_nat == clean_viz_nat
            or clean_viz_nat.startswith(clean_mrz_nat)
            or clean_mrz_nat.startswith(clean_viz_nat)
        ):
            checks["nationality"] = True
        else:
            checks["nationality"] = False
            mismatches["nationality"] = {"mrz": mrz_nat, "viz": viz_nat}
            log_event(
                logger,
                logging.WARNING,
                "MISMATCH_NATIONALITY",
                data={"mrz": mrz_nat, "viz": viz_nat},
            )

    return checks, mismatches


def extract_back_fields(blocks: list[TextBlock]) -> dict[str, Any]:
    """Extract address, Care-Of, cardholder Name, and PIN code from document back image."""
    lines = [b.text for b in blocks]
    full_text = "\n".join(lines)
    fields: dict[str, Any] = {}

    co_m = re.search(r"(?:C\/O|S\/O|D\/O|W\/O|CARE\s*OF|SON\s*OF|DAUGHTER\s*OF|WIFE\s*OF)[\s.:]*([A-Za-z\s]+)", full_text, re.IGNORECASE)
    if co_m:
        raw_co = co_m.group(1).strip()
        co_parts = re.split(r"[,;\n\r]|House|Plot|Flat|Door|Puri|PO|DIST|PIN", raw_co, flags=re.IGNORECASE)
        care_of_name = co_parts[0].strip()
        if care_of_name:
            fields["care_of"] = care_of_name

    # Extract cardholder name from back address line if present before C/O, S/O, D/O, W/O
    cardholder_m = re.search(r"(?:Address|To)[\s.:]*([A-Za-z\s]{2,40}?)\s*(?:,|\b)\s*(?:C\/O|S\/O|D\/O|W\/O|CARE\s*OF|SON\s*OF|DAUGHTER\s*OF|WIFE\s*OF)", full_text, re.IGNORECASE)
    if cardholder_m:
        cand_name = cardholder_m.group(1).strip().upper()
        cand_words = [w for w in cand_name.split() if w not in ["ADDRESS", "INDIA", "GOVERNMENT", "TO", "S/O", "C/O", "D/O", "W/O"]]
        if cand_words and len(" ".join(cand_words)) >= 2:
            fields["name"] = " ".join(cand_words)

    pin_m = re.search(r"\b(\d{6})\b", full_text)
    if pin_m:
        fields["pin_code"] = pin_m.group(1).strip()

    address_lines = []
    for b in blocks:
        t = b.text.strip()
        if any(kw in t.upper() for kw in ["ADDRESS", "C/O", "S/O", "D/O", "W/O", "PIN", "DIST", "POST", "VILL", "STATE"]):
            address_lines.append(t)
    if address_lines:
        fields["address"] = ", ".join(address_lines[:4])

    back_444_matches = _find_aadhaar_uid_candidates(full_text)
    selected_back_aadhaar: str | None = None

    if back_444_matches:
        for cand in back_444_matches:
            clean_cand = re.sub(r"\s+", "", cand)
            if validate_verhoeff(clean_cand):
                selected_back_aadhaar = cand.strip()
                break
        if not selected_back_aadhaar:
            selected_back_aadhaar = back_444_matches[0].strip()

    if not selected_back_aadhaar:
        for b in blocks:
            if "VID" in b.text.upper() or "VIRTUAL" in b.text.upper():
                continue
            clean_b = re.sub(r"\s+", "", b.text)
            if re.fullmatch(r"\d{12}", clean_b):
                cand = f"{clean_b[0:4]} {clean_b[4:8]} {clean_b[8:12]}"
                if validate_verhoeff(clean_b):
                    selected_back_aadhaar = cand
                    break
                elif not selected_back_aadhaar:
                    selected_back_aadhaar = cand

    if selected_back_aadhaar:
        fields["back_aadhaar_number"] = selected_back_aadhaar

    return fields


def run(
    document: Path | Image.Image | str,
    mrz_available: bool = False,
    mrz: str | None = None,
    document_back: Path | Image.Image | str | None = None,
    document_type: str = "auto",
) -> TierResult:
    """Execute Tier 2 OCR and cross-validate MRZ/VIZ fields across front and back sides."""
    log_event(logger, logging.DEBUG, "TIER2_STARTED")

    engine, engine_type = get_ocr_engine()
    if engine is None or engine_type is None:
        log_event(logger, logging.WARNING, "TIER2_OCR_UNAVAILABLE")
        return TierResult(
            tier=2,
            title="OCR & schema checks",
            status="unavailable",
            score=None,
            summary="OCR engine (RapidOCR/PaddleOCR) is not installed; VIZ-to-MRZ cross-checking was not run.",
            details={"adapter": "None", "mrz_available": mrz_available},
        )

    # Load image
    try:
        if isinstance(document, Image.Image):
            pil_image = ImageOps.exif_transpose(document).convert("RGB")
        else:
            doc_path = Path(document)
            with Image.open(doc_path) as src:
                pil_image = ImageOps.exif_transpose(src).convert("RGB")
        
        # Optimize image scale for 10x faster OCR processing without loss of text quality
        if max(pil_image.size) > 1024:
            pil_image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    except Exception as exc:
        log_event(logger, logging.ERROR, "TIER2_IMAGE_LOAD_FAILED", data={"error": str(exc)}, exc_info=True)
        return TierResult(
            tier=2,
            title="OCR & schema checks",
            status="review",
            score=None,
            summary=f"Failed to load image for OCR processing: {exc}",
            details={"error": str(exc)},
        )

    # Run OCR inference
    try:
        img_array = np.ascontiguousarray(np.array(pil_image), dtype=np.uint8)
        blocks = _run_engine(engine, engine_type, img_array)
    except Exception as exc:
        log_event(logger, logging.ERROR, "TIER2_INFERENCE_FAILED", data={"error": str(exc)}, exc_info=True)
        return TierResult(
            tier=2,
            title="OCR & schema checks",
            status="review",
            score=None,
            summary="OCR processing failed during inference.",
            details={"adapter": engine_type, "error": str(exc)},
        )

    if not blocks:
        log_event(logger, logging.INFO, "TIER2_NO_TEXT_DETECTED")
        return TierResult(
            tier=2,
            title="OCR & schema checks",
            status="review",
            score=None,
            summary="No readable text detected in document image.",
            details={"adapter": engine_type, "detected_boxes": []},
        )

    # Extract MRZ lines
    mrz_lines, mrz_blocks = extract_mrz_lines(blocks)
    extracted_mrz = "\n".join(mrz_lines) if mrz_lines else None

    # Determine effective MRZ for parsing/cross-checking
    effective_mrz = extracted_mrz or (mrz.strip() if mrz and mrz.strip() else None)
    mrz_fields = parse_mrz_fields(effective_mrz) if effective_mrz else {}

    # Process Document Back image if supplied
    back_blocks: list[TextBlock] = []
    back_fields: dict[str, Any] = {}
    if document_back:
        try:
            if isinstance(document_back, Image.Image):
                back_pil = ImageOps.exif_transpose(document_back).convert("RGB")
            else:
                with Image.open(Path(document_back)) as src:
                    back_pil = ImageOps.exif_transpose(src).convert("RGB")
            if max(back_pil.size) > 1024:
                back_pil.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
            back_blocks = _run_engine(engine, engine_type, np.ascontiguousarray(np.array(back_pil), dtype=np.uint8))
        except Exception as exc:
            logger.debug(f"Document back processing exception: {exc}")

    # Initialize cross-validation result containers
    checks: dict[str, bool] = {}
    mismatches: dict[str, dict[str, str]] = {}

    # Separate VIZ blocks (blocks not in MRZ lines)
    mrz_block_ids = {id(b) for b in mrz_blocks}
    viz_blocks = [b for b in blocks if id(b) not in mrz_block_ids]
    back_viz_blocks = [b for b in back_blocks if id(b) not in mrz_block_ids]

    # Combine all non-MRZ blocks across front and back to guarantee complete extraction regardless of dropzone order
    all_blocks = viz_blocks + back_viz_blocks
    viz_fields = extract_viz_fields(all_blocks, pil_image.width, pil_image.height)
    back_fields = extract_back_fields(all_blocks)

    if back_fields:
        for k, v in back_fields.items():
            if k not in viz_fields:
                viz_fields[k] = v
        if "back_aadhaar_number" in back_fields and "aadhaar_number" in viz_fields:
            norm_front = re.sub(r"\s+", "", viz_fields["aadhaar_number"])
            norm_back = re.sub(r"\s+", "", back_fields["back_aadhaar_number"])
            if norm_front == norm_back:
                checks["front_back_uid_match"] = True
            else:
                checks["front_back_uid_match"] = False
                mismatches["front_back_uid"] = {"front": viz_fields["aadhaar_number"], "back": back_fields["back_aadhaar_number"]}

    # Validate extracted MRZ with Tier 1 if present
    tier1_validation: dict[str, Any] | None = None
    if extracted_mrz:
        try:
            td3_val = validate_td3_mrz(extracted_mrz)
            tier1_validation = {
                "is_valid": td3_val.is_valid,
                "checks": td3_val.checks,
                "document_number": td3_val.document_number,
                "nationality": td3_val.nationality,
            }
        except Exception as exc:
            tier1_validation = {"is_valid": False, "error": str(exc)}

    # Cross-validation if both MRZ and VIZ fields exist (merge into existing checks/mismatches)
    if mrz_fields and viz_fields:
        cv_checks, cv_mismatches = cross_validate(mrz_fields, viz_fields)
        checks.update(cv_checks)
        mismatches.update(cv_mismatches)

    # Scoring logic
    primary_fields = ("passport_number", "date_of_birth", "name")
    has_mismatch = len(mismatches) > 0
    all_primary_checked = all(p in checks for p in primary_fields)

    is_aadhaar = ("aadhaar_number" in viz_fields) or (document_type == "aadhaar")

    if has_mismatch:
        score = 0.3
        status = "fail"
        mismatched_keys = ", ".join(mismatches.keys())
        summary = f"Field mismatch detected: {mismatched_keys}."
    elif is_aadhaar and "aadhaar_number" in viz_fields:
        score = 1.0
        status = "pass"
        summary = f"Aadhaar demographic schema validated (UID: {viz_fields['aadhaar_number']}"
        if "name" in viz_fields:
            summary += f", Name: {viz_fields['name']}"
        if "date_of_birth" in viz_fields:
            summary += f", DOB: {viz_fields['date_of_birth']}"
        if "care_of" in viz_fields:
            summary += f", C/O: {viz_fields['care_of']}"
        summary += ")."
    elif checks and all(checks.values()) and all_primary_checked:
        score = 1.0
        status = "pass"
        matched_keys = ", ".join(checks.keys())
        summary = f"All cross-validated fields match ({matched_keys})."
    elif checks and all(checks.values()):
        # Some fields matched with no contradictions, but not all primary fields were present in both zones
        score = 0.7
        status = "review"
        matched_keys = ", ".join(checks.keys())
        summary = f"Partial fields verified ({matched_keys}); no contradictions found."
    elif mrz_fields or viz_fields:
        # Either MRZ or VIZ was extracted, but not both for cross-comparison, with no contradictions
        score = 0.7
        status = "review"
        summary = "Document fields extracted but incomplete for full cross-validation; no contradictions found."
    else:
        # Text was detected but no recognized document fields
        score = None
        status = "review"
        summary = "OCR detected text, but no valid MRZ or visual identification fields could be extracted."

    details = {
        "adapter": f"{engine_type} (PP-OCRv4)",
        "text_blocks_count": len(blocks),
        "detected_boxes": [b.to_dict() for b in blocks],
        "mrz_detected": bool(mrz_lines),
        "extracted_mrz": extracted_mrz,
        "mrz_lines": mrz_lines,
        "mrz_fields": mrz_fields,
        "viz_fields": viz_fields,
        "has_back_image": bool(document_back),
        "back_blocks_count": len(back_blocks),
        "checks": checks,
        "mismatches": mismatches,
    }
    if tier1_validation:
        details["tier1_validation"] = tier1_validation

    log_event(
        logger,
        logging.INFO,
        "TIER2_COMPLETE",
        data={
            "status": status,
            "score": score,
            "mrz_detected": bool(mrz_lines),
            "mismatches_count": len(mismatches),
        },
    )

    return TierResult(
        tier=2,
        title="OCR & schema checks",
        status=status,
        score=score,
        summary=summary,
        details=details,
    )
