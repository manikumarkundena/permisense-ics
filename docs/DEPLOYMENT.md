# PermiSense Deployment

## Current hackathon topology

The current deployed topology is intentionally split so frontend changes do not require backend redeployment:

```text
Browser
  │
  ├── HTTPS / WebSocket
  ▼
Vercel — Next.js frontend
  │
  │ REST / WebSocket
  ▼
Render — FastAPI backend
  │
  ├── PostgreSQL
  └── Virtual PLC / process simulator
       └── Modbus/TCP :5020
```

The browser never connects directly to PostgreSQL or the PLC.

## Backend environment

Required server-side variables:

```env
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=<managed PostgreSQL URL>
CORS_ORIGINS=https://permisense-ics-frontend.vercel.app
MODBUS_HOST=127.0.0.1
MODBUS_PORT=5020
GEMINI_API_KEY=<optional>
```

Do not put DATABASE_URL or GEMINI_API_KEY in the frontend.

## Frontend environment

```env
NEXT_PUBLIC_API_URL=https://permisense-api.onrender.com
NEXT_PUBLIC_WS_URL=wss://permisense-api.onrender.com/ws/events
```

## Health checks

- GET /api/health
- GET /api/system/status
- GET /api/demo/status
- WebSocket /ws/events

## Demo sequence

1. Restore the controlled baseline.
2. Trigger the overspeed or mode scenario.
3. Observe the real Modbus/TCP control change.
4. Observe process telemetry.
5. Confirm detection and cyber-physical correlation.
6. Inspect the persisted incident and evidence-derived risk.
7. Approve the recommended response.
8. Verify PLC readback and process recovery.

## Deployment isolation

The backend Dockerfile copies only:

- backend/
- industrial_lab/
- scripts/

The frontend lives under frontend/ and is not copied into the backend image. Therefore consolidating the frontend source into the repository does not change the backend container contents.

The currently deployed backend branch remains deployment-v2. The full-stack submission branch is separate until explicitly merged.
