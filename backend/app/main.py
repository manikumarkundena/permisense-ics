import asyncio
from contextlib import suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.api.telemetry import router as telemetry_router
from app.api.incidents import router as incidents_router
from app.api.response import router as response_router
from app.api.copilot import router as copilot_router
from app.api.live import router as live_router


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "PermiSense — Cyber-Physical Incident Intelligence "
        "and Human-Approved Response Platform"
    ),
)

cors_origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry_router)
app.include_router(incidents_router)
app.include_router(response_router)
app.include_router(copilot_router)
app.include_router(live_router)


async def database_ready() -> bool:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def tcp_ready(host: str, port: int) -> bool:
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port),
            timeout=1.5,
        )
        writer.close()
        with suppress(Exception):
            await writer.wait_closed()
        del reader
        return True
    except Exception:
        return False


@app.get("/api/health")
async def health():
    database = await database_ready()

    return {
        "status": "ok" if database else "degraded",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "checks": {
            "database": "online" if database else "offline",
        },
    }


@app.get("/api/system/status")
async def system_status():
    database = await database_ready()
    modbus = await tcp_ready(settings.modbus_host, settings.modbus_port)

    return {
        "service": settings.app_name,
        "status": "operational" if database else "degraded",
        "components": {
            "api": "online",
            "database": "online" if database else "offline",
            "modbus": "online" if modbus else "offline",
            "detection": "online",
            "correlation": "online",
            "risk_engine": "online",
            "evidence": "online",
            "response_engine": "online",
            "live_stream": "online",
            "ai_copilot": (
                "configured"
                if settings.gemini_api_key
                else "not_configured"
            ),
        },
    }
