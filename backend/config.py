from __future__ import annotations

from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
SCAN_DIR = DATA_DIR / "scans"
LEDGER_PATH = DATA_DIR / "audit-ledger.json"

MAX_DOCUMENT_BYTES = 12 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def ensure_runtime_directories() -> None:
    """Create local, ignored runtime storage on application start."""
    SCAN_DIR.mkdir(parents=True, exist_ok=True)
