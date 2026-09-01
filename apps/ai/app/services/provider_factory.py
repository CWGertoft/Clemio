import os
from functools import lru_cache

from app.providers import AIProvider, MockAIProvider, OpenAIProvider


@lru_cache(maxsize=1)
def get_provider() -> AIProvider:
    provider_name = os.getenv("AI_PROVIDER", "mock").casefold()
    if provider_name == "mock":
        return MockAIProvider()
    if provider_name == "openai":
        return OpenAIProvider()
    raise RuntimeError(f"Unsupported AI_PROVIDER: {provider_name}")
