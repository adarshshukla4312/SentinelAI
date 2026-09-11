"""Pre-download and verify all heavy AI neural network weights for SentinelAI.

Ensures that InsightFace ArcFace models (~340MB), RapidOCR ONNX models,
and OpenCV neural QR modules are completely downloaded and cached locally
BEFORE the screening server accepts requests, eliminating first-request latency.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))


def prewarm() -> bool:
    print("=" * 60)
    print("  SentinelAI  --  Pre-Warming Heavy AI Models & Weights")
    print("=" * 60)

    success = True

    # 1. InsightFace ArcFace buffalo_l (~340 MB)
    print("\n[1/3] Checking InsightFace ArcFace models (buffalo_l ~340MB)...")
    home = Path.home()
    buffalo_dir = home / ".insightface" / "models" / "buffalo_l"
    required_weights = ["det_10g.onnx", "w600k_r50.onnx"]

    has_weights = buffalo_dir.exists() and all(
        (buffalo_dir / w).exists() for w in required_weights
    )

    if has_weights:
        total_mb = sum(f.stat().st_size for f in buffalo_dir.glob("*.onnx")) / (1024 * 1024)
        print(f"      Already cached: {buffalo_dir} ({total_mb:.1f} MB across {len(list(buffalo_dir.glob('*.onnx')))} models)")
    else:
        print("      Downloading InsightFace buffalo_l model archive (~340 MB)...")
        print("      (This download happens only once on initial setup)")

    try:
        from insightface.app import FaceAnalysis

        start = time.perf_counter()
        app = FaceAnalysis(
            name="buffalo_l",
            allowed_modules=["detection", "recognition"],
            providers=["CPUExecutionProvider"],
        )
        app.prepare(ctx_id=-1, det_size=(640, 640), det_thresh=0.35)
        elapsed = time.perf_counter() - start
        print(f"      [OK] InsightFace ArcFace initialized successfully in {elapsed:.1f}s.")
    except Exception as exc:
        print(f"      [!] InsightFace initialization warning: {exc}")
        success = False

    # 2. RapidOCR PP-OCRv4 ONNX
    print("\n[2/3] Checking RapidOCR ONNX models...")
    try:
        from rapidocr_onnxruntime import RapidOCR

        start = time.perf_counter()
        ocr = RapidOCR()
        elapsed = time.perf_counter() - start
        print(f"      [OK] RapidOCR PP-OCRv4 initialized successfully in {elapsed:.1f}s.")
    except Exception as exc:
        print(f"      [!] RapidOCR initialization warning: {exc}")
        success = False

    # 3. OpenCV WeChatQRCode Neural Module
    print("\n[3/3] Checking OpenCV WeChatQRCode neural decoder...")
    try:
        import cv2

        if hasattr(cv2, "wechat_qrcode_WeChatQRCode"):
            _ = cv2.wechat_qrcode_WeChatQRCode()
            print("      [OK] WeChatQRCode neural barcode decoder is available.")
        else:
            print("      [!] WeChatQRCode not found in cv2 (opencv-contrib-python required).")
    except Exception as exc:
        print(f"      [!] WeChatQRCode check warning: {exc}")

    print("\n" + "=" * 60)
    if success:
        print("  All heavy AI models & dependencies are cached and ready!")
    else:
        print("  Some models encountered warnings (system will use fallbacks).")
    print("=" * 60 + "\n")

    return success


if __name__ == "__main__":
    ok = prewarm()
    sys.exit(0 if ok else 1)
