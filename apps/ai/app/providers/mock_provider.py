from app.providers.base import AIProvider
from app.schemas import (
    GenerateCalculationRequest,
    GeneratedCalculation,
    GeneratedItem,
    ReviewCalculationRequest,
    ReviewItem,
    ReviewResult,
)


def _contains(text: str, *terms: str) -> bool:
    lowered = text.casefold()
    return any(term.casefold() in lowered for term in terms)


class MockAIProvider(AIProvider):
    """Predictable development scenarios that resemble real contractor jobs."""

    async def create_calculation(self, request: GenerateCalculationRequest) -> GeneratedCalculation:
        text = request.description
        if _contains(text, "altan", "deck", "trall"):
            return GeneratedCalculation(title="Byte av altan", items=[
                GeneratedItem(type="labor", name="Rivning av befintlig altan", quantity=8, unit="tim"),
                GeneratedItem(type="labor", name="Byggnation av ny altan", quantity=24, unit="tim"),
                GeneratedItem(type="material", name="Tryckimpregnerad trall", quantity=33, unit="m²"),
                GeneratedItem(type="material", name="Regelvirke", quantity=120, unit="m"),
            ])
        if _contains(text, "badrum", "bathroom"):
            return GeneratedCalculation(title="Badrumsrenovering", items=[
                GeneratedItem(type="labor", name="Rivning och förberedelse", quantity=18, unit="tim"),
                GeneratedItem(type="labor", name="Tätskikt och plattsättning", quantity=42, unit="tim"),
                GeneratedItem(type="material", name="Tätskikt", quantity=1, unit="paket"),
                GeneratedItem(type="material", name="Kakel", quantity=28, unit="m²"),
                GeneratedItem(type="other", name="Avfallshantering", quantity=1, unit="st"),
            ])
        if _contains(text, "måla", "målning", "paint"):
            return GeneratedCalculation(title="Målningsarbete", items=[
                GeneratedItem(type="labor", name="Underarbete och spackling", quantity=12, unit="tim"),
                GeneratedItem(type="labor", name="Målning", quantity=20, unit="tim"),
                GeneratedItem(type="material", name="Färg", quantity=20, unit="l"),
                GeneratedItem(type="material", name="Spackel", quantity=2, unit="st"),
            ])
        if _contains(text, "kök", "kitchen"):
            return GeneratedCalculation(title="Köksrenovering", items=[
                GeneratedItem(type="labor", name="Demontering av befintligt kök", quantity=16, unit="tim"),
                GeneratedItem(type="labor", name="Montering av kök", quantity=36, unit="tim"),
                GeneratedItem(type="labor", name="Målning och finjustering", quantity=12, unit="tim"),
                GeneratedItem(type="material", name="Förbrukningsmaterial", quantity=1, unit="st"),
            ])
        if _contains(text, "mark", "dräner", "ground"):
            return GeneratedCalculation(title="Markarbete", items=[
                GeneratedItem(type="labor", name="Förberedande markarbete", quantity=16, unit="tim"),
                GeneratedItem(type="other", name="Maskinhyra", quantity=1, unit="dag"),
                GeneratedItem(type="material", name="Bärlager", quantity=8, unit="ton"),
                GeneratedItem(type="other", name="Transport", quantity=1, unit="st"),
            ])
        return GeneratedCalculation(title="Ny kalkyl", items=[
            GeneratedItem(type="labor", name="Planering och utförande", quantity=8, unit="tim"),
            GeneratedItem(type="material", name="Material enligt specifikation", quantity=1, unit="st"),
        ])

    async def review_calculation(self, request: ReviewCalculationRequest) -> ReviewResult:
        names = " ".join(item.name.casefold() for item in request.items)
        items: list[ReviewItem] = []
        if not _contains(names, "avfall", "container", "bortforsl"):
            items.append(ReviewItem(
                type="missing_item", severity="warning", title="Möjlig saknad kostnad",
                description="Avfallshantering eller bortforsling finns inte med i kalkylen.",
                suggested_action="Lägg till en rad om det är relevant för arbetet.",
                proposed_item=GeneratedItem(type="other", name="Avfallshantering", quantity=1, unit="st"),
            ))
        has_decking = _contains(names, "trall", "altan", "deck")
        if has_decking and not _contains(names, "regel", "bjälk", "stomme"):
            items.append(ReviewItem(
                type="missing_item", severity="important", title="Kontrollera bärande stomme",
                description="Kalkylen innehåller trall men ingen synlig rad för regelvirke eller stomme.",
                suggested_action="Kontrollera om stommaterial ska läggas till.",
                proposed_item=GeneratedItem(type="material", name="Regelvirke", quantity=1, unit="m"),
            ))
        labor_hours = sum(item.quantity for item in request.items if item.type == "labor" and item.unit.casefold() in {"tim", "hour", "h"})
        material_area = sum(item.quantity for item in request.items if item.type == "material" and item.unit.casefold() in {"m²", "m2"})
        if material_area >= 30 and labor_hours < 12:
            items.append(ReviewItem(
                type="quantity_check", severity="warning", title="Kontrollera arbetsmängden",
                description=f"Det finns {material_area:g} m² material men bara {labor_hours:g} arbetstimmar i underlaget.",
                suggested_action="Se över om arbetstiden täcker förberedelse, utförande och avslut.",
            ))
        return ReviewResult(
            summary="Granskningen har letat efter vanliga kompletteringar och orimliga proportioner. Förslagen är bara ett beslutsunderlag.",
            items=items,
        )
