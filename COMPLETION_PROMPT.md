# SentinelAI — End-to-End Completion Prompt

> **Purpose:** This document is a single, self-contained instruction set to take the current SentinelAI vertical slice from "demo skeleton" to "fully operational end-to-end system." Hand this to a developer or AI agent.

> **Implementation-status convention (2026-09-11):** Each major part below now has an update remark. `Complete` means the named capability is usable in the current vertical slice; `Partial` means its safe foundation exists but its production integration is pending; `Pending` means the requested work has not yet been added. These remarks take precedence over any wording that describes the capability as already present.

---

## Pre-Read (Mandatory Context)

> **Update — Complete:** The baseline plan, API, pipeline coordinator, schemas, configuration, Command Center, TypeScript contracts, and API proxy were reviewed before this status pass. The app currently provides document upload, deterministic MRZ validation when MRZ text is supplied, ELA/FFT evidence generation, fusion, a SHA-256 hash chain, PDF receipts, and the corresponding UI. Model-backed OCR, biometrics, and on-chain anchoring remain deliberately unconfigured.

Before starting any work, read these files completely to understand the existing architecture, decisions, and conventions:

1. `c:\Projects\SIH 2025\plan.md` — Single source of truth for all project decisions
2. `c:\Projects\SIH 2025\backend\main.py` — FastAPI app, routes, session management
3. `c:\Projects\SIH 2025\backend\pipeline\orchestrator.py` — Central coordinator
4. `c:\Projects\SIH 2025\backend\schemas.py` — Pydantic data models
5. `c:\Projects\SIH 2025\backend\config.py` — Paths and upload limits
6. `c:\Projects\SIH 2025\frontend\app\page.tsx` — Main UI orchestrator
7. `c:\Projects\SIH 2025\frontend\app\types.ts` — TypeScript type contracts
8. `c:\Projects\SIH 2025\frontend\next.config.mjs` — API proxy rewrites

---

## PART 1 — Structured Logging Infrastructure

> **Update — Pending:** Structured JSON-line logging, context variables, timed tier logs, request middleware, and the `SCREENING_COMPLETE` summary have not been added yet. The current API intentionally has no `logging_config.py`; this part remains the next observability milestone.

> **Goal:** Every pipeline run must produce a detailed, machine-parseable log file so that failures can be pinpointed to the exact tier, exact line, and exact input that caused them.

### 1.1 Create `backend/logging_config.py`

Build a logging configuration module that sets up:

- **Two log outputs simultaneously:**
  - **Console** (stdout): Compact single-line format for development. Level: `INFO`.
  - **File** (rotating): Detailed JSON-lines format for forensic debugging. Level: `DEBUG`.

- **Log file location:** `backend/data/logs/` directory (auto-created on startup).

- **File rotation:** Use `logging.handlers.RotatingFileHandler`:
  - Max file size: 10 MB per file
  - Backup count: 5 files (keeps last 50 MB of logs)
  - Filename pattern: `sentinelai.log` (rotates to `sentinelai.log.1`, `.2`, etc.)

- **JSON-lines format** for the file handler. Each log line must be a valid JSON object with these fields:
  ```json
  {
    "timestamp": "2026-09-11T14:39:02.123456+05:30",
    "level": "INFO",
    "logger": "pipeline.tier3_forensics",
    "screening_id": "908d1e4c-...",
    "tier": 3,
    "message": "ELA analysis complete",
    "data": { "ela_mean_difference": 0.00412, "duration_ms": 23.4 },
    "exception": null
  }
  ```

- **Key fields explanation:**
  - `screening_id`: Passed via a custom `logging.LoggerAdapter` or `contextvars.ContextVar` so that every log line within a screening run is automatically tagged with the screening ID without manually passing it everywhere.
  - `tier`: Which pipeline tier produced this log (1-5, or `null` for orchestrator/system logs).
  - `data`: Arbitrary dict of structured data (scores, file sizes, model outputs, timing).
  - `exception`: Full traceback string if an exception occurred, `null` otherwise.

