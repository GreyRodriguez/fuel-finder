from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.updates import EnergyAdvisory, FuelPriceSnapshot, MarketForecast
from app.services.trends import (
    FORECAST_FUELS, PUMP_FUEL_TYPES, forecast_group, normalize_fuel_type,
    record_weekly_snapshot, week_start,
)

router = APIRouter(prefix="/api/updates", tags=["updates"])


def forecast_to_dict(f: MarketForecast) -> dict:
    change = float(f.change_per_liter)
    return {
        "forecast_id": f.forecast_id,
        "fuel_type": f.fuel_type,
        "change_per_liter": change,
        "direction": "up" if change > 0 else "down" if change < 0 else "flat",
        "effective_date": str(f.effective_date),
        "source": f.source,
        "notes": f.notes,
        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
    }


def advisory_to_dict(a: EnergyAdvisory) -> dict:
    return {
        "advisory_id": a.advisory_id,
        "title": a.title,
        "summary": a.summary,
        "source": a.source,
        "source_url": a.source_url,
        "published_date": str(a.published_date),
        "fuel_type": a.fuel_type,
    }


@router.get("/forecasts")
def get_forecasts(
    fuel_type: Optional[str] = Query(None, description="Unleaded 91 | Premium 95 | Diesel | Kerosene | Gasoline"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Latest next-week outlook for each of Gasoline, Diesel and Kerosene."""
    wanted = [forecast_group(fuel_type)] if fuel_type and fuel_type != "All" else FORECAST_FUELS
    results = []
    for group in wanted:
        if group not in FORECAST_FUELS:
            continue
        latest = (
            db.query(MarketForecast)
            .filter(MarketForecast.fuel_type == group)
            .order_by(MarketForecast.effective_date.desc(), MarketForecast.forecast_id.desc())
            .first()
        )
        if latest:
            results.append(forecast_to_dict(latest))
    return results


@router.get("/trends")
def get_trends(
    weeks: int = Query(8, ge=2, le=12),
    fuel_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Current average, change vs last week and a weekly series for Unleaded 91, Premium 95 and Diesel."""
    live = record_weekly_snapshot(db)  # keeps the current week's point fresh and builds history over time
    this_week = week_start()
    first_week = this_week - timedelta(days=7 * (weeks - 1))

    canon = normalize_fuel_type(fuel_type) if fuel_type and fuel_type != "All" else None
    wanted = [canon] if canon in PUMP_FUEL_TYPES else ([] if canon else PUMP_FUEL_TYPES)

    out = []
    for ft in wanted:
        series_rows = (
            db.query(FuelPriceSnapshot)
            .filter(FuelPriceSnapshot.fuel_type == ft, FuelPriceSnapshot.week_start >= first_week)
            .order_by(FuelPriceSnapshot.week_start.asc())
            .all()
        )
        series = [{"week_start": str(r.week_start), "avg_price": float(r.avg_price)} for r in series_rows]
        current = live[ft][0] if ft in live else (series[-1]["avg_price"] if series else None)
        station_count = live[ft][1] if ft in live else 0

        prev_row = (
            db.query(FuelPriceSnapshot)
            .filter(FuelPriceSnapshot.fuel_type == ft, FuelPriceSnapshot.week_start < this_week)
            .order_by(FuelPriceSnapshot.week_start.desc())
            .first()
        )
        previous = float(prev_row.avg_price) if prev_row else None
        change = round(current - previous, 2) if current is not None and previous is not None else None
        direction = None if change is None else "up" if change > 0 else "down" if change < 0 else "flat"

        out.append({
            "fuel_type": ft,
            "current_avg": current,
            "previous_avg": previous,
            "previous_week_start": str(prev_row.week_start) if prev_row else None,
            "change": change,
            "direction": direction,
            "station_count": station_count,
            "series": series,
        })
    return out


@router.get("/advisories")
def get_advisories(
    fuel_type: Optional[str] = Query(None),
    weeks: Optional[int] = Query(None, ge=1, le=520, description="Only advisories from the last N weeks"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Official advisories, newest first. A fuel filter also keeps advisories that apply to 'All' fuels."""
    q = db.query(EnergyAdvisory)
    if fuel_type and fuel_type != "All":
        canon = normalize_fuel_type(fuel_type) or fuel_type
        q = q.filter(EnergyAdvisory.fuel_type.in_(["All", canon]))
    if weeks:
        q = q.filter(EnergyAdvisory.published_date >= date.today() - timedelta(weeks=weeks))
    rows = q.order_by(EnergyAdvisory.published_date.desc(), EnergyAdvisory.advisory_id.desc()).limit(limit).all()
    return [advisory_to_dict(a) for a in rows]

