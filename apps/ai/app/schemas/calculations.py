from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ItemType = Literal["labor", "material", "other"]
ReviewType = Literal["missing_item", "quantity_check", "potential_issue"]
Severity = Literal["info", "warning", "important"]


class LibraryReference(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=180)
    unit: str = Field(min_length=1, max_length=24)


class GeneratedItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    type: ItemType
    name: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=500)
    quantity: float = Field(gt=0, le=100000)
    unit: str = Field(min_length=1, max_length=24)


class GenerateCalculationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    description: str = Field(min_length=12, max_length=5000)
    available_labor: list[LibraryReference] = Field(default_factory=list, max_length=250)
    available_materials: list[LibraryReference] = Field(default_factory=list, max_length=250)


class GeneratedCalculation(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    items: list[GeneratedItem] = Field(min_length=1, max_length=100)


class CalculationItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    type: ItemType
    name: str = Field(min_length=1, max_length=180)
    quantity: float = Field(gt=0, le=100000)
    unit: str = Field(min_length=1, max_length=24)


class ReviewCalculationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: str = Field(min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    items: list[CalculationItem] = Field(max_length=250)


class ReviewItem(BaseModel):
    type: ReviewType
    severity: Severity
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=1000)
    suggested_action: str | None = Field(default=None, max_length=500)
    proposed_item: GeneratedItem | None = None


class ReviewResult(BaseModel):
    summary: str = Field(min_length=1, max_length=1000)
    items: list[ReviewItem] = Field(default_factory=list, max_length=20)
