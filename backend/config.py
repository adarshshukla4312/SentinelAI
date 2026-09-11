from __future__ import annotations

import os
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
SCAN_DIR = DATA_DIR / "scans"
LOG_DIR = DATA_DIR / "logs"
LEDGER_PATH = DATA_DIR / "audit-ledger.json"
DEPLOYED_CONTRACT_PATH = ROOT_DIR / "blockchain" / "deployed.json"

MAX_DOCUMENT_BYTES = 12 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Optional runtime integrations. The app keeps screening offline-first when these
# are absent; credentials must never be committed to the repository.
PADDLE_DEVICE = os.getenv("PADDLE_DEVICE", "gpu:0")
POLYGON_RPC_URL = os.getenv("POLYGON_RPC_URL", "https://rpc-amoy.polygon.technology")
POLYGON_PRIVATE_KEY = os.getenv("POLYGON_PRIVATE_KEY")
POLYGON_CONTRACT_ADDRESS = os.getenv("POLYGON_CONTRACT_ADDRESS")
POLYGON_REQUEST_TIMEOUT_SECONDS = int(os.getenv("POLYGON_REQUEST_TIMEOUT_SECONDS", "90"))
MINIFASNET_MODEL_PATHS = tuple(
    Path(value.strip())
    for value in os.getenv("MINIFASNET_MODEL_PATHS", "").split(",")
    if value.strip()
)


def ensure_runtime_directories() -> None:
    """Create local, ignored runtime storage on application start."""
    SCAN_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
