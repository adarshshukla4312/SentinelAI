# SentinelAI

SentinelAI is an offline-first identity-document screening command center for SIH26188. It is being built as a five-tier pipeline: cryptographic validation, OCR/schema checks, passive forensics, live biometrics, and a hash-chained audit ledger.

## Current vertical slice

- FastAPI API with a working ICAO TD3 MRZ check-digit validator
- Real ELA and FFT-based photocopy heuristics that produce a forensic heatmap
- Deterministic decision fusion and a persistent SHA-256 audit hash chain
- Next.js Command Center that uploads a document and renders every tier result
- Explicit adapter boundaries for PaddleOCR, InsightFace/MiniFASNet, DocTamper, UIDAI QR validation, and Polygon anchoring

The optional model-backed tiers deliberately report `unavailable` until their vetted weights and runtime configuration are supplied. They never fabricate a biometric, OCR, blockchain, or forensic-model result.

## Run locally

```powershell
# Terminal 1 — API
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Command Center
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The UI proxies `/api/*` requests to the FastAPI service on port 8000.

## Tests

```powershell
cd backend
python -m unittest discover -s tests -v
```

See [plan.md](./plan.md) for the product blueprint and [DESIGN.md](./DESIGN.md) for the design system.
