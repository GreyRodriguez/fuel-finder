from pydantic import BaseModel
from decimal import Decimal
from typing import Optional


class PriceCreate(BaseModel):
    station_id: int
    fuel_type: str
    price_per_liter: Decimal


class PriceUpdate(BaseModel):
    fuel_type: Optional[str] = None
    price_per_liter: Optional[Decimal] = None
    status: Optional[str] = None
