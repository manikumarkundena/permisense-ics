from fastapi import FastAPI

from app.core.config import settings
from app.api.telemetry import router as telemetry_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "PermiSense — Cyber-Physical Incident Intelligence "
        "and Human-Approved Response Platform"
    ),
)

app.include_router(telemetry_router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }


@app.get("/api/system/status")
async def system_status():
    return {
        "service": settings.app_name,
        "status": "operational",
        "components": {
            "api": "online",
            "database": "not_checked",
            "modbus": "not_started",
            "mqtt": "not_started",
            "detection": "not_started",
            "risk_engine": "not_started",
            "ai": "not_started",
        },
    }