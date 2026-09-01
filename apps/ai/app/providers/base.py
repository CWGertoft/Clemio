from abc import ABC, abstractmethod

from app.schemas import GenerateCalculationRequest, GeneratedCalculation, ReviewCalculationRequest, ReviewResult


class AIProvider(ABC):
    """A provider proposes structured work; it never sets monetary values."""

    @abstractmethod
    async def create_calculation(self, request: GenerateCalculationRequest) -> GeneratedCalculation:
        raise NotImplementedError

    @abstractmethod
    async def review_calculation(self, request: ReviewCalculationRequest) -> ReviewResult:
        raise NotImplementedError
