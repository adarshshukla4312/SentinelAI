import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from pipeline import tier2_ocr
from pipeline.tier2_ocr import (
    _clean_mrz_text,
    normalize_date_to_yymmdd,
    parse_mrz_fields,
    run,
)


def _get_font(size: int = 20) -> ImageFont.ImageFont:
    font_paths = [
        "C:\\Windows\\Fonts\\cour.ttf",
        "C:\\Windows\\Fonts\\consola.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ]
    for p in font_paths:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def _create_passport_test_image(
    viz_passport: str | None = "L898902C3",
    viz_name: str | None = "ERIKSSON ANNA MARIA",
    viz_dob: str | None = "12 AUG 1974",
    include_mrz: bool = True,
    mrz_lines: list[str] | None = None,
) -> Image.Image:
    font = _get_font(20)
    img = Image.new("RGB", (1000, 320), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    if viz_passport:
        draw.text((20, 20), f"PASSPORT NO: {viz_passport}", fill=(0, 0, 0), font=font)
    if viz_name:
        draw.text((20, 60), f"NAME: {viz_name}", fill=(0, 0, 0), font=font)
    if viz_dob:
        draw.text((20, 100), f"DATE OF BIRTH: {viz_dob}", fill=(0, 0, 0), font=font)

    if include_mrz:
        if mrz_lines is None:
            mrz_lines = [
                "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
                "L898902C36UTO7408122F1204159ZE184226B<<<<<10",
            ]
        draw.text((20, 180), mrz_lines[0], fill=(0, 0, 0), font=font)
        draw.text((20, 220), mrz_lines[1], fill=(0, 0, 0), font=font)

    return img


class Tier2OCRTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        # Pre-initialize OCR engine once for the test suite
        tier2_ocr.get_ocr_engine()

    def test_extract_mrz_from_image(self) -> None:
        """Test that an image with MRZ text extracts MRZ lines correctly."""
        img = _create_passport_test_image(viz_passport=None, viz_name=None, viz_dob=None, include_mrz=True)
        result = run(img)

        self.assertIn(result.status, ("pass", "review"))
        self.assertTrue(result.details.get("mrz_detected"))
        extracted = result.details.get("extracted_mrz")
        self.assertIsNotNone(extracted)
        lines = result.details.get("mrz_lines", [])
        self.assertEqual(len(lines), 2)
        self.assertTrue(lines[0].startswith("P<UTO"))
        self.assertTrue(lines[1].startswith("L898902C3"))

        # Verify Tier 1 cryptographic validation ran on the extracted MRZ
        tier1_val = result.details.get("tier1_validation")
        self.assertIsNotNone(tier1_val)
        self.assertTrue(tier1_val.get("is_valid"))

    def test_non_document_image_returns_review(self) -> None:
        """Test that a non-document image returns review status with score=None."""
        blank_img = Image.new("RGB", (400, 300), color=(240, 240, 240))
        result = run(blank_img)

        self.assertEqual(result.status, "review")
        self.assertIsNone(result.score)
        self.assertIn("No readable text detected", result.summary)

    def test_cross_validation_catches_mismatched_passport_number(self) -> None:
        """Test that cross-validation catches a mismatched passport number."""
        mismatched_img = _create_passport_test_image(
            viz_passport="A9999999",  # Does not match L898902C3 in MRZ
            viz_name="ERIKSSON ANNA MARIA",
            viz_dob="12 AUG 1974",
            include_mrz=True,
        )
        result = run(mismatched_img)

        self.assertEqual(result.status, "fail")
        self.assertEqual(result.score, 0.3)
        self.assertIn("passport_number", result.details.get("mismatches", {}))
        self.assertFalse(result.details["checks"]["passport_number"])
        self.assertIn("passport_number", result.summary)

    def test_cross_validation_all_match_scores_pass(self) -> None:
        """Test that matching VIZ and MRZ yields pass status and score 1.0."""
        matching_img = _create_passport_test_image(
            viz_passport="L898902C3",
            viz_name="ERIKSSON ANNA MARIA",
            viz_dob="12 AUG 1974",
            include_mrz=True,
        )
        result = run(matching_img)

        self.assertEqual(result.status, "pass")
        self.assertEqual(result.score, 1.0)
        checks = result.details.get("checks", {})
        self.assertTrue(checks.get("passport_number"))
        self.assertTrue(checks.get("date_of_birth"))
        self.assertTrue(checks.get("name"))
        self.assertEqual(len(result.details.get("mismatches", {})), 0)

    def test_partial_fields_returns_review(self) -> None:
        """Test that missing fields without contradictions yields score=0.7, status=review."""
        partial_img = _create_passport_test_image(
            viz_passport=None,
            viz_name=None,
            viz_dob=None,
            include_mrz=True,
        )
        result = run(partial_img)

        self.assertEqual(result.status, "review")
        self.assertEqual(result.score, 0.7)
        self.assertEqual(len(result.details.get("mismatches", {})), 0)

    def test_run_with_document_file_path(self) -> None:
        """Test that run() works seamlessly when passed a Path or file path string."""
        img = _create_passport_test_image()
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_path = Path(tmp.name)
            img.save(tmp_path)

        try:
            result = run(tmp_path)
            self.assertEqual(result.tier, 2)
            self.assertIn(result.status, ("pass", "review"))
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_fallback_when_ocr_not_installed(self) -> None:
        """Test graceful fallback returning unavailable status when OCR is absent."""
        img = Image.new("RGB", (200, 100), color=(255, 255, 255))
        with patch.object(tier2_ocr, "get_ocr_engine", return_value=(None, None)):
            result = run(img)
            self.assertEqual(result.status, "unavailable")
            self.assertIsNone(result.score)
            self.assertIn("not installed", result.summary)

    def test_date_normalization_patterns(self) -> None:
        """Unit test the various date format normalizations to YYMMDD."""
        self.assertEqual(normalize_date_to_yymmdd("12 AUG 1974"), "740812")
        self.assertEqual(normalize_date_to_yymmdd("12 AUG1974"), "740812")
        self.assertEqual(normalize_date_to_yymmdd("12/08/1974"), "740812")
        self.assertEqual(normalize_date_to_yymmdd("12-08-1974"), "740812")
        self.assertEqual(normalize_date_to_yymmdd("740812"), "740812")
        self.assertEqual(normalize_date_to_yymmdd("15 APR 2012"), "120415")
        self.assertEqual(normalize_date_to_yymmdd("15/04/2012"), "120415")
        self.assertEqual(normalize_date_to_yymmdd("120415"), "120415")
        self.assertEqual(normalize_date_to_yymmdd("2026-09-11"), "260911")

    def test_mrz_field_parsing(self) -> None:
        """Unit test standard TD3 MRZ semantic field parsing."""
        mrz = (
            "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\n"
            "L898902C36UTO7408122F1204159ZE184226B<<<<<10"
        )
        parsed = parse_mrz_fields(mrz)
        self.assertEqual(parsed["passport_number"], "L898902C3")
        self.assertEqual(parsed["nationality"], "UTO")
        self.assertEqual(parsed["date_of_birth"], "740812")
        self.assertEqual(parsed["expiry_date"], "120415")
        self.assertEqual(parsed["name"], "ERIKSSON ANNA MARIA")

    def test_aadhaar_name_extraction_from_blocks(self) -> None:
        """Unit test extract_viz_fields and extract_back_fields for Aadhaar cards."""
        from pipeline.tier2_ocr import TextBlock, extract_viz_fields, extract_back_fields

        def make_block(text: str, x_center: float, y_center: float, width: float = 400, height: float = 20, conf: float = 0.95) -> TextBlock:
            """Build a TextBlock from center coords. box is [[xmin,ymin],[xmax,ymin],[xmax,ymax],[xmin,ymax]]."""
            xmin, xmax = x_center - width / 2, x_center + width / 2
            ymin, ymax = y_center - height / 2, y_center + height / 2
            box = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]]
            return TextBlock(box=box, text=text, confidence=conf)

        blocks = [
            make_block("Government of India", x_center=200, y_center=30),
            make_block("RISHABH BHATNAGAR", x_center=200, y_center=100, height=25),
            make_block("DOB: 30/06/2006", x_center=200, y_center=150),
            make_block("MALE", x_center=200, y_center=180),
            make_block("2054 3809 8275", x_center=200, y_center=230, height=30),
        ]
        viz_fields = extract_viz_fields(blocks, image_width=800, image_height=320)
        self.assertEqual(viz_fields.get("name"), "RISHABH BHATNAGAR")
        self.assertEqual(viz_fields.get("aadhaar_number"), "2054 3809 8275")
        self.assertEqual(viz_fields.get("date_of_birth"), "30/06/2006")

        back_blocks = [
            make_block("Address: Rishabh Bhatnagar, S/O: Mohit Bhatnagar, House, Puri", x_center=300, y_center=100),
            make_block("PO: Maya Puri, DIST: 110064", x_center=300, y_center=140),
        ]
        back_fields = extract_back_fields(back_blocks)
        self.assertEqual(back_fields.get("care_of"), "Mohit Bhatnagar")
        self.assertEqual(back_fields.get("name"), "RISHABH BHATNAGAR")
        self.assertEqual(back_fields.get("pin_code"), "110064")


if __name__ == "__main__":
    unittest.main()