- **Create named loggers** for each module:
  - `sentinelai.pipeline.orchestrator`
  - `sentinelai.pipeline.tier1`
  - `sentinelai.pipeline.tier2`
  - `sentinelai.pipeline.tier3`
  - `sentinelai.pipeline.tier4`
  - `sentinelai.pipeline.tier5`
  - `sentinelai.blockchain`
  - `sentinelai.evidence`
  - `sentinelai.api`

### 1.2 Per-Screening Log Context

Use Python's `contextvars` module to create a `screening_context` variable:

```python
import contextvars
screening_id_var: contextvars.ContextVar[str] = contextvars.ContextVar('screening_id', default='no-session')
```

Set this at the start of each screening in `orchestrator.py`. All child loggers automatically include it in their JSON output via a custom `logging.Filter` that reads from the context var.

### 1.3 Timing Decorator

Create a `@timed` decorator (or context manager) that:
- Logs the start of each tier with `DEBUG` level
- Logs the completion with `INFO` level, including `duration_ms`
- Logs any exception with `ERROR` level, including the full traceback
- Example output:
  ```
  DEBUG | tier3 | Starting passive forensics for screening 908d1e4c
  INFO  | tier3 | Passive forensics complete | 34.2ms | score=0.12
  ERROR | tier2 | PaddleOCR inference failed | 1203ms | RuntimeError: CUDA out of memory
  ```

### 1.4 Wire Logging Into Every Module

Go through every existing `.py` file in `backend/pipeline/`, `backend/blockchain/`, `backend/evidence/`, and `backend/main.py`:
- Replace all `print()` statements with appropriate `logger.info()` / `logger.debug()` / `logger.error()` calls
- Add `logger.debug()` at entry and exit of every public function with relevant parameters
- Add `logger.error(..., exc_info=True)` in every `except` block
- Log the incoming request metadata in `main.py` (file name, size, MIME type, whether MRZ was provided)

### 1.5 Request-Level Summary Log

At the end of each screening in the orchestrator, emit a single `INFO` summary line:
```json
{
  "message": "SCREENING_COMPLETE",
  "screening_id": "908d1e4c",
  "decision": "REVIEW",
  "risk_score": 76,
  "tier_statuses": ["unavailable", "unavailable", "pass", "unavailable", "review"],
  "total_duration_ms": 847.3,
  "tier_durations_ms": [0.1, 0.2, 34.2, 0.1, 2.3]
}
```
This lets you `grep SCREENING_COMPLETE sentinelai.log` to instantly see every run's outcome.

---

## PART 2 — Complete Tier 2: OCR + Schema Validation

> **Update — Partial:** `backend/pipeline/tier2_ocr.py` contains the safe PaddleOCR adapter boundary: it detects whether PaddleOCR is installed and, when it is absent, returns `unavailable` rather than crashing. Tier 1 fully validates a user-supplied TD3 MRZ. Automatic OCR inference, MRZ extraction, VIZ field extraction, cross-validation, and OCR-to-Tier-1 feedback are still pending.

> **Goal:** Automatically read text from passport/Aadhaar images and cross-validate fields.

### 2.1 Install PaddleOCR

```bash
pip install paddleocr paddlepaddle  # Use paddlepaddle-gpu if CUDA available
```

Note: PaddleOCR auto-downloads pre-trained weights (~15MB) on first run. No manual download needed.

### 2.2 Rewrite `backend/pipeline/tier2_ocr.py`

The current file is a stub that only checks if PaddleOCR is importable. Replace it with a full implementation:

**Input:** PIL Image object + optional MRZ string from Tier 1
**Output:** `TierResult` with extracted fields and cross-validation results

**Implementation steps:**
1. Initialize PaddleOCR once at module level (not per-request): `PaddleOCR(use_angle_cls=True, lang='en', use_gpu=True)`
2. Run OCR on the image: `ocr.ocr(numpy_array_of_image)`
3. Collect all detected text boxes and their bounding box coordinates
4. **MRZ extraction:** Look for text blocks matching the regex pattern `^[A-Z0-9<]{44}$` — these are MRZ lines. If two such lines are found at the bottom of the image (by y-coordinate), extract them as the MRZ.
5. **If MRZ was not provided by the user AND OCR found MRZ lines:** Feed the extracted MRZ back to Tier 1's `validate_td3()` function and include the result in Tier 2's output.
6. **VIZ field extraction:** Use regex patterns on the OCR output to extract:
   - Name (typically the largest text block near the top)
   - Date of birth (pattern: `DD MMM YYYY` or `DD/MM/YYYY`)
   - Passport number (pattern: country-specific, e.g., `[A-Z][0-9]{7}` for India)
   - Expiry date
   - Nationality
