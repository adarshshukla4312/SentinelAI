from __future__ import annotations

from dataclasses import dataclass
import io
import logging
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageEnhance, ImageOps

from logging_config import get_logger, log_event
from schemas import TierResult

logger = get_logger("sentinelai.pipeline.tier3", tier=3)


@dataclass(frozen=True)
class ForensicsOutput:
    result: TierResult
    heatmap: Image.Image


def _ela(image: Image.Image) -> tuple[Image.Image, float]:
    """Return an amplified ELA image and its mean normalized difference."""
    original = image.convert("RGB")

    buffer = io.BytesIO()
    original.save(buffer, format="JPEG", quality=90)
    buffer.seek(0)
    recompressed = Image.open(buffer).convert("RGB")
    difference = ImageChops.difference(original, recompressed)
    mean_difference = float(np.asarray(difference, dtype=np.float32).mean() / 255.0)

    extrema = difference.getextrema()
    max_difference = max(channel_max for _, channel_max in extrema)
    scale = 255 / max_difference if max_difference else 1
    amplified = ImageEnhance.Brightness(difference).enhance(scale)
    return amplified, mean_difference


def _halftone_indicator(image: Image.Image) -> float:
    """Estimate repetitive high-frequency energy for the initial FFT heuristic."""
    gray = np.asarray(image.convert("L").resize((512, 512)), dtype=np.float32) / 255.0
    spectrum = np.abs(np.fft.fftshift(np.fft.fft2(gray - gray.mean())))
    log_spectrum = np.log1p(spectrum)
    height, width = log_spectrum.shape
    center_y, center_x = height // 2, width // 2
    log_spectrum[center_y - 12 : center_y + 13, center_x - 12 : center_x + 13] = 0
    baseline = float(log_spectrum.mean()) + 1e-6
    peak_ratio = float(np.percentile(log_spectrum, 99.7) / baseline)
    return float(np.clip((peak_ratio - 4.0) / 14.0, 0.0, 1.0))


def _heatmap(ela_image: Image.Image) -> Image.Image:
    """Prepare a portable, privacy-conscious grayscale evidence artifact."""
    return ImageOps.autocontrast(ela_image.convert("L")).resize((1200, 750))


def run(document_path: Path) -> ForensicsOutput:
    log_event(logger, logging.DEBUG, "TIER3_STARTED", data={"document": document_path.name})
    try:
        with Image.open(document_path) as source:
            source.load()
            if source.width < 320 or source.height < 200:
                log_event(
                    logger,
                    logging.WARNING,
                    "TIER3_IMAGE_TOO_SMALL",
                    data={"width": source.width, "height": source.height},
                )
                result = TierResult(
                    tier=3,
                    title="Passive forensics",
                    status="review",
                    score=None,
                    summary="Image is too small for reliable ELA or FFT analysis.",
                    details={"width": source.width, "height": source.height},
                )
                return ForensicsOutput(result=result, heatmap=source.convert("L"))

            ela_image, ela_difference = _ela(source)
            halftone_indicator = _halftone_indicator(source)

        suspicion = float(np.clip((ela_difference * 24) + (halftone_indicator * 0.38), 0.0, 1.0))
        elevated = suspicion >= 0.55

        log_event(
            logger,
            logging.INFO,
            "TIER3_ANALYSIS_COMPLETE",
            data={
                "ela_mean_difference": round(ela_difference, 5),
                "fft_repetition_indicator": round(halftone_indicator, 4),
                "suspicion_score": round(suspicion, 4),
                "elevated": elevated,
            },
        )

        result = TierResult(
            tier=3,
            title="Passive forensics",
            status="review" if elevated else "pass",
            score=round(suspicion, 4),
            summary=(
                "Elevated base-forensics signals need officer review."
                if elevated
                else "No elevated signals were found by the available ELA and FFT heuristics."
            ),
            details={
                "ela_mean_difference": round(ela_difference, 5),
                "fft_repetition_indicator": round(halftone_indicator, 4),
                "doctamper": "model weights not configured",
                "method_note": "ELA and FFT are screening heuristics, not a trained forgery verdict.",
            },
        )
        return ForensicsOutput(result=result, heatmap=_heatmap(ela_image))
    except Exception as error:
        log_event(logger, logging.ERROR, "TIER3_FAILED", data={"error": str(error)}, exc_info=True)
        fallback_result = TierResult(
            tier=3,
            title="Passive forensics",
            status="review",
            score=None,
            summary=f"Forensic analysis encountered an error: {error}",
            details={"error": str(error)},
        )
        blank = Image.new("L", (1200, 750), color=128)
        return ForensicsOutput(result=fallback_result, heatmap=blank)
