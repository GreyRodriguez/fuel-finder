from pydantic import BaseModel
from decimal import Decimal
from datetime import date, time
from typing import Optional


class FuelPriceOut(BaseModel):
    price_id: int
    fuel_type: str
    price_per_liter: Decimal
    date_updated: date
    time_updated: time
    status: str

    model_config = {"from_attributes": True}


class StationBase(BaseModel):
    name: str
    brand: Optional[str] = None
    address: str
    barangay: Optional[str] = None
    city: str = "Taguig City"
    latitude: Decimal
    longitude: Decimal
    contact_info: Optional[str] = None
    status: str = "active"


class StationCreate(StationBase):
    pass


class StationUpdate(StationBase):
    pass


class StationOut(StationBase):
    station_id: int
    fuel_prices: list[FuelPriceOut] = []
    distance_km: Optional[float] = None

    model_config = {"from_attributes": True}
