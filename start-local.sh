#!/bin/bash
# GenesisOS Local Mode — Start Both Servers
# Usage: ./start-local.sh
#   Flask API on :8080, Vite dev server on :5173

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
LOG_DIR="/tmp/genesisOS-logs"
mkdir -p "$LOG_DIR"

echo "🚀 Starting GenesisOS Local Mode..."
echo ""

# Kill any existing instances
pkill -f "python3.*app.py.*genesisOS" 2>/dev/null || true
pkill -f "vite.*genesisOS" 2>/dev/null || true
sleep 1

# Start Flask backend
echo "📦 Starting Flask API (port 8080)..."
cd "$BACKEND_DIR"
python3 app.py > "$LOG_DIR/backend.log" 2>&1 &
FLASK_PID=$!
echo "   PID: $FLASK_PID"
sleep 2

# Verify Flask is up
if curl -sf http://localhost:8080/api/health-check > /dev/null 2>&1; then
    echo "   ✅ Flask API running"
else
    echo "   ❌ Flask API failed to start! Check $LOG_DIR/backend.log"
    exit 1
fi

# Start Vite dev server
echo "🎨 Starting Vite dev server (port 5173)..."
cd "$SCRIPT_DIR"
npx vite --host > "$LOG_DIR/frontend.log" 2>&1 &
VITE_PID=$!
echo "   PID: $VITE_PID"
sleep 3

echo ""
echo "═══════════════════════════════════════════"
echo "  🎮 GenesisOS is running!"
echo ""
echo "  Frontend:  http://localhost:5173"
echo "  API:       http://localhost:8080"
echo "  Network:   http://192.168.0.63:5173"
echo ""
echo "  Academy:   6 phases, 24 subjects"
echo "  Music:     66 tracks loaded"
echo "  Nature:    9 datasets (fauna + flora)"
echo ""
echo "  Logs:      $LOG_DIR/"
echo "═══════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C to clean up
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $FLASK_PID 2>/dev/null
    kill $VITE_PID 2>/dev/null
    echo "Done."
    exit 0
}
trap cleanup INT TERM

# Wait for either to exit
wait
