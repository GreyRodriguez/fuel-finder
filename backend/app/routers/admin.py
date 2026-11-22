from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.station import GasStation
from app.models.price import FuelPrice
from app.models.user import User
from app.models.feedback import Feedback
from app.routers.stations import station_to_dict
from app.schemas.station import StationCreate, StationUpdate
from app.schemas.price import PriceCreate
from app.schemas.user import UserOut, AdminUserUpdate
from app.schemas.updates import FEEDBACK_STATUSES
from app.core.security import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Stations ──────────────────────────────────────────────────────────────────

def _admin_station_dict(s: GasStation) -> dict:
    data = station_to_dict(s)
    data["created_at"] = s.created_at.isoformat() if s.created_at else None
    return data


@router.get("/stations")
def list_stations(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(GasStation)
        .options(joinedload(GasStation.fuel_prices))
        .order_by(GasStation.name.asc())
        .all()
    )
    return [_admin_station_dict(s) for s in rows]


@router.post("/stations", status_code=201)
def create_station(payload: StationCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if payload.city != "Taguig City":
        raise HTTPException(status_code=400, detail="Only Taguig City stations are allowed")
    station = GasStation(**payload.model_dump())
    db.add(station)
    db.commit()
    db.refresh(station)
    return _admin_station_dict(station)


@router.put("/stations/{station_id}")
def update_station(station_id: int, payload: StationUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    station = db.query(GasStation).options(joinedload(GasStation.fuel_prices)).filter(GasStation.station_id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    updates = payload.model_dump(exclude_unset=True)
    if "city" in updates and updates["city"] != "Taguig City":
        raise HTTPException(status_code=400, detail="Only Taguig City stations are allowed")
    for key, value in updates.items():
        setattr(station, key, value)
    db.commit()
    db.refresh(station)
    return _admin_station_dict(station)


@router.delete("/stations/{station_id}")
def delete_station(station_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    station = db.query(GasStation).filter(GasStation.station_id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    db.delete(station)
    db.commit()
    return {"message": "Station deleted"}


# ── Fuel Prices ───────────────────────────────────────────────────────────────

@router.post("/prices", status_code=201)
def add_price(
    payload: PriceCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    station = db.query(GasStation).filter(GasStation.station_id == payload.station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    # Deactivate old price for same fuel type
    db.query(FuelPrice).filter(
        FuelPrice.station_id == payload.station_id,
        FuelPrice.fuel_type == payload.fuel_type,
        FuelPrice.status == "active",
    ).update({"status": "inactive"})

    now = datetime.now()
    price = FuelPrice(
        station_id=payload.station_id,
        fuel_type=payload.fuel_type,
        price_per_liter=payload.price_per_liter,
        date_updated=now.date(),
        time_updated=now.time().replace(microsecond=0),
        status="active",
        updated_by=admin.user_id,
    )
    db.add(price)
    db.commit()
    db.refresh(price)
    return price


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserOut])
def list_users(q: str = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    query = db.query(User)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(User.full_name.ilike(term) | User.email.ilike(term))
    return query.order_by(User.created_at.desc(), User.user_id.desc()).all()


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    updates = payload.model_dump(exclude_unset=True)
    if user_id == admin.user_id and updates.get("status") == "inactive":
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
    for key, value in updates.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


# ── Reports ───────────────────────────────────────────────────────────────────


def _station_ref(s: GasStation | None) -> dict | None:
    if s is None:
        return None
    return {"station_id": s.station_id, "name": s.name, "brand": s.brand, "barangay": s.barangay}


def _aware(dt: datetime) -> datetime:
    """Treat naive timestamps as UTC so they compare safely with aware ones."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@router.get("/reports")
def get_reports(
    days: int = Query(30, ge=1, le=365, description="Default reporting period in days when since is omitted"),
    since: date | None = Query(None, description="Optional start date (YYYY-MM-DD) for filtering metrics"),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Snapshot counts (used by the dashboard) plus period analytics for the Reports page."""
    today = date.today()
    if since is not None:
        since_date = since
        since_ts = datetime(since.year, since.month, since.day, tzinfo=timezone.utc)
        period_days = max(0, (today - since_date).days + 1)
    else:
        since_date = today - timedelta(days=days - 1)
        since_ts = datetime.now(timezone.utc) - timedelta(days=days)
        period_days = days

    stations = db.query(GasStation).all()
    total_stations = len(stations)
    active_stations = sum(1 for s in stations if s.status == "active")
    inactive_stations = total_stations - active_stations

    total_users = db.query(User).filter(User.role == "user").count()
    new_users = db.query(User).filter(User.role == "user", User.created_at >= since_ts).count()

    recent_prices_q = db.query(FuelPrice).options(joinedload(FuelPrice.station))
    if since is not None:
        recent_prices_q = recent_prices_q.filter(FuelPrice.date_updated >= since_date)
    recent_prices = (
        recent_prices_q
        .order_by(FuelPrice.date_updated.desc(), FuelPrice.time_updated.desc(), FuelPrice.price_id.desc())
        .limit(10)
        .all()
    )

    # ── Price updates in the period, per day (for the activity chart) ──
    period_prices = db.query(FuelPrice.date_updated).filter(FuelPrice.date_updated >= since_date).all()
    per_day = Counter(d for (d,) in period_prices)
    # Keep the chart readable: daily buckets up to 31 days, weekly buckets beyond that.
    activity = []
    if since_date <= today:
        if period_days <= 31:
            for i in range(period_days):
                d = since_date + timedelta(days=i)
                activity.append({"label": d.isoformat(), "count": per_day.get(d, 0)})
        else:
            start = since_date
            while start <= today:
                end = min(start + timedelta(days=6), today)
                count = sum(c for d, c in per_day.items() if start <= d <= end)
                activity.append({"label": start.isoformat(), "end": end.isoformat(), "count": count})
                start = end + timedelta(days=1)

    # ── Current pump prices per fuel type (active prices at active stations) ──
    active_prices_q = (
        db.query(FuelPrice)
        .options(joinedload(FuelPrice.station))
        .join(GasStation, FuelPrice.station_id == GasStation.station_id)
        .filter(FuelPrice.status == "active", GasStation.status == "active")
    )
    if since is not None:
        active_prices_q = active_prices_q.filter(FuelPrice.date_updated >= since_date)
    active_prices = active_prices_q.all()

    by_fuel: dict[str, list[FuelPrice]] = defaultdict(list)
    priced_station_ids = set()
    for p in active_prices:
        by_fuel[p.fuel_type].append(p)
        priced_station_ids.add(p.station_id)

    fuel_summary = []
    for fuel, rows in sorted(by_fuel.items()):
        values = [float(r.price_per_liter) for r in rows]
        cheapest = min(rows, key=lambda r: r.price_per_liter)
        priciest = max(rows, key=lambda r: r.price_per_liter)
        fuel_summary.append({
            "fuel_type": fuel,
            "stations": len(rows),
            "avg": round(sum(values) / len(values), 2),
            "min": float(cheapest.price_per_liter),
            "max": float(priciest.price_per_liter),
            "cheapest": _station_ref(cheapest.station),
            "priciest": _station_ref(priciest.station),
        })

    stations_without_prices = [
        _station_ref(s) for s in stations if s.status == "active" and s.station_id not in priced_station_ids
    ]

    brands = Counter((s.brand or "Unbranded") for s in stations)

    # ── Feedback ──
    all_fb_rows = db.query(Feedback.status, Feedback.category, Feedback.created_at).all()
    period_fb_rows = [r for r in all_fb_rows if r.created_at and _aware(r.created_at) >= since_ts]
    fb_scope = period_fb_rows if since is not None else all_fb_rows
    fb_status = Counter(r.status or "new" for r in fb_scope)
    fb_category = Counter(r.category for r in fb_scope)

    return {
        # Snapshot (kept for the admin dashboard)
        "total_stations": total_stations,
        "active_stations": active_stations,
        "inactive_stations": inactive_stations,
        "total_users": total_users,
        "recent_price_updates": [
            {
                "price_id": p.price_id,
                "station_name": p.station.name if p.station else "N/A",
                "fuel_type": p.fuel_type,
                "price_per_liter": float(p.price_per_liter),
                "status": p.status,
                "date_updated": str(p.date_updated),
                "time_updated": str(p.time_updated),
            }
            for p in recent_prices
        ],
        # Period analytics
        "period_days": period_days,
        "period_start": since_date.isoformat(),
        "filtered_since": since.isoformat() if since is not None else None,
        "new_users": new_users,
        "price_updates_in_period": len(period_prices),
        "price_activity": activity,
        "fuel_summary": fuel_summary,
        "stations_without_prices": stations_without_prices,
        "brands": [{"brand": b, "count": c} for b, c in brands.most_common()],
        "feedback": {
            "total": len(fb_scope),
            "in_period": len(period_fb_rows),
            "by_status": {s: fb_status.get(s, 0) for s in FEEDBACK_STATUSES},
            "by_category": [{"category": c, "count": n} for c, n in fb_category.most_common()],
        },
    }
