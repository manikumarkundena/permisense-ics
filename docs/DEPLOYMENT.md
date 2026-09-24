# PermiSense Deployment

## Production topology

The recommended hackathon deployment is:

- Railway PostgreSQL: managed database
- Railway backend service: Docker container
- Virtual PLC + process simulator + Modbus gateway: run inside the backend container for the self-contained virtual industrial lab
- Next.js frontend: separate deployment (Vercel or another Next.js host)

The browser never connects directly to PostgreSQL or the PLC.

Browser
  -> HTTPS / WebSocket
FastAPI
  -> PostgreSQL
  -> Virtual PLC
  -> Modbus gateway

## Railway database

Create a PostgreSQL database in the same Railway project as the backend.

Railway exposes DATABASE_URL to services in the project. Set the backend service variable:

DATABASE_URL=${{Postgres.DATABASE_URL}}

The application uses SQLAlchemy + asyncpg and Alembic migrations.

## Backend service

Deploy the repository/branch containing the root Dockerfile.

The container starts:

1. Alembic migrations
2. FastAPI
3. Virtual PLC
4. Modbus telemetry gateway

Required variables:

ENVIRONMENT=production
DEBUG=false
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGINS=https://<frontend-domain>
MODBUS_HOST=127.0.0.1
MODBUS_PORT=5020
GEMINI_API_KEY=<optional>

Railway injects PORT automatically. The container uses PORT for FastAPI and binds to 0.0.0.0.

Health check:

/api/health

Public API domain example:

https://<permisense-api>.up.railway.app

## WebSocket

The actual backend WebSocket endpoint is:

/ws/events

Development:

ws://127.0.0.1:8000/ws/events

Production:

wss://<permisense-api>.up.railway.app/ws/events

The frontend constructs this from NEXT_PUBLIC_API_URL.

## Frontend

Set:

NEXT_PUBLIC_API_URL=https://<permisense-api>.up.railway.app

Do not expose:

- DATABASE_URL
- GEMINI_API_KEY
- PostgreSQL credentials
- PLC credentials

The frontend only calls FastAPI.

## Demo Lab

Allowlisted scenario endpoints:

POST /api/demo/scenarios/speed
POST /api/demo/scenarios/mode
GET  /api/demo/status

Scenario execution is real Modbus/TCP against the virtual PLC. The frontend does not fabricate security events.

Speed scenario:

R40003: safe baseline -> 90.0

Mode scenario:

R40002: RUN -> STOP

The mode scenario requires a clean speed baseline (R40003 <= 80) so the recovery demonstration is deterministic.

## Database migrations

Local:

cd backend
alembic upgrade head

Production:

The container startup runs:

python -m alembic upgrade head

Do not manually recreate tables in production.

## Production verification

After deployment:

1. GET /api/health
2. GET /api/system/status
3. GET /api/demo/status
4. Verify telemetry is arriving
5. Open WebSocket /ws/events
6. Trigger speed scenario
7. Confirm CONTROL_WRITE detection
8. Confirm incident correlation
9. Approve the response
10. Verify recovery from process telemetry

## Important limitation

The production industrial lab is a protocol-real virtual environment, not a physical plant.

The Virtual PLC, process simulator, and gateway are intentionally packaged with the backend service so the hackathon demonstration remains self-contained.
