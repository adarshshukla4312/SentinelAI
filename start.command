#!/usr/bin/env bash
# macOS double-clickable launcher
cd "$(cd "$(dirname "$0")" && pwd)"
chmod +x start.sh 2>/dev/null || true
./start.sh
