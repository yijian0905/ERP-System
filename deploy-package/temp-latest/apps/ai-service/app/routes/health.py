"""
Health check endpoints.
"""

from fastapi import APIRouter, status
from typing import Dict

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint.
    
    Returns:
        Status of the service
    """
    return {
        "status": "healthy",
        "service": "ai-service"
    }


@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check() -> Dict[str, str]:
    """
    Readiness check endpoint.
    Verifies that the service is ready to accept requests.
    
    Returns:
        Readiness status
    """
    # TODO: Add checks for database, redis, etc.
    return {
        "status": "ready",
        "service": "ai-service"
    }


