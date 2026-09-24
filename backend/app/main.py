from fastapi import FastAPI

from app.core.config import settings
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

app.include_router(telemetry_router)
app.include_router(incidents_router)
app.include_router(response_router)
app.include_router(copilot_router)
app.include_router(live_router)


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
            "database": "configured",
            "modbus": "configured",
            "detection": "online",
            "correlation": "online",
            "risk_engine": "online",
            "evidence": "online",
            "response_engine": "online",
            "live_stream": "online",
            "ai_copilot": "configured" if settings.gemini_api_key else "not_configured",
        },
    }
