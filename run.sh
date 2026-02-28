#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGDIR="$ROOT/logs"
mkdir -p "$LOGDIR"

port_in_use() {
  # macOS-friendly check, returns 0 if listening
  lsof -iTCP:"$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

start_backend() {
  echo "Checking backend (port 8080)..."
  if port_in_use 8080; then
    echo "Port 8080 is in use — skipping backend start."
  else
    echo "Starting backend in background... (logs: $LOGDIR/backend.log)"
    cd "$ROOT/backend"
    mvn -DskipTests spring-boot:run >"$LOGDIR/backend.log" 2>&1 &
    echo $! > "$ROOT/backend.pid"
    cd "$ROOT"
    echo "Backend PID: $(cat "$ROOT/backend.pid")"
  fi
}

start_frontend() {
  echo "Checking frontend (port 3000)..."
  if port_in_use 3000; then
    echo "Port 3000 is in use — skipping frontend start."
  else
    echo "Starting frontend dev server in background... (logs: $LOGDIR/frontend.log)"
    cd "$ROOT/frontend"
    npm run dev -- --host >"$LOGDIR/frontend.log" 2>&1 &
    echo $! > "$ROOT/frontend.pid"
    cd "$ROOT"
    echo "Frontend PID: $(cat "$ROOT/frontend.pid")"
  fi
}

stop_all() {
  echo "Stopping services (if running via this script)..."
  [[ -f "$ROOT/backend.pid" ]] && kill "$(cat "$ROOT/backend.pid")" 2>/dev/null || true
  [[ -f "$ROOT/frontend.pid" ]] && kill "$(cat "$ROOT/frontend.pid")" 2>/dev/null || true
  rm -f "$ROOT/backend.pid" "$ROOT/frontend.pid"
  echo "Stopped."
}

case "${1:-}" in
  start|run|up)
    start_backend
    start_frontend
    echo "\nDone. Access backend: http://localhost:8080  frontend: http://localhost:3000/"
    ;;
  stop|down)
    stop_all
    ;;
  logs)
    echo "Backend log: $LOGDIR/backend.log"
    echo "Frontend log: $LOGDIR/frontend.log"
    ;;
  *)
    echo "Usage: $0 {start|stop|logs}"
    echo "  start|run|up  - start backend and frontend if ports are free"
    echo "  stop|down     - stop processes started by this script"
    echo "  logs          - show log file locations"
    exit 1
    ;;
esac