7. **Cross-validation** (if both MRZ and VIZ fields are available):
   - Compare passport number: MRZ vs. VIZ
   - Compare DOB: MRZ vs. VIZ
   - Compare name: MRZ vs. VIZ (account for `<` separators in MRZ = spaces in VIZ)
   - Log mismatches with `logger.warning()`
8. **Scoring:**
   - All fields match: `score=1.0, status="pass"`
   - Some fields missing but no contradictions: `score=0.7, status="review"`
   - Any field mismatch: `score=0.3, status="fail"` with specific mismatch details
   - OCR completely failed: `score=None, status="review"`

**Important:** If PaddleOCR is not installed, the existing graceful fallback (`status="unavailable"`) must still work. Wrap the import in a `try/except`.

### 2.3 Update Orchestrator

In `orchestrator.py`, if Tier 2 successfully extracts MRZ from the image and the user didn't provide MRZ manually:
- Re-run Tier 1 with the OCR-extracted MRZ
- Update the Tier 1 result in the response
- Log this as: `"MRZ auto-extracted by OCR and fed to Tier 1 for validation"`

---

## PART 3 — Complete Tier 4: Face Biometrics

> **Update — Partial:** The Command Center includes the Tier 4 presentation panel and the backend returns an explicit privacy-preserving `unavailable` result when no configured biometric runtime exists. It does not accept a `live_frame` yet, does not request webcam permission, and does not load ArcFace or MiniFASNet weights. Face matching, liveness detection, and the match-and-discard implementation remain pending.

> **Goal:** 1:1 face matching between document photo and live webcam frame, plus liveness detection.

### 3.1 Install Dependencies

```bash
pip install insightface onnxruntime-gpu  # or onnxruntime for CPU
git clone https://github.com/minivision-ai/Silent-Face-Anti-Spoofing.git backend/vendor/silent_fas
```

InsightFace auto-downloads the `buffalo_l` model pack (~350MB) on first use.

### 3.2 Rewrite `backend/pipeline/tier4_biometrics.py`

**Inputs:**
- Document image (PIL Image) — extract face from the document photo
- Live frame (PIL Image) — face captured from webcam, sent as a second file

**Implementation steps:**

1. **Initialize InsightFace once at module level:**
   ```python
   from insightface.app import FaceAnalysis
   face_app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
   face_app.prepare(ctx_id=0, det_size=(640, 640))
   ```

2. **Extract face from document image:**
   - Run `face_app.get(document_numpy)` — returns list of detected faces
   - If no face found — `status="review"`, summary: "No face detected in document image"
   - If multiple faces — use the largest (by bounding box area)
   - Extract `normed_embedding` (512-dim vector)

3. **Extract face from live webcam frame:**
   - Run `face_app.get(live_frame_numpy)` — same process
   - If no face found — `status="review"`, summary: "No face detected in live frame"

