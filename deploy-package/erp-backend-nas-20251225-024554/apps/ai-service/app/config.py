"""
Configuration settings for AI Service.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    """Application settings."""
    
    # Server
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "postgresql://erp_user:erp_password@localhost:5432/erp_database"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # CORS - stored as string to avoid automatic JSON parsing
    # Use comma-separated string or JSON array string
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    # Logging
    LOG_LEVEL: str = "info"
    
    # Model settings
    MODEL_CACHE_TTL: int = 3600  # 1 hour
    PREDICTION_TIMEOUT: int = 30  # seconds
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS from JSON array or comma-separated string."""
        if not self.CORS_ORIGINS:
            return ["http://localhost:5173", "http://localhost:3000"]
        
        # Try to parse as JSON first
        try:
            parsed = json.loads(self.CORS_ORIGINS)
            if isinstance(parsed, list):
                return [str(origin) for origin in parsed]
        except (json.JSONDecodeError, ValueError):
            pass
        
        # If not JSON, treat as comma-separated string
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(',') if origin.strip()]
        return origins if origins else ["http://localhost:5173", "http://localhost:3000"]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )


settings = Settings()


