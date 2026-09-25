# PermiSense Frontend

The PermiSense frontend is the Next.js operator console for the cyber-physical incident intelligence platform.

## Experiences

| Experience | Purpose |
|---|---|
| Command Center | Overall system and incident posture |
| Live Process | Real-time PLC/process telemetry |
| Incidents | Persisted cyber-physical incident records |
| Investigation | Evidence, correlation, impact and MITRE ICS context |
| Response Gate | Human-approved response and recovery |
| Copilot | Evidence-grounded investigation assistance |
| Demo Lab | Repeatable virtual-PLC scenarios |

## Data flow

```text
Next.js UI
   │
   ├── REST → incidents / response / demo / telemetry / Copilot
   │
   └── WebSocket → live event stream
                         │
                         ▼
              PermiSense FastAPI
                         │
                    PostgreSQL
                         +
                  Virtual PLC
                         │
                    Modbus/TCP
```

The browser does not connect directly to PostgreSQL or Modbus/TCP.

## Environment

Create frontend/.env.local:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000/ws/events
```

Production:

```env
NEXT_PUBLIC_API_URL=https://permisense-api.onrender.com
NEXT_PUBLIC_WS_URL=wss://permisense-api.onrender.com/ws/events
```

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm start
```

## Implementation notes

- Backend payloads are normalized into a stable UI contract.
- Live system status is normalized from the backend health model.
- Risk factors are rendered from structured evidence.
- Historical incidents remain visible for auditability while active incidents are derived separately.
- Response actions require explicit operator approval.
- Recovery is verified using PLC readback and process telemetry.
- The legacy virtual-cell implementation remains for historical/reference purposes but is excluded from production TypeScript checking.

## Deployment

Live frontend: https://permisense-ics-frontend.vercel.app/

Backend: https://permisense-api.onrender.com/
