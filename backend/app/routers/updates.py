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
    valid_groups = [g for g in wanted if g in FORECAST_FUELS]
    if not valid_groups:
        return []
    rows = (
        db.query(MarketForecast)
        .filter(MarketForecast.fuel_type.in_(valid_groups))
        .order_by(MarketForecast.effective_date.desc(), MarketForecast.forecast_id.desc())
        .all()
    )
    latest_by_group: dict[str, MarketForecast] = {}
    for r in rows:
        if r.fuel_type not in latest_by_group:
            latest_by_group[r.fuel_type] = r
    return [forecast_to_dict(latest_by_group[g]) for g in valid_groups if g in latest_by_group]


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
    if not wanted:
        return []

    all_snapshots = (
        db.query(FuelPriceSnapshot)
        .filter(FuelPriceSnapshot.fuel_type.in_(wanted))
        .order_by(FuelPriceSnapshot.week_start.asc())
        .all()
    )
    by_fuel: dict[str, list[FuelPriceSnapshot]] = {ft: [] for ft in wanted}
    for r in all_snapshots:
        by_fuel.setdefault(r.fuel_type, []).append(r)

    out = []
    for ft in wanted:
        ft_rows = by_fuel.get(ft, [])
        series_rows = [r for r in ft_rows if r.week_start >= first_week]
        series = [{"week_start": str(r.week_start), "avg_price": float(r.avg_price)} for r in series_rows]
        current = live[ft][0] if ft in live else (series[-1]["avg_price"] if series else None)
        station_count = live[ft][1] if ft in live else 0

        prev_rows = [r for r in ft_rows if r.week_start < this_week]
        prev_row = prev_rows[-1] if prev_rows else None
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

