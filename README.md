# SentinelAI · Sovereign Document Screening & Biometric Engine

SentinelAI is an offline-first, sovereign identity-document screening command center developed for **SIH26188 (Ministry of Home Affairs)**. It employs a 5-tier zero-trust defense pipeline: deterministic cryptography, optical character recognition & VIZ schema reconciliation, passive substrate forensics, ephemeral 1:1 facial biometrics with anti-spoofing, and Bayesian decision fusion with a SHA-256 Merkle audit chain anchored to Polygon.

---

## Architecture & Features

- **Tier 1 (Cryptography)**: ICAO 9303 (7-3-1 modulo-10) check-digit verification for Passports; **Verhoeff dihedral ($D_5$) algorithm** for Indian Aadhaar 12-digit UIDs; OpenCV 2D QR validation.
- **Tier 2 (OCR & VIZ Schema)**: RapidOCR (PP-OCRv4 ONNX) text extraction, Levenshtein fuzzy matching, and dual-zone schema cross-validation (Front VIZ + Back Address/Care-Of/PIN).
- **Tier 3 (Passive Forensics)**: Error Level Analysis (ELA Q=90) for JPEG compression anomalies and 2D Fast Fourier Transform (FFT) for halftone screen print detection.
- **Tier 4 (Ephemeral Biometrics)**: ArcFace 1:1 cosine facial matching ($\ge 0.45$) and MiniFASNet presentation attack detection ($\ge 0.70$). **Match-and-Discard**: 0 biometric vectors stored (DPDP Act & GDPR compliant).
- **Tier 5 (Audit & Blockchain)**: Deterministic Bayesian fusion with tamper-proof SHA-256 Merkle block generation and Polygon Amoy testnet anchoring. Automatic court-admissible PDF evidence docket generation.

---

## Prerequisites

Before running the project, ensure you have the following installed:

1. **Python 3.10 – 3.12**: [python.org](https://www.python.org/downloads/)
2. **Node.js 18+ & npm**: [nodejs.org](https://nodejs.org/)
3. **Git**: [git-scm.com](https://git-scm.com/)

---

## Quickstart Guide

### 1. Clone the Repository

```bash
git clone https://github.com/adarshshukla4312/SentinelAI.git
cd SentinelAI
```

---

### 2. Backend Setup (FastAPI Engine)

Open a terminal in the project root:

```bash
cd backend

# Create and activate virtual environment
# On Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# On Linux / macOS:
# python3 -m venv .venv
# source .venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt

# Start the FastAPI engine
uvicorn main:app --reload --port 8000
```

The backend API will start at `http://127.0.0.1:8000`.  
API documentation is available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup (Command Center & Workstation)

Open a second terminal in the project root:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```

The frontend will be available at:
- **Product & Technical Showcase**: `http://localhost:3000`
- **Border Control Inspection Cockpit**: `http://localhost:3000/test`

> **Note**: The frontend automatically proxies all `/api/*` requests to the FastAPI backend running on port 8000 via Next.js rewrites.

---

## Model Weights & Automated Setup

SentinelAI is designed to be self-configuring with zero tedious setup:

1. **MiniFASNet Anti-Spoofing Models**:
   Pre-trained weights (`2.7_80x80_MiniFASNetV2.pth` and `4_0_0_80x80_MiniFASNetV1SE.pth`) are included directly in the repository under `backend/vendor/silent_fas/resources/anti_spoof_models/`.
2. **RapidOCR Models**:
   Included automatically with the `rapidocr_onnxruntime` package.
3. **InsightFace (ArcFace buffalo_l)**:
   InsightFace automatically downloads its standard `buffalo_l` detection/recognition models to `~/.insightface/models/buffalo_l/` upon the first live biometric screening run.

---

## Running Automated Tests

### Backend Unit Tests (32 Tests)

```bash
cd backend
python -m unittest discover -s tests -v
```

### Frontend Typecheck

```bash
cd frontend
npx tsc --noEmit
```

---

## Optional Environment Variables

The system operates 100% offline by default. To enable optional on-chain Polygon Amoy anchoring, create a `backend/.env` file:

```env
POLYGON_RPC_URL="https://rpc-amoy.polygon.technology"
POLYGON_PRIVATE_KEY="your_wallet_private_key_here"
POLYGON_CONTRACT_ADDRESS="0x93309a4773c880492cb26E2C9697A1f879fa93e2"
```

If omitted, blockchain anchoring is gracefully skipped while local SHA-256 Merkle chain blocks continue to be generated normally.

