# PermiSense Backend

FastAPI backend for the PermiSense cyber-physical incident intelligence platform.

## Core pipeline

```text
Industrial telemetry
      ↓
Detection
      ↓
Cyber-physical correlation
      ↓
Physical impact
      ↓
Evidence-derived risk
      ↓
Incident persistence
      ↓
Human-approved response
      ↓
Modbus/TCP execution
      ↓
Recovery verification
```

## API surface

- /api/health
- /api/system/status
- /api/telemetry/events
- /ws/events
- /api/incidents
- /api/incidents/{incident_id}/response
- /api/incidents/{incident_id}/response/approve
- /api/incidents/{incident_id}/response/verify
- /api/incidents/{incident_id}/copilot
- /api/demo/status
- /api/demo/scenarios/speed
- /api/demo/scenarios/mode
- /api/demo/reset

## Industrial model

The backend uses a controlled virtual PLC and process simulator connected through Modbus/TCP.

Control registers: R40001–R40005 and R40010–R40013.

Process telemetry: R30001–R30007.

The browser never talks directly to the PLC. Control operations go through the backend response layer.

## Risk model

Risk is deterministic and evidence-derived:

```text
Severity
+ Control manipulation
+ Physical impact
+ Deviation magnitude
+ Temporal correlation
= bounded risk score
```

The API exposes structured factor contributions and reasons so operators can inspect why a score was produced.

## Response model

```text
Incident
  ↓
Recommendation
  ↓
Human approval
  ↓
Modbus/TCP write
  ↓
PLC readback
  ↓
Process telemetry verification
  ↓
Recovered / not recovered
```

## Environment

Server-side variables include:

```env
DATABASE_URL=...
CORS_ORIGINS=https://permisense-ics-frontend.vercel.app
MODBUS_HOST=127.0.0.1
MODBUS_PORT=5020
GEMINI_API_KEY=...
```

Do not expose database credentials or GEMINI_API_KEY to the browser.

## Local setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Production note

The industrial environment is a controlled virtual PLC/process simulator for the hackathon. A production deployment would require validated OT hardware/testbeds, identity and authorization controls, network segmentation, secure protocol support, safety controls and operational validation.
