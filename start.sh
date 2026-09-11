#!/usr/bin/env bash
# ==============================================================
# SentinelAI — macOS / Linux Unified Launcher
# ==============================================================
set -e

# Change to the directory where this script is located
cd "$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║                SentinelAI  —  Unified Launcher               ║"
echo "  ║     Offline-First Multi-Tier Document & Biometric Engine     ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────────
# 1. Check for remote repository updates
# ─────────────────────────────────────────────
echo "[1/6] Checking for remote repository updates ..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    if git fetch origin > /dev/null 2>&1; then
        LOCAL=$(git rev-parse HEAD)
        REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "$LOCAL")
        if [ "$LOCAL" = "$REMOTE" ]; then
            echo "      [OK] Repository is up-to-date."
        else
            echo "      New commits detected on remote. Pulling ..."
            git pull --ff-only || echo "      [!] Auto-pull skipped due to local edits."
        fi
    else
        echo "      Could not reach remote — continuing with local code."
    fi
else
    echo "      Not a git repository — skipping update check."
fi

# ─────────────────────────────────────────────
# 2. Check Python dependencies
# ─────────────────────────────────────────────
echo ""
echo "[2/6] Checking Python dependencies (PyTorch, ONNX, OpenCV, FastAPI) ..."
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    if command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        echo "      [!] Python 3 not found. Please install Python 3.10+."
        exit 1
    fi
fi

if [ -f "backend/requirements.txt" ]; then
    echo "      Installing/verifying packages (heavy installs ~800MB on first run) ..."
    $PYTHON_CMD -m pip install --no-warn-script-location -r backend/requirements.txt
    echo "      [OK] Python dependencies ready."
fi

# ─────────────────────────────────────────────
# 3. Check Node.js frontend dependencies
# ─────────────────────────────────────────────
echo ""
echo "[3/6] Checking Node.js frontend dependencies (Next.js, React) ..."
if [ -f "frontend/package.json" ]; then
    (cd frontend && npm install --no-audit --no-fund)
    echo "      [OK] Node.js dependencies ready."
fi

# ─────────────────────────────────────────────
# 4. Pre-download heavy AI neural models (~340MB)
# ─────────────────────────────────────────────
echo ""
echo "[4/6] Pre-downloading and verifying heavy AI neural models (~340MB) ..."
echo "      (InsightFace ArcFace buffalo_l, RapidOCR PP-OCRv4, WeChatQR)"
if [ -f "backend/scripts/prewarm_models.py" ]; then
    $PYTHON_CMD backend/scripts/prewarm_models.py || echo "      [!] Pre-warm completed with warnings."
fi

# ─────────────────────────────────────────────
# 5. Clean up previous listeners & start backend
# ─────────────────────────────────────────────
echo ""
echo "[5/6] Starting FastAPI backend on http://127.0.0.1:8000 ..."
# Kill existing processes on port 8000 and 3000
lsof -ti :8000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti :3000 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start backend in background
(cd backend && $PYTHON_CMD -m uvicorn main:app --host 127.0.0.1 --port 8000) > /dev/null 2>&1 &
BACKEND_PID=$!
echo "      [OK] Backend starting (PID $BACKEND_PID) ..."

# ─────────────────────────────────────────────
# 6. Start frontend
# ─────────────────────────────────────────────
echo ""
echo "[6/6] Starting Next.js frontend on http://localhost:3000 ..."
(cd frontend && npm run dev) > /dev/null 2>&1 &
FRONTEND_PID=$!
echo "      [OK] Frontend starting (PID $FRONTEND_PID) ..."

# Trap exit/termination signals to kill background servers cleanly
cleanup() {
    echo ""
    echo "  Stopping SentinelAI services ..."
    kill -9 $BACKEND_PID 2>/dev/null || true
    kill -9 $FRONTEND_PID 2>/dev/null || true
    lsof -ti :8000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti :3000 2>/dev/null | xargs kill -9 2>/dev/null || true
    echo "  All services stopped. Goodbye!"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# ─────────────────────────────────────────────
# Wait for frontend to be ready & open browser
# ─────────────────────────────────────────────
echo ""
echo "  Waiting for SentinelAI command center to become ready ..."
RETRIES=0
until curl -s http://localhost:3000 > /dev/null 2>&1 || [ $RETRIES -ge 35 ]; do
    sleep 2
    RETRIES=$((RETRIES + 1))
done

echo ""
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║               SentinelAI is live and ready!                  ║"
echo "  ║                                                              ║"
echo "  ║   Testing Console : http://localhost:3000/test               ║"
echo "  ║   Product Landing : http://localhost:3000                    ║"
echo "  ║   FastAPI Engine  : http://127.0.0.1:8000                    ║"
echo "  ║   API Swagger Docs: http://127.0.0.1:8000/docs               ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo ""

# Open default browser on macOS (open) or Linux (xdg-open)
if command -v open &> /dev/null; then
    open "http://localhost:3000/test"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000/test"
fi

echo "  SentinelAI is active. Keep this Terminal window open."
echo "  To stop all services, close this window or type 'q' and press Enter."
echo ""

while true; do
    read -p "Command [type 'q' to shut down]: " USER_CMD
    case "$USER_CMD" in
        q|Q|quit|exit)
            cleanup
            ;;
        *)
            ;;
    esac
done