4. **1:1 Face Matching:**
   - Compute cosine similarity: `similarity = doc_embedding @ live_embedding`
   - Threshold: `>= 0.45` — match (InsightFace's recommended threshold for `buffalo_l`)
   - Log the similarity score at `DEBUG` level

5. **Liveness Detection (MiniFASNet):**
   - Load the ONNX models from `backend/vendor/silent_fas/resources/anti_spoof_models/`
   - Run inference on the live webcam frame
   - Output: probability of "real" vs. "spoof"
   - Threshold: `real_prob >= 0.7` — live person

6. **Combined Scoring:**
   - Face match + live person: `score = similarity_value, status = "pass"`
   - Face match + spoof detected: `score = 0.3, status = "fail"`, reason: "Presentation attack detected"
   - Face mismatch: `score = similarity_value, status = "fail"`, reason: "Face does not match document"
   - No face in either image: `status = "review"`

7. **Privacy enforcement:**
   - After computing similarity, **discard both embeddings immediately** — do not store, do not log, do not include in the audit receipt
   - Log only: `"face_match": true/false, "similarity": 0.72, "liveness": "real"` (no raw embeddings)

**Important:** If `insightface` is not installed, the existing graceful fallback must still work.

### 3.3 Update Screening Endpoint for Live Frame

Modify the existing `POST /api/v1/screenings` endpoint in `main.py` to accept an **optional second file**:
- `document` (File, required): The identity document image
- `live_frame` (File, optional): A webcam capture of the person holding the document
- `mrz` (Form field, optional): MRZ text

If `live_frame` is provided — Tier 4 runs face matching + liveness.
If `live_frame` is not provided — Tier 4 returns `status="unavailable"` (current behavior).

Pass the live frame image through to the orchestrator, which passes it to `tier4_biometrics.py`.

### 3.4 Add Webcam Capture to Frontend

In `frontend/app/components/FaceMatch.tsx`:

1. Add a "Capture from webcam" button that:
   - Calls `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })`
   - Renders the live video stream in the "Live camera" panel
   - Has a "Take photo" button that captures a single frame to a `canvas` element
   - Converts the canvas to a `Blob` (JPEG, quality 0.92)

2. Store the captured `Blob` in the parent component's state (`page.tsx`) via a callback prop

3. In `page.tsx` runScreening():
   - If a live frame blob exists, append it to `FormData` as `live_frame`
   - Otherwise, send without it (Tier 4 gracefully returns "unavailable")

4. After a screening result is received, display:
   - The captured selfie in the "Live camera" panel
   - The similarity score between document and live face
   - A green check or red X for liveness detection

---

## PART 4 — Wire Polygon Blockchain Anchoring

> **Update — Partial:** The offline audit foundation is complete: every screening creates a canonical SHA-256 receipt, links it to the previous receipt hash, verifies the local chain, and exposes the result in the UI and PDF. `contract.sol` is also present. The Polygon adapter safely reports `pending_configuration`; no contract has been deployed and no wallet, RPC configuration, transaction signing, batching, or Polygonscan link has been added.

> **Goal:** Actually write audit hashes to the Polygon Amoy testnet.

### 4.1 Install Web3

```bash
pip install web3
```

### 4.2 Deploy the Smart Contract

The contract already exists at `backend/blockchain/contract.sol`. Deploy it:

1. Install Hardhat: `npm install -g hardhat`
2. Create a minimal Hardhat project in `backend/blockchain/hardhat/`
3. Copy `contract.sol` into `contracts/`
4. Create a deploy script that:
   - Connects to Polygon Amoy testnet RPC (`https://rpc-amoy.polygon.technology`)
   - Uses a deployer wallet private key (from environment variable `POLYGON_PRIVATE_KEY`)
   - Deploys `SentinelAuditAnchor`
   - Prints the deployed contract address
5. Save the deployed contract address and ABI to `backend/blockchain/deployed.json`

### 4.3 Rewrite `backend/blockchain/polygon.py`

Replace the stub with a real implementation:

1. **Configuration** (via environment variables, NOT hardcoded):
   - `POLYGON_RPC_URL` — default: `https://rpc-amoy.polygon.technology`
   - `POLYGON_PRIVATE_KEY` — wallet private key (for signing transactions)
   - `POLYGON_CONTRACT_ADDRESS` — deployed contract address
   - If any of these are missing — return the existing `pending_configuration` response (graceful fallback)

2. **Implementation:**
   ```python
   from web3 import Web3

   w3 = Web3(Web3.HTTPProvider(rpc_url))
   contract = w3.eth.contract(address=contract_address, abi=abi)

   def anchor_hash(chain_hash: str) -> dict:
       tx = contract.functions.storeAuditHash(
           bytes.fromhex(chain_hash),
           int(time.time())
       ).build_transaction({
           'from': account.address,
           'nonce': w3.eth.get_transaction_count(account.address),
           'gas': 100000,
           'gasPrice': w3.eth.gas_price,
       })
       signed = account.sign_transaction(tx)
       tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
       return {
           'status': 'anchored',
           'transaction_hash': tx_hash.hex(),
           'network': 'Polygon Amoy testnet',
           'explorer_url': f'https://amoy.polygonscan.com/tx/{tx_hash.hex()}'
       }
   ```

3. **Error handling:** If the RPC call fails (network down, insufficient gas), log the error and return `status: "anchor_failed"` with the error message. The screening result is still valid — blockchain is supplementary.

4. **Batching (optional optimization):** Instead of anchoring every single screening, accumulate hashes and anchor every 10 screenings or every 60 seconds (whichever comes first). This reduces transaction count.

### 4.4 Update Frontend BlockchainBadge

When `polygon.status === "anchored"`:
- Display the transaction hash (shortened)
- Make it a clickable link to `https://amoy.polygonscan.com/tx/{hash}`
- Show a green "Anchored on-chain" badge

---

## PART 5 — Error Handling & Resilience Fixes

> **Update — Partial:** The existing vertical slice already enforces image MIME/size limits, converts unreadable images into 422 responses, protects temporary source cleanup, and shows request errors in the UI. The specific resilience work in 5.1–5.4 is still pending: non-JSON response parsing, drag-and-drop, FastAPI lifespan migration, and request logging middleware have not yet been implemented.

### 5.1 Frontend: Fix `response.json()` crash

In `page.tsx`, change `runScreening()`:

```typescript
// CURRENT (fragile):
const body = await response.json();
if (!response.ok) throw new Error(body.detail ?? "...");

// FIXED (resilient):
let body: any;
try {
  body = await response.json();
} catch {
  throw new Error(`Server returned status ${response.status}. The backend may be down.`);
}
if (!response.ok) throw new Error(body.detail ?? "The screening service could not process this document.");
```

### 5.2 Frontend: Add Drag-and-Drop

In `page.tsx`, add `onDragOver` and `onDrop` handlers to the `.dropzone` div:

```typescript
const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const file = e.dataTransfer.files[0];
  if (file) selectDocument(file);
};
```

### 5.3 Backend: Deprecation Fix

In `main.py`, replace the deprecated `@app.on_event("startup")` with the modern lifespan pattern:

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_runtime_directories()
    yield

app = FastAPI(..., lifespan=lifespan)
```

### 5.4 Backend: Add Request Logging Middleware

Add a simple middleware in `main.py` that logs every incoming request:

```python
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = (time.perf_counter() - start) * 1000
    logger.info("request", data={
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "duration_ms": round(duration, 1)
    })
    return response
```

---

## PART 6 — Testing & Verification

> **Update — Partial:** Unit coverage currently verifies ICAO TD3 check digits and SHA-256 audit-chain linking. The initial vertical slice was also smoke-tested with a synthetic image: screening response, generated heatmap, PDF receipt, frontend type-check, production build, and browser rendering all succeeded. The Tier 2/3/4/logging test files and the full manual end-to-end checklist remain pending because their model-backed integrations are not complete.

### 6.1 Backend Unit Tests to Add

Create the following test files:

**`tests/test_tier2_ocr.py`:**
- Test that a real passport image returns extracted MRZ lines
- Test that a non-document image (e.g., a photo of a cat) returns `review` status
- Test that the cross-validation catches a mismatched passport number

**`tests/test_tier3_forensics.py`:**
- Test that an unmodified JPEG returns low ELA score (< 0.3)
- Test that a deliberately edited JPEG (splice a region in PIL, re-save) returns elevated ELA score
- Test that the FFT halftone detector runs without crashing on various image sizes

**`tests/test_tier4_biometrics.py`:**
- Test that two photos of the same person return similarity > 0.45
- Test that two photos of different people return similarity < 0.45
- Test that the liveness detector rejects a photo of a photo (if MiniFASNet is available)

**`tests/test_logging.py`:**
- Test that a screening run produces a log file in `data/logs/`
- Test that the log file contains valid JSON lines
- Test that each log line contains `screening_id`, `timestamp`, and `level`
- Test that `SCREENING_COMPLETE` summary line is present after a run

### 6.2 End-to-End Verification Checklist

After all changes, verify the following manually:

```
[ ] Backend starts without errors: python -m uvicorn main:app --port 8000
[ ] Frontend starts without errors: npm run dev (in frontend/)
[ ] Open http://localhost:3000 — UI loads with all components
[ ] Upload a passport image — Tier 3 produces a heatmap
[ ] Paste valid ICAO MRZ — Tier 1 shows "Verified"
[ ] Paste tampered MRZ — Tier 1 shows "Failed", decision becomes "HARD REJECT"
[ ] Upload without MRZ — Tier 2 auto-extracts MRZ from image (if PaddleOCR installed)
[ ] Click webcam capture — live video appears in FaceMatch panel
[ ] Take photo + run screening — Tier 4 shows face match score
[ ] Hold up a printed photo to webcam — Tier 4 detects spoof
[ ] Download PDF receipt — opens valid PDF with hash chain details
[ ] Check data/logs/sentinelai.log — contains JSON lines with screening_id
[ ] grep SCREENING_COMPLETE sentinelai.log — shows summary of each run
[ ] BlockchainBadge shows transaction hash (if Polygon configured)
[ ] Run: python -m unittest discover tests — all tests pass
[ ] Run: npm run build (in frontend/) — production build succeeds
```

---

## PART 7 — File Change Summary

> **Update — Partial:** The initial vertical-slice files are already in place: FastAPI routes, schemas, Tier 1/3/5 pipeline code, forensics artifacts, evidence-PDF generation, audit-chain and contract source, plus the Next.js Command Center and its components. The new logging files, model-tier tests, Hardhat deployment project, deployed-contract metadata, live-frame endpoint, and Web3 implementation listed below are not yet present.

Expected files to be created or modified:

### New Files
| File | Purpose |
|---|---|
| `backend/logging_config.py` | Logging setup with JSON-lines file handler + console handler |
| `backend/tests/test_tier2_ocr.py` | OCR unit tests |
| `backend/tests/test_tier3_forensics.py` | Forensics unit tests |
| `backend/tests/test_tier4_biometrics.py` | Biometrics unit tests |
| `backend/tests/test_logging.py` | Logging infrastructure tests |
| `backend/blockchain/hardhat/` | Hardhat project for contract deployment |
| `backend/blockchain/deployed.json` | Deployed contract address + ABI |

### Modified Files
| File | Changes |
|---|---|
| `backend/main.py` | Add request logging middleware, fix lifespan, accept `live_frame` upload |
| `backend/config.py` | Add log directory path, Polygon env vars |
| `backend/pipeline/orchestrator.py` | Wire logging, add timing, OCR-to-MRZ feedback loop |
| `backend/pipeline/tier2_ocr.py` | Full PaddleOCR implementation |
| `backend/pipeline/tier4_biometrics.py` | Full ArcFace + MiniFASNet implementation |
| `backend/blockchain/polygon.py` | Real Web3 transaction signing |
| `backend/requirements.txt` | Add `paddleocr`, `paddlepaddle`, `insightface`, `onnxruntime-gpu`, `web3` |
| `frontend/app/page.tsx` | Fix error handling, add drag-drop, manage live frame state |
| `frontend/app/components/FaceMatch.tsx` | Add webcam capture via `getUserMedia` |
| `frontend/app/components/BlockchainBadge.tsx` | Add Polygonscan link when anchored |

---

## Critical Rules

> **Update — Partially satisfied:** The current implementation does not train models, never stores biometric embeddings, and preserves graceful `unavailable` fallbacks for unconfigured OCR, biometrics, and Polygon integrations. The logging-specific rules and the expanded test-after-each-tier rule will become enforceable once Parts 1–6 are implemented.

1. **Never store biometric embeddings.** Match-and-discard in memory only.
2. **Never break the graceful fallback.** If PaddleOCR / InsightFace / Web3 is not installed, the tier must return `status="unavailable"`, not crash.
3. **Every `except` block must log with `exc_info=True`.** No silent failures.
4. **All log lines must include `screening_id`.** Use the `contextvars` approach, not manual passing.
5. **Do not train any models.** Use only pre-trained weights via `pip install` or downloaded `.onnx` files.
6. **Test after each tier is completed.** Do not batch all changes and test at the end.
