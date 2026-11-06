from datetime import date
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

PumpFuel = Literal["Unleaded 91", "Premium 95", "Diesel"]
FeedbackCategory = Literal["System Needs", "Suggestion", "Price Report", "Other"]


def _blank_to_none(v):
    if isinstance(v, str):
        v = v.strip()
        return v or None
    return v


# ── Feedback ──────────────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    category: FeedbackCategory
    message: str = Field(..., min_length=10, max_length=1000)
    station_id: Optional[int] = None
    fuel_type: Optional[PumpFuel] = None
    reported_price: Optional[Decimal] = Field(None, gt=0, lt=1000, decimal_places=2)
    website: Optional[str] = None  # honeypot — real users never fill this in

    @field_validator("name", "email", "station_id", "fuel_type", "reported_price", "website", mode="before")
    @classmethod
    def _empty_is_none(cls, v):
        return _blank_to_none(v)

    @field_validator("message", mode="before")
    @classmethod
    def _strip_message(cls, v):
        return v.strip() if isinstance(v, str) else v

    @model_validator(mode="after")
    def _price_report_fields(self):
        if self.category == "Price Report":
            missing = [f for f in ("station_id", "fuel_type", "reported_price") if getattr(self, f) is None]
            if missing:
                raise ValueError(f"Price Report requires: {', '.join(missing)}")
        else:
            # Ignore leftovers if the user switched category after filling the extra fields
            self.station_id = self.fuel_type = self.reported_price = None
        return self


class FeedbackOut(BaseModel):
    feedback_id: int
    message: str = "Thanks! Your feedback has been received."


# ── Forecasts ─────────────────────────────────────────────────────────────────

class ForecastBase(BaseModel):
    fuel_type: Literal["Gasoline", "Diesel", "Kerosene"]
    change_per_liter: Decimal = Field(..., ge=-100, le=100, decimal_places=2)
    effective_date: date
    source: str = Field("Fuel Finder", min_length=1, max_length=150)
    notes: Optional[str] = Field(None, max_length=1000)


class ForecastCreate(ForecastBase):
    pass


class ForecastUpdate(BaseModel):
    fuel_type: Optional[Literal["Gasoline", "Diesel", "Kerosene"]] = None
    change_per_liter: Optional[Decimal] = Field(None, ge=-100, le=100, decimal_places=2)
    effective_date: Optional[date] = None
    source: Optional[str] = Field(None, min_length=1, max_length=150)
    notes: Optional[str] = Field(None, max_length=1000)


# ── Advisories ────────────────────────────────────────────────────────────────

AdvisoryFuel = Literal["All", "Unleaded 91", "Premium 95", "Diesel", "Kerosene"]


class AdvisoryBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    summary: str = Field(..., min_length=3, max_length=2000)
    source: str = Field(..., min_length=1, max_length=100)
    source_url: Optional[str] = Field(None, max_length=500)
    published_date: date
    fuel_type: AdvisoryFuel = "All"

    @field_validator("source_url", mode="before")
    @classmethod
    def _url(cls, v):
        v = _blank_to_none(v)
        if v and not v.lower().startswith(("http://", "https://")):
            raise ValueError("Link must start with http:// or https://")
        return v


class AdvisoryCreate(AdvisoryBase):
    pass


class AdvisoryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    summary: Optional[str] = Field(None, min_length=3, max_length=2000)
    source: Optional[str] = Field(None, min_length=1, max_length=100)
    source_url: Optional[str] = Field(None, max_length=500)
    published_date: Optional[date] = None
    fuel_type: Optional[AdvisoryFuel] = None

    @field_validator("source_url", mode="before")
    @classmethod
    def _url(cls, v):
        v = _blank_to_none(v)
        if v and not v.lower().startswith(("http://", "https://")):
            raise ValueError("Link must start with http:// or https://")
        return v

