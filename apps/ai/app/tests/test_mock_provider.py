import pytest

from app.providers.mock_provider import MockAIProvider
from app.schemas import GenerateCalculationRequest, ReviewCalculationRequest, CalculationItem


@pytest.mark.asyncio
async def test_deck_scenario_returns_structured_items() -> None:
    result = await MockAIProvider().create_calculation(GenerateCalculationRequest(
        description="Bygg en ny altan på cirka 30 m² med tryckimpregnerad trall.",
    ))
    assert result.title == "Byte av altan"
    assert any(item.type == "material" for item in result.items)
    assert all(item.quantity > 0 for item in result.items)


@pytest.mark.asyncio
async def test_review_never_changes_calculation_and_can_suggest_missing_waste() -> None:
    result = await MockAIProvider().review_calculation(ReviewCalculationRequest(
        title="Altan", items=[CalculationItem(type="labor", name="Bygge", quantity=8, unit="tim")],
    ))
    assert result.items[0].title == "Möjlig saknad kostnad"
    assert result.items[0].proposed_item is not None
