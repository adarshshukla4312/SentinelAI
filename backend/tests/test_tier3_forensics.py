from __future__ import annotations

import io
from pathlib import Path
import tempfile
import unittest

import numpy as np
from PIL import Image, ImageDraw

from pipeline.tier3_forensics import _ela, _halftone_indicator, run


class TestTier3Forensics(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.dir_path = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _create_unmodified_jpeg(self) -> Path:
        """Create a smooth synthetic document image saved as high quality JPEG."""
        img = Image.new("RGB", (600, 400), color=(240, 240, 240))
        draw = ImageDraw.Draw(img)
        draw.rectangle([50, 50, 550, 350], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
        draw.text((80, 80), "PASSPORT / PASSEPORT", fill=(0, 0, 0))
        path = self.dir_path / "clean.jpg"
        # Save at 90 quality so recompression difference is minimal
        img.save(path, format="JPEG", quality=90)
        return path

    def _create_tampered_jpeg(self) -> Path:
        """Create an image, save as JPEG, then splice an uncompressed noisy block and re-save."""
        clean_path = self._create_unmodified_jpeg()
        with Image.open(clean_path) as img:
            modified = img.copy()

        draw = ImageDraw.Draw(modified)
        # Splicing a high-contrast patterned block that has entirely different error level
        for x in range(100, 200, 4):
            draw.line([(x, 100), (x, 200)], fill=(255, 0, 0), width=2)

        tampered_path = self.dir_path / "tampered.jpg"
        modified.save(tampered_path, format="JPEG", quality=70)
        return tampered_path

    def test_unmodified_jpeg_ela_difference(self) -> None:
        clean_path = self._create_unmodified_jpeg()
        with Image.open(clean_path) as img:
            _, difference = _ela(img)
        self.assertLess(difference, 0.15)

    def test_tampered_jpeg_elevated_difference(self) -> None:
        clean_path = self._create_unmodified_jpeg()
        tampered_path = self._create_tampered_jpeg()

        with Image.open(clean_path) as img1, Image.open(tampered_path) as img2:
            _, clean_diff = _ela(img1)
            _, tampered_diff = _ela(img2)

        self.assertGreater(tampered_diff, clean_diff)

    def test_fft_halftone_detector_sizes(self) -> None:
        """Verify FFT indicator runs without crashing on various image dimensions."""
        test_sizes = [(320, 200), (512, 512), (1024, 768), (1920, 1080)]
        for width, height in test_sizes:
            img = Image.new("RGB", (width, height), color=(200, 200, 200))
            draw = ImageDraw.Draw(img)
            draw.line([(0, 0), (width, height)], fill=(50, 50, 50), width=3)
            val = _halftone_indicator(img)
            self.assertIsInstance(val, float)
            self.assertGreaterEqual(val, 0.0)
            self.assertLessEqual(val, 1.0)

    def test_run_small_image_returns_review(self) -> None:
        small_path = self.dir_path / "tiny.jpg"
        small_img = Image.new("RGB", (100, 100), color=(255, 255, 255))
        small_img.save(small_path, format="JPEG")

        output = run(small_path)
        self.assertEqual(output.result.tier, 3)
        self.assertEqual(output.result.status, "review")
        self.assertIn("too small", output.result.summary)

    def test_run_valid_image(self) -> None:
        clean_path = self._create_unmodified_jpeg()
        output = run(clean_path)
        self.assertEqual(output.result.tier, 3)
        self.assertIn(output.result.status, ["pass", "review"])
        self.assertIsNotNone(output.heatmap)
        self.assertEqual(output.heatmap.size, (1200, 750))


if __name__ == "__main__":
    unittest.main()
