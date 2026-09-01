import os

from fastapi import APIRouter, HTTPException

from app.schemas import GenerateCalculationRequest, GeneratedCalculation, ReviewCalculationRequest, ReviewResult
from app.services import get_provider

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "provider": os.getenv("AI_PROVIDER", "mock")}


@router.post("/calculations/generate", response_model=GeneratedCalculation)
async def generate_calculation(payload: GenerateCalculationRequest) -> GeneratedCalculation:
    try:
        return await get_provider().create_calculation(payload)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@router.post("/calculations/review", response_model=ReviewResult)
async def review_calculation(payload: ReviewCalculationRequest) -> ReviewResult:
    try:
        return await get_provider().review_calculation(payload)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
