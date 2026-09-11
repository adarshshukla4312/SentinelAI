from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from PIL import UnidentifiedImageError

from config import ALLOWED_IMAGE_TYPES, MAX_DOCUMENT_BYTES, SCAN_DIR, ensure_runtime_directories
from evidence.pdf_generator import build_evidence_pdf
from pipeline.orchestrator import screen
from schemas import HealthResponse, ScreeningResponse


app = FastAPI(title="SentinelAI API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_screenings: dict[str, ScreeningResponse] = {}


@app.on_event("startup")
def startup() -> None:
    ensure_runtime_directories()


@app.get("/api/v1/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="sentinelai-api", version=app.version)


async def _write_upload(document: UploadFile) -> Path:
    # Keep this defensive call so ASGI test clients and one-off scripts work even
    # when they do not execute the application lifespan hook.
    ensure_runtime_directories()
    if document.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP document image.")

    suffix = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[document.content_type]
    destination = SCAN_DIR / f"{uuid4()}-source{suffix}"
    total_bytes = 0
    try:
        with destination.open("wb") as output:
            while chunk := await document.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > MAX_DOCUMENT_BYTES:
                    raise HTTPException(status_code=413, detail="Document image must be 12 MB or smaller.")
                output.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await document.close()
    return destination


@app.post("/api/v1/screenings", response_model=ScreeningResponse)
async def create_screening(
    document: Annotated[UploadFile, File(description="JPEG, PNG, or WebP document image")],
    mrz: Annotated[str | None, Form(description="Optional two-line TD3 passport MRZ")] = None,
) -> ScreeningResponse:
    source_path = await _write_upload(document)
    try:
        result = screen(source_path, mrz)
    except UnidentifiedImageError as error:
        raise HTTPException(status_code=422, detail="The uploaded file is not a readable image.") from error
    except OSError as error:
        raise HTTPException(status_code=422, detail=f"The image could not be processed: {error}") from error
    finally:
        # Source documents are processed in-memory/on disk only for the request.
        # The demo retains the derived heatmap for the forensic slider.
        source_path.unlink(missing_ok=True)
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
