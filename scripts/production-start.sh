#!/usr/bin/env bash
set -Eeuo pipefail

cd /app/backend

API_PORT="${PORT:-8000}"

cleanup() {
  echo "Stopping PermiSense services..."
  kill "${GATEWAY_PID:-}" "${PLC_PID:-}" "${API_PID:-}" 2>/dev/null || true
  wait "${GATEWAY_PID:-}" "${PLC_PID:-}" "${API_PID:-}" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Running database migrations..."
for attempt in $(seq 1 30); do
  if python -m alembic upgrade head; then
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    echo "Database migration failed after 30 attempts."
    exit 1
  fi

  echo "Database not ready yet; retrying migration in 2s ($attempt/30)..."
  sleep 2
done

echo "Starting FastAPI on 0.0.0.0:${API_PORT}..."
uvicorn app.main:app --host 0.0.0.0 --port "${API_PORT}" &
API_PID=!

echo "Waiting for API readiness..."
for attempt in $(seq 1 60); do
  if python - "${API_PORT}" <<'PY'
import sys
import urllib.request

port = sys.argv[1]
try:
    with urllib.request.urlopen(
        f"http://127.0.0.1:{port}/api/health",
        timeout=2,
    ) as response:
        raise SystemExit(0 if response.status == 200 else 1)
except Exception:
    raise SystemExit(1)
PY
  then
    break
  fi

  if [ "$attempt" -eq 60 ]; then
    echo "FastAPI did not become ready."
    exit 1
  fi

  sleep 1
done

echo "Starting Virtual PLC on ${MODBUS_HOST:-127.0.0.1}:${MODBUS_PORT:-5020}..."
python -m industrial_lab.plc.server &
PLC_PID=!

echo "Waiting for Virtual PLC..."
for attempt in $(seq 1 30); do
  if python - "${MODBUS_HOST:-127.0.0.1}" "${MODBUS_PORT:-5020}" <<'PY'
import socket
import sys

host, port = sys.argv[1], int(sys.argv[2])
try:
    with socket.create_connection((host, port), timeout=1):
        raise SystemExit(0)
except OSError:
    raise SystemExit(1)
PY
  then
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    echo "Virtual PLC did not become ready."
    exit 1
  fi

  sleep 1
done

echo "Starting Modbus telemetry gateway..."
python -m industrial_lab.gateway.modbus_gateway &
GATEWAY_PID=!

echo "PermiSense production runtime started."
echo "API PID=${API_PID} PLC PID=${PLC_PID} GATEWAY PID=${GATEWAY_PID}"

wait -n "$API_PID" "$PLC_PID" "$GATEWAY_PID"
exit $?
