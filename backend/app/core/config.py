"""
Core configuration for PhishGuard AI backend.
Uses environment variables with sensible defaults for local development.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "PhishGuard AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # CORS — frontend origin
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # ML model path (populated when the Random Forest is trained and serialised)
    MODEL_PATH: str = "model/phishing_model.pkl"

    # Request limits
    MAX_URL_LENGTH: int = 2048

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
