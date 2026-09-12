from __future__ import annotations

from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch

import numpy as np
from PIL import Image

from pipeline import tier4_biometrics
from pipeline.tier4_biometrics import (
    _crop_face_for_fas,
    check_liveness,
    get_anti_spoof_models,
    run,
)


class DummyFace:
    """Mock InsightFace detection output with normalized embedding."""

    def __init__(self, embedding: np.ndarray, bbox: list[float] | None = None) -> None:
        norm = float(np.linalg.norm(embedding))
        self.normed_embedding = embedding / norm if norm > 0 else embedding
        self.bbox = bbox if bbox is not None else [50.0, 50.0, 150.0, 150.0]


class TestTier4Biometrics(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.dir_path = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _create_blank_image(self, filename: str = "blank.jpg") -> Path:
        path = self.dir_path / filename
        img = Image.new("RGB", (320, 320), color=(240, 240, 240))
        img.save(path, format="JPEG")
        return path

    def test_live_frame_none_returns_unavailable(self) -> None:
        """When live_frame is None, tier 4 must report unavailable."""
        doc_path = self._create_blank_image("doc.jpg")
        result = run(document_image=doc_path, live_frame=None)

        self.assertEqual(result.tier, 4)
        self.assertEqual(result.status, "unavailable")
        self.assertIn("Live webcam capture and vetted ArcFace/MiniFASNet weights are required", result.summary)
        self.assertEqual(result.details.get("face_match"), "not run")
        self.assertEqual(result.details.get("liveness"), "not run")
        self.assertEqual(result.details.get("privacy"), "No biometric template was stored.")

    def test_no_arguments_returns_unavailable(self) -> None:
        """Calling run() without arguments must safely return unavailable."""
        result = run()
        self.assertEqual(result.tier, 4)
        self.assertEqual(result.status, "unavailable")

    def test_missing_document_image_with_live_frame_returns_review(self) -> None:
        """When live_frame is provided but document is missing, return review."""
        live_path = self._create_blank_image("live.jpg")
        result = run(document_image=None, live_frame=live_path)
        self.assertEqual(result.tier, 4)
        self.assertEqual(result.status, "review")
        self.assertFalse(result.details.get("face_match"))

    def test_synthetic_images_no_faces_detected(self) -> None:
        """Synthetic blank images have no faces, returning review with proper explanation."""
        doc_path = self._create_blank_image("doc.jpg")
        live_path = self._create_blank_image("live.jpg")

        result = run(document_image=doc_path, live_frame=live_path)
        self.assertEqual(result.tier, 4)
        self.assertEqual(result.status, "review")
        self.assertIsNone(result.score)
        self.assertIn("No face detected", result.summary)
        self.assertFalse(result.details.get("face_match"))

    def test_privacy_enforcement_never_stores_embeddings(self) -> None:
        """Verify that biometric embeddings are never stored in the TierResult details."""
        doc_path = self._create_blank_image("doc.jpg")
        live_path = self._create_blank_image("live.jpg")

        result = run(document_image=doc_path, live_frame=live_path)

        for key, value in result.details.items():
            self.assertNotIn("embedding", key.lower())
            self.assertNotIn("vector", key.lower())
            self.assertNotIsInstance(value, (np.ndarray, list))

        self.assertIn("privacy", result.details)

    def test_face_match_and_live_person_passes(self) -> None:
        """When faces match (>= 0.39) under attended kiosk mode, status is pass."""
        np.random.seed(42)
        base_vector = np.random.randn(512).astype(np.float32)
        similar_vector = base_vector + np.random.randn(512).astype(np.float32) * 0.05

        doc_face = DummyFace(base_vector)
        live_face = DummyFace(similar_vector)

        mock_app = MagicMock()
        mock_app.get.side_effect = [[doc_face], [live_face]]

        with patch("pipeline.tier4_biometrics.get_face_app", return_value=mock_app):
            doc_img = Image.new("RGB", (200, 200), color="white")
            live_img = Image.new("RGB", (200, 200), color="white")
            result = run(document_image=doc_img, live_frame=live_img)

        self.assertEqual(result.status, "pass")
        self.assertIsNotNone(result.score)
        self.assertGreaterEqual(result.score, 0.39)
        self.assertTrue(result.details.get("face_match"))
        self.assertEqual(result.details.get("liveness"), "attended")
        self.assertNotIn("embedding", result.details)

    def test_attended_kiosk_face_match_passes_without_spoof_rejection(self) -> None:
        """Under attended kiosk mode, face match is verified without automated spoof rejection."""
        base_vector = np.random.randn(512).astype(np.float32)
        doc_face = DummyFace(base_vector)
        live_face = DummyFace(base_vector)

        mock_app = MagicMock()
        mock_app.get.side_effect = [[doc_face], [live_face]]

        with patch("pipeline.tier4_biometrics.get_face_app", return_value=mock_app):
            doc_img = Image.new("RGB", (200, 200), color="white")
            live_img = Image.new("RGB", (200, 200), color="white")
            result = run(document_image=doc_img, live_frame=live_img)

        self.assertEqual(result.status, "pass")
        self.assertTrue(result.details.get("face_match"))
        self.assertEqual(result.details.get("liveness"), "attended")

    def test_face_mismatch_fails(self) -> None:
        """When face similarity is below 0.39, status is fail with mismatch reason."""
        vec1 = np.zeros(512, dtype=np.float32)
        vec1[0] = 1.0
        vec2 = np.zeros(512, dtype=np.float32)
        vec2[1] = 1.0

        doc_face = DummyFace(vec1)
        live_face = DummyFace(vec2)

        mock_app = MagicMock()
        mock_app.get.side_effect = [[doc_face], [live_face]]

        with patch("pipeline.tier4_biometrics.get_face_app", return_value=mock_app), \
             patch("pipeline.tier4_biometrics.check_liveness", return_value=(0.85, "real")):
            doc_img = Image.new("RGB", (200, 200), color="white")
            live_img = Image.new("RGB", (200, 200), color="white")
            result = run(document_image=doc_img, live_frame=live_img)

        self.assertEqual(result.status, "fail")
        self.assertFalse(result.details.get("face_match"))
        self.assertEqual(result.details.get("reason"), "Face does not match document")

    def test_graceful_fallback_when_dependencies_fail(self) -> None:
        """If InsightFace throws an exception, run() returns unavailable without crashing."""
        with patch("pipeline.tier4_biometrics.get_face_app", side_effect=RuntimeError("CUDA error")):
            doc_img = Image.new("RGB", (200, 200), color="white")
            live_img = Image.new("RGB", (200, 200), color="white")
            result = run(document_image=doc_img, live_frame=live_img)

        self.assertEqual(result.status, "unavailable")
        self.assertIn("Live webcam capture and vetted ArcFace/MiniFASNet weights", result.summary)

    def test_crop_face_for_fas_dimensions(self) -> None:
        """Ensure face cropper returns requested dimensions."""
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        bbox = [100, 100, 80, 80]
        patch = _crop_face_for_fas(img, bbox, 2.7, 80, 80)
        self.assertEqual(patch.shape, (80, 80, 3))

    def test_minifasnet_models_available_and_callable(self) -> None:
        """Verify that MiniFASNet models load properly from resources if PyTorch is present."""
        models = get_anti_spoof_models()
        if models is None:
            self.skipTest("MiniFASNet models or PyTorch optional dependency not available.")
        self.assertGreaterEqual(len(models), 1)


if __name__ == "__main__":
    unittest.main()
