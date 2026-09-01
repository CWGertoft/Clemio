import os

from app.providers.base import AIProvider
from app.schemas import GenerateCalculationRequest, GeneratedCalculation, ReviewCalculationRequest, ReviewResult


class OpenAIProvider(AIProvider):
    """Intentional extension point. Add a structured-output OpenAI implementation here later."""

    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY")

    async def create_calculation(self, request: GenerateCalculationRequest) -> GeneratedCalculation:
        raise RuntimeError("OpenAIProvider is not configured yet. Set AI_PROVIDER=mock for the launchable MVP.")

    async def review_calculation(self, request: ReviewCalculationRequest) -> ReviewResult:
        raise RuntimeError("OpenAIProvider is not configured yet. Set AI_PROVIDER=mock for the launchable MVP.")
