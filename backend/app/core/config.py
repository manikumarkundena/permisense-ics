from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "PermiSense"
    app_version: str = "0.2.0"
    environment: str = "development"
    debug: bool = False

    database_url: str = (
        "postgresql+asyncpg://permisense:permisense@localhost:5433/permisense"
    )

    mqtt_host: str = "localhost"
    mqtt_port: int = 1883

    modbus_host: str = "127.0.0.1"
    modbus_port: int = 5020

    # Comma-separated browser origins. Example:
    # CORS_ORIGINS=https://permisense.example.com
    cors_origins: str = (
        "http://localhost:3000,"
        "http://127.0.0.1:3000,"
        "http://localhost:3001,"
        "http://127.0.0.1:3001"
    )

    gemini_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
