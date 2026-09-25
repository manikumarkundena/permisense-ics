# PermiSense

> **Cyber-Physical Incident Intelligence & Human-Approved Response Platform for Smart Manufacturing**

PermiSense is a protocol-real industrial security platform that connects **cyber control activity** with **physical process telemetry**.

The project follows:

OBSERVE → DETECT → CORRELATE → IMPACT → RISK → INCIDENT → APPROVE → RESPOND → VERIFY

## Why PermiSense?

A firewall and network segmentation remain important prevention layers. PermiSense is a complementary cyber-physical intelligence layer.

| Security layer | Primary question |
|---|---|
| Firewall / segmentation | **Can this communication occur?** |
| PermiSense | **What did the allowed industrial action do to the physical process?** |

For example, an allowed engineering path may communicate with a PLC. If the speed setpoint changes from 50% → 90% and the observed process speed then exceeds the 80% safety threshold, PermiSense correlates the control event with the physical consequence and creates an auditable incident.

## End-to-End Architecture

```text
                  OPERATOR / SOC
                       │
                HTTPS / REST / WS
                       │
                       ▼
              ┌─────────────────┐
              │   PERMISENSE    │
              │ Live Telemetry  │
              │ Detection       │
              │ Correlation     │
              │ Impact Analysis │
              │ Risk Engine     │
              │ Incident Store  │
              │ Response Gate   │
              └────────┬────────┘
                       │
                 Modbus/TCP
                       │
                       ▼
             ┌───────────────────┐
             │      PLC-01       │
             │ R400xx control    │
             │ R300xx telemetry  │
             └─────────┬─────────┘
                       │
                     VFD-01
                       │
                     MOTOR
                       │
                 CONVEYOR CELL
                       │
                  PROCESS SENSORS
                       │
                       └──────► PLC telemetry
```

## Industrial Data Model

### Control plane — R400xx

- R40001 — Motor Enable
- R40002 — Operating Mode
- R40003 — Conveyor Speed Setpoint
- R40004 — Acceleration Limit
- R40005 — Production Target
- R40010 — Overspeed Limit
- R40011 — High Load Limit
- R40012 — Jam Timeout
- R40013 — Configuration Version

### Process telemetry — R300xx

- R30001 — Actual Speed
- R30002 — Motor Current
- R30003 — Mechanical Load
- R30004 — Position
- R30005 — Workpiece Count
- R30006 — Jam State
- R30007 — Process State

The key distinction is:

**What was commanded?** → R400xx

**What actually happened?** → R300xx

## Incident Intelligence Pipeline

1. **Observe** — receive industrial telemetry and control events.
2. **Detect** — identify suspicious control changes and process deviations.
3. **Correlate** — associate cyber and physical events using asset/process context and a defined temporal window.
4. **Impact** — evaluate physical threshold violations and process consequences.
5. **Risk** — calculate a bounded, evidence-derived score with structured factor contributions.
6. **Incident** — persist evidence, detections, correlation, impact, risk and response state.
7. **Approve** — require explicit human approval before an industrial control action.
8. **Respond** — execute the approved Modbus/TCP operation.
9. **Verify** — confirm recovery using PLC readback and process telemetry.

## Example: Conveyor Overspeed

```text
CONTROL EVENT
R40003: 50% → 90%
        │
        ▼
      PLC-01
        │
        ▼
      VFD-01
        │
        ▼
      MOTOR
        │
        ▼
    CONVEYOR
        │
        ▼
PROCESS TELEMETRY
R30001 exceeds 80%
        │
        ▼
CYBER + PHYSICAL CORRELATION
        │
        ▼
INCIDENT
        │
        ▼
EVIDENCE-DERIVED RISK
        │
        ▼
HUMAN APPROVAL
        │
        ▼
MODBUS/TCP RESPONSE
        │
        ▼
PROCESS RECOVERY
        │
        ▼
TELEMETRY VERIFICATION
```

The hackathon demonstration uses a **controlled virtual PLC and process simulator**. It is not presented as an intrusion into a real industrial plant.

## Frontend

The Next.js operator console provides:

- Command Center
- Live Process
- Incidents
- Investigation
- Response Gate
- Evidence Graph
- AI Copilot
- Demo Lab

The browser uses REST APIs for operations and a WebSocket for live events. It does not connect directly to PostgreSQL or the PLC.

## Backend

The FastAPI backend contains dedicated services for:

- telemetry
- detection
- cyber-physical correlation
- impact analysis
- evidence
- risk assessment
- incidents
- response and recovery
- AI Copilot
- virtual industrial demo controls
- live event streaming

PostgreSQL stores persistent application evidence and incident state.

## Deployment

Current hackathon topology:

```text
Vercel
Next.js Frontend
      │
      │ HTTPS / WebSocket
      ▼
Render
FastAPI Backend
      │
      ├── PostgreSQL
      │
      └── Virtual PLC / Modbus-TCP
```

Live frontend: https://permisense-ics-frontend.vercel.app/

Live backend: https://permisense-api.onrender.com/

Health: /api/health

System status: /api/system/status

Demo status: /api/demo/status

WebSocket: /ws/events

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

The current virtual industrial lab uses Modbus/TCP on port 5020.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

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

## Repository Structure

```text
permisense-ics/
├── backend/              # FastAPI, detection, correlation, risk, response
├── frontend/             # Next.js PermiSense operator console
├── industrial_lab/       # Virtual PLC / industrial process environment
├── scripts/              # Deployment / startup helpers
├── docs/                 # Deployment and architecture documentation
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/    # CI
```

## Design Principles

- **Human-in-the-loop:** no PLC remediation without explicit approval.
- **Evidence-first:** detection, correlation and risk use observable structured evidence.
- **Protocol-real demo:** scenarios use actual Modbus/TCP writes against the controlled virtual PLC.
- **Recovery-aware:** a successful control write is not treated as recovery until telemetry confirms the process state.
- **Defense-in-depth:** PermiSense complements network segmentation and access controls.
- **Auditability:** incidents retain evidence and lifecycle state.
- **No browser secrets:** database credentials and AI keys stay server-side.

## Project Status

PermiSense is a hackathon / research prototype built around a protocol-real virtual industrial environment.

The current architecture demonstrates:

**Cyber event → physical consequence → evidence correlation → explainable risk → human-approved response → verified recovery**

A production deployment would additionally require validated industrial hardware/testbeds, stronger identity and authorization controls, network segmentation, secure OT protocol support where available, safety interlocks, monitoring and formal operational testing.
