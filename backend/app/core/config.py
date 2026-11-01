from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    ai_provider: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"
    frontend_origin: str = "http://localhost:5173"
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'codereviewcoach.db').as_posix()}"
    secret_key: str = ""
    token_minutes: int = 60 * 24 * 7

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
