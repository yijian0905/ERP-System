"""
ERP AI Service - Main Application
Provides predictive analytics using Scikit-learn for L2+ tier features.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.config import settings
from app.routes import forecast, health

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting ERP AI Service...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Port: {settings.PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down ERP AI Service...")


# Create FastAPI app
app = FastAPI(
    title="ERP AI Service",
    description="Predictive analytics service for ERP system (L2+ tier)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(forecast.router, prefix="/api/v1/forecast", tags=["Forecast"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "ERP AI Service",
        "version": "1.0.0",
        "status": "running",
        "tier": "L2+"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development"
    )


