"""Fuel type naming + weekly price-trend helpers shared by the API and the seed/update scripts."""
from datetime import date, timedelta
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.price import FuelPrice
from app.models.station import GasStation
from app.models.updates import FuelPriceSnapshot

# Canonical pump-price fuel types shown in the UI
UNLEADED = "Unleaded 91"
PREMIUM = "Premium 95"
DIESEL = "Diesel"
KEROSENE = "Kerosene"
PUMP_FUEL_TYPES = [UNLEADED, PREMIUM, DIESEL]

# Forecast groups (the market is quoted as Gasoline / Diesel / Kerosene)
FORECAST_FUELS = ["Gasoline", "Diesel", "Kerosene"]

# The stations table has historically stored both naming schemes ("Gasoline" vs "Unleaded 91"), so normalise both.
_ALIASES = {
    "gasoline": UNLEADED, "unleaded 91": UNLEADED, "unleaded": UNLEADED, "u91": UNLEADED, "regular": UNLEADED,
    "premium gasoline": PREMIUM, "premium 95": PREMIUM, "premium": PREMIUM, "p95": PREMIUM,
    "diesel": DIESEL,
    "kerosene": KEROSENE,
}


def normalize_fuel_type(raw: Optional[str]) -> Optional[str]:
    return _ALIASES.get((raw or "").strip().lower())


def forecast_group(fuel_type: Optional[str]) -> Optional[str]:
    """Map a UI filter value (e.g. 'Premium 95') to the forecast group it belongs to ('Gasoline')."""
    canon = normalize_fuel_type(fuel_type) or (fuel_type if fuel_type in FORECAST_FUELS else None)
    if canon in (UNLEADED, PREMIUM, "Gasoline"):
        return "Gasoline"
    return canon


def week_start(d: Optional[date] = None) -> date:
    d = d or date.today()
    return d - timedelta(days=d.weekday())  # Monday


def live_averages(db: Session) -> dict[str, tuple[float, int]]:
    """Current average active price per canonical fuel type -> (avg, station_count).

    Uses at most one price per station per fuel type (the most recently updated one), so a station that has
    both a legacy "Gasoline" row and a newer "Unleaded 91" row is not counted twice.
    """
    rows = (
        db.query(FuelPrice)
        .join(GasStation, GasStation.station_id == FuelPrice.station_id)
        .filter(FuelPrice.status == "active", GasStation.status == "active")
        .all()
    )
    latest: dict[tuple[int, str], FuelPrice] = {}
    for p in rows:
        canon = normalize_fuel_type(p.fuel_type)
        if canon not in PUMP_FUEL_TYPES:
            continue
        key = (p.station_id, canon)
        cur = latest.get(key)
        if cur is None or (p.date_updated, p.time_updated, p.price_id) > (cur.date_updated, cur.time_updated, cur.price_id):
            latest[key] = p

    buckets: dict[str, list[float]] = {}
    for (_, canon), p in latest.items():
        buckets.setdefault(canon, []).append(float(p.price_per_liter))
    return {ft: (round(sum(v) / len(v), 2), len(v)) for ft, v in buckets.items()}


def upsert_snapshot(db: Session, fuel_type: str, wk: date, avg: float, count: int) -> None:
    row = (
        db.query(FuelPriceSnapshot)
        .filter(FuelPriceSnapshot.week_start == wk, FuelPriceSnapshot.fuel_type == fuel_type)
        .first()
    )
    if row:
        row.avg_price = avg
        row.station_count = count
    else:
        db.add(FuelPriceSnapshot(week_start=wk, fuel_type=fuel_type, avg_price=avg, station_count=count))


def record_weekly_snapshot(db: Session) -> dict[str, tuple[float, int]]:
    """Store/refresh this week's average for every fuel type. Safe to call repeatedly."""
    live = live_averages(db)
    wk = week_start()
    try:
        for ft, (avg, count) in live.items():
            upsert_snapshot(db, ft, wk, avg, count)
        db.commit()
    except IntegrityError:  # concurrent request inserted the same row first
        db.rollback()
    return live

