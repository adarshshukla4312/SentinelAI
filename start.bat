@echo off
setlocal enabledelayedexpansion
title SentinelAI Launcher
color 0F
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                SentinelAI  —  Unified Launcher               ║
echo  ║     Offline-First Multi-Tier Document & Biometric Engine     ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: ─────────────────────────────────────────────
:: 1. Check for updates (git pull if remote has changes)
:: ─────────────────────────────────────────────
echo [1/6] Checking for remote repository updates ...

git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo       Not a git repository — skipping remote update check.
    goto :deps
)

git fetch origin >nul 2>&1
if errorlevel 1 (
    echo       Could not reach remote — continuing with local version.
    goto :deps
)

for /f %%i in ('git rev-parse HEAD') do set LOCAL=%%i
for /f %%i in ('git rev-parse @{u}') do set REMOTE=%%i

if "%LOCAL%"=="%REMOTE%" (
    echo       [OK] Repository is up-to-date.
) else (
    echo       New commits detected on remote. Fast-forward pulling ...
    git pull --ff-only
    if errorlevel 1 (
        echo       [!] Fast-forward pull failed due to local changes.
        echo           Resolve conflicts manually, then re-run this script.
        pause
        exit /b 1
    )
    echo       [OK] Updated repository to latest commit.
)

:: ─────────────────────────────────────────────
:: 2. Install Python dependencies (including heavy ML packages)
:: ─────────────────────────────────────────────
:deps
echo.
echo [2/6] Checking Python dependencies (PyTorch, ONNX, OpenCV, FastAPI) ...

if not exist "backend\requirements.txt" (
    echo       [!] backend\requirements.txt not found — skipping.
    goto :nodedeps
)

echo       Installing missing packages (heavy installs ~800MB on first run) ...
pip install --no-warn-script-location -r backend\requirements.txt
if errorlevel 1 (
    echo       [!] pip install encountered an error. Check your Python environment.
    pause
    exit /b 1
)
echo       [OK] Python dependencies ready.

:: ─────────────────────────────────────────────
:: 3. Install Node.js frontend dependencies
:: ─────────────────────────────────────────────
:nodedeps
echo.
echo [3/6] Checking Node.js frontend dependencies (Next.js, React) ...

if not exist "frontend\package.json" (
    echo       [!] frontend\package.json not found — skipping.
    goto :aimodels
)

pushd frontend
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo       [!] npm install encountered an error. Check your Node.js setup.
    popd
    pause
    exit /b 1
)
popd
echo       [OK] Node.js dependencies ready.

:: ─────────────────────────────────────────────
:: 4. Pre-download heavy AI neural models & weights (~340MB)
:: ─────────────────────────────────────────────
:aimodels
echo.
echo [4/6] Pre-downloading and verifying heavy AI neural models (~340MB) ...
echo       (InsightFace ArcFace buffalo_l, RapidOCR PP-OCRv4, WeChatQR)

if exist "backend\scripts\prewarm_models.py" (
    python backend\scripts\prewarm_models.py
    if errorlevel 1 (
        echo       [!] Model pre-warm returned non-zero. The app will attempt runtime download.
    )
) else (
    echo       [!] backend\scripts\prewarm_models.py not found — skipping pre-warm.
)

:: ─────────────────────────────────────────────
:: 5. Start backend (FastAPI on port 8000)
:: ─────────────────────────────────────────────
:startbackend
echo [5/6] Starting FastAPI backend on http://127.0.0.1:8000 ...

:: Kill any existing process on port 8000
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /PID %%p /F >nul 2>&1
)

start "SentinelAI Backend" /min cmd /c "cd /d "%~dp0backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000"
echo       [OK] Backend starting in background ...

:: ─────────────────────────────────────────────
:: 6. Start frontend (Next.js on port 3000)
:: ─────────────────────────────────────────────
echo.
echo [6/6] Starting Next.js frontend on http://localhost:3000 ...

:: Kill any existing process on port 3000
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%p /F >nul 2>&1
)

start "SentinelAI Frontend" /min cmd /c "cd /d "%~dp0frontend" && npm run dev"
echo       [OK] Frontend starting in background ...

:: ─────────────────────────────────────────────
:: Wait for frontend to be ready, then open browser
:: ─────────────────────────────────────────────
echo.
echo  Waiting for SentinelAI command center to become ready ...

set RETRIES=0
:waitloop
if %RETRIES% geq 35 (
    echo       [!] Server took longer than expected. Opening browser anyway ...
    goto :openbrowser
)
timeout /t 2 /nobreak >nul
curl -s -o nul http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    set /a RETRIES+=1
    goto :waitloop
)

:openbrowser
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║               SentinelAI is live and ready!                  ║
echo  ║                                                              ║
echo  ║   Testing Console : http://localhost:3000/test               ║
echo  ║   Product Landing : http://localhost:3000                    ║
echo  ║   FastAPI Engine  : http://127.0.0.1:8000                    ║
echo  ║   API Swagger Docs: http://127.0.0.1:8000/docs               ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

start "" http://localhost:3000/test

echo  SentinelAI is active. Keep this window open while using the app.
echo  To stop all services, close this window or type 'q' and press Enter.
echo.

:wait_input
set "USER_INPUT="
set /p USER_INPUT="Command [type 'q' to shut down]: "
if /i "!USER_INPUT!"=="q" goto :cleanup
if /i "!USER_INPUT!"=="quit" goto :cleanup
if /i "!USER_INPUT!"=="exit" goto :cleanup
goto :wait_input

:: ─────────────────────────────────────────────
:: Cleanup: kill backend and frontend
:: ─────────────────────────────────────────────
echo.
echo  Stopping SentinelAI services ...

taskkill /FI "WINDOWTITLE eq SentinelAI Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq SentinelAI Frontend*" /F >nul 2>&1

:: Also kill by port in case window titles don't match
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%p /F >nul 2>&1
)

echo  All services stopped safely. Goodbye!
timeout /t 2 >nul
