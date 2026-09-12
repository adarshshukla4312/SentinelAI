from __future__ import annotations

from contextlib import asynccontextmanager
from io import BytesIO
import logging
from pathlib import Path
import time
from typing import Annotated
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from PIL import UnidentifiedImageError

from config import ALLOWED_IMAGE_TYPES, MAX_DOCUMENT_BYTES, SCAN_DIR, ensure_runtime_directories
from evidence.pdf_generator import build_evidence_pdf
from logging_config import configure_logging, get_logger, log_event
import numpy as np
from PIL import Image, ImageOps

from pipeline.orchestrator import screen
from pipeline.tier2_ocr import (
    _run_engine,
    extract_viz_fields,
    extract_back_fields,
    get_ocr_engine,
)
from schemas import HealthResponse, ScreeningResponse

logger = get_logger("sentinelai.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_runtime_directories()
    configure_logging()
    log_event(logger, logging.INFO, "SENTINELAI_SERVICE_STARTED", data={"version": "0.1.0"})
    yield
    log_event(logger, logging.INFO, "SENTINELAI_SERVICE_SHUTDOWN")


app = FastAPI(title="SentinelAI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next) -> Response:
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    log_event(
        logger,
        logging.INFO,
        "HTTP_REQUEST",
        data={
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    return response


_screenings: dict[str, ScreeningResponse] = {}


@app.get("/api/v1/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="sentinelai-api", version=app.version)


@app.post("/api/v1/debug-ocr")
async def debug_ocr(
    document: Annotated[UploadFile, File(description="Document image to debug OCR on")],
) -> dict:
    """Debug endpoint: runs raw OCR on uploaded image and returns text blocks + extracted fields."""
    from fastapi.responses import JSONResponse

    content = await document.read()
    from io import BytesIO
    pil_image = ImageOps.exif_transpose(Image.open(BytesIO(content))).convert("RGB")
    if max(pil_image.size) > 1024:
        pil_image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)

    engine, engine_type = get_ocr_engine()
    if engine is None:
        return {"error": "OCR engine unavailable"}

    img_array = np.ascontiguousarray(np.array(pil_image), dtype=np.uint8)
    blocks = _run_engine(engine, engine_type, img_array)

    viz_fields = extract_viz_fields(blocks, pil_image.width, pil_image.height)
    back_fields = extract_back_fields(blocks)

    return {
        "image_size": {"width": pil_image.width, "height": pil_image.height},
        "engine": engine_type,
        "blocks": [
            {
                "text": b.text,
                "y_center": round(b.y_center, 1),
                "x_center": round(b.x_center, 1),
                "height": round(b.height, 1),
                "confidence": round(b.confidence, 3),
            }
            for b in blocks
        ],
        "viz_fields": viz_fields,
        "back_fields": back_fields,
    }


async def _write_upload(document: UploadFile) -> Path:
    ensure_runtime_directories()
    content_type = document.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        filename = getattr(document, "filename", "") or ""
        if filename.lower().endswith((".jpg", ".jpeg")):
            content_type = "image/jpeg"
        elif filename.lower().endswith(".png"):
            content_type = "image/png"
        elif filename.lower().endswith(".webp"):
            content_type = "image/webp"
        else:
            log_event(
                logger,
                logging.WARNING,
                "UNSUPPORTED_MEDIA_TYPE",
                data={"content_type": content_type, "filename": filename},
            )
            raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP document image.")

    suffix = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}.get(content_type, ".jpg")
    destination = SCAN_DIR / f"{uuid4()}-source{suffix}"
    total_bytes = 0
    try:
        with destination.open("wb") as output:
            while chunk := await document.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > MAX_DOCUMENT_BYTES:
                    log_event(
                        logger,
                        logging.WARNING,
                        "PAYLOAD_TOO_LARGE",
                        data={"bytes": total_bytes, "max": MAX_DOCUMENT_BYTES},
                    )
                    raise HTTPException(status_code=413, detail="Document image must be 12 MB or smaller.")
                output.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await document.close()

    if total_bytes == 0:
        destination.unlink(missing_ok=True)
        return None
    return destination


@app.post("/api/v1/screenings", response_model=ScreeningResponse)
async def create_screening(
    document: Annotated[UploadFile, File(description="JPEG, PNG, or WebP document image")],
    document_back: Annotated[UploadFile | None, File(description="Optional back side image (e.g. Aadhaar back)")] = None,
    document_type: Annotated[str, Form(description="Document type ('passport', 'aadhaar', 'auto')")] = "auto",
    live_frame: Annotated[UploadFile | None, File(description="Optional live webcam capture image")] = None,
    mrz: Annotated[str | None, Form(description="Optional two-line TD3 passport MRZ")] = None,
) -> ScreeningResponse:
    log_event(
        logger,
        logging.INFO,
        "SCREENING_REQUEST_RECEIVED",
        data={
            "document_filename": document.filename,
            "document_content_type": document.content_type,
            "has_document_back": document_back is not None and bool(getattr(document_back, "filename", None)),
            "document_type": document_type,
            "has_live_frame": live_frame is not None and bool(getattr(live_frame, "filename", None)),
            "has_mrz": bool(mrz and mrz.strip()),
        },
    )
    source_path = await _write_upload(document)
    if source_path is None:
        raise HTTPException(status_code=422, detail="The front document image is empty.")

    back_path: Path | None = None
    if document_back is not None and getattr(document_back, "filename", None):
        back_path = await _write_upload(document_back)

    live_path: Path | None = None
    if live_frame is not None and getattr(live_frame, "filename", None):
        live_path = await _write_upload(live_frame)

    try:
        result = screen(
            source_path,
            mrz,
            live_frame_path=live_path,
            document_back_path=back_path,
            document_type=document_type,
        )
    except UnidentifiedImageError as error:
        log_event(logger, logging.ERROR, "UNIDENTIFIED_IMAGE", exc_info=True)
        raise HTTPException(status_code=422, detail="The uploaded file is not a readable image.") from error
    except OSError as error:
        log_event(logger, logging.ERROR, "IMAGE_PROCESSING_OS_ERROR", exc_info=True)
        raise HTTPException(status_code=422, detail=f"The image could not be processed: {error}") from error
    except Exception as error:
        log_event(logger, logging.ERROR, "SCREENING_PIPELINE_ERROR", data={"error": str(error)}, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Screening failed: {error}") from error
    finally:
        source_path.unlink(missing_ok=True)
        if back_path is not None:
            back_path.unlink(missing_ok=True)
        if live_path is not None:
            live_path.unlink(missing_ok=True)

    _screenings[result.screening_id] = result
    return result


@app.get("/api/v1/screenings/{screening_id}/heatmap")
def get_heatmap(screening_id: str) -> FileResponse:
    if screening_id not in _screenings:
        raise HTTPException(status_code=404, detail="Screening session not found.")
    heatmap_path = SCAN_DIR / f"{screening_id}-ela.png"
    if not heatmap_path.exists():
        raise HTTPException(status_code=404, detail="Forensic heatmap expired.")
    return FileResponse(heatmap_path, media_type="image/png")


@app.get("/api/v1/screenings/{screening_id}/evidence.pdf")
def get_evidence_pdf(screening_id: str) -> StreamingResponse:
    screening = _screenings.get(screening_id)
    if not screening:
        raise HTTPException(status_code=404, detail="Screening session not found.")
    pdf = build_evidence_pdf(screening)
    return StreamingResponse(
        BytesIO(pdf),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="sentinelai-{screening_id}.pdf"'},
    )
