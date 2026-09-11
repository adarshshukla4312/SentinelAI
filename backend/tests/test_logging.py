from __future__ import annotations

import json
import logging
from pathlib import Path
import tempfile
import unittest

from PIL import Image, ImageDraw

from logging_config import configure_logging
from pipeline.orchestrator import screen


class TestLoggingInfrastructure(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.log_dir = Path(self.temp_dir.name)
        # Clear existing handlers if any so new one points to test dir
        logger = logging.getLogger("sentinelai")
        for handler in list(logger.handlers):
            handler.close()
            logger.removeHandler(handler)
        configure_logging(self.log_dir)

    def tearDown(self) -> None:
        logger = logging.getLogger("sentinelai")
        for handler in list(logger.handlers):
            handler.close()
            logger.removeHandler(handler)
        self.temp_dir.cleanup()

    def _create_sample_doc(self) -> Path:
        doc_path = self.log_dir / "test_doc.jpg"
        img = Image.new("RGB", (600, 400), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.text((50, 50), "PASSPORT SAMPLE", fill=(0, 0, 0))
        img.save(doc_path, format="JPEG")
        return doc_path

    def test_screening_produces_structured_json_logs(self) -> None:
        doc_path = self._create_sample_doc()
        result = screen(doc_path, mrz=None)

        log_file = self.log_dir / "sentinelai.log"
        self.assertTrue(log_file.exists(), "Expected sentinelai.log file to exist")

        lines = log_file.read_text(encoding="utf-8").strip().splitlines()
        self.assertGreater(len(lines), 0, "Log file should not be empty")

        found_screening_complete = False
        parsed_records = []

        for line in lines:
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                self.fail(f"Log line is not valid JSON: {line}")

            self.assertIn("timestamp", record)
            self.assertIn("level", record)
            self.assertIn("logger", record)
            self.assertIn("screening_id", record)
            self.assertIn("message", record)
            self.assertIn("data", record)
            parsed_records.append(record)

            if record.get("message") == "SCREENING_COMPLETE":
                found_screening_complete = True
                data = record.get("data", {})
                self.assertEqual(data.get("screening_id"), result.screening_id)
                self.assertIn("decision", data)
                self.assertIn("risk_score", data)
                self.assertIn("total_duration_ms", data)
                self.assertIn("tier_durations_ms", data)

        self.assertTrue(found_screening_complete, "Expected SCREENING_COMPLETE summary line in logs")


if __name__ == "__main__":
    unittest.main()
