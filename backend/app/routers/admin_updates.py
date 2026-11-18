"""Admin-only management of market forecasts, energy advisories and submitted feedback."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.feedback import Feedback
from app.models.price import FuelPrice
from app.models.station import GasStation
from app.models.updates import EnergyAdvisory, MarketForecast
from app.models.user import User
from app.routers.updates import advisory_to_dict, forecast_to_dict
from app.schemas.updates import (
    FEEDBACK_STATUSES,
    AdvisoryCreate,
    AdvisoryUpdate,
    FeedbackCategory,
    FeedbackStatus,
    FeedbackStatusUpdate,
    ForecastCreate,
    ForecastUpdate,
)

router = APIRouter(prefix="/api/admin", tags=["admin-updates"])


# ── Forecasts ─────────────────────────────────────────────────────────────────

@router.get("/forecasts")
def list_forecasts(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(MarketForecast).order_by(MarketForecast.effective_date.desc(), MarketForecast.forecast_id.desc()).all()
    return [forecast_to_dict(f) for f in rows]


@router.post("/forecasts", status_code=201)
def create_forecast(payload: ForecastCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    f = MarketForecast(**payload.model_dump(), created_by=admin.user_id)
    db.add(f)
    db.commit()
    db.refresh(f)
    return forecast_to_dict(f)


@router.put("/forecasts/{forecast_id}")
def update_forecast(forecast_id: int, payload: ForecastUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    f = db.query(MarketForecast).filter(MarketForecast.forecast_id == forecast_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Forecast not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(f, key, value)
    db.commit()
    db.refresh(f)
    return forecast_to_dict(f)


@router.delete("/forecasts/{forecast_id}")
def delete_forecast(forecast_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    f = db.query(MarketForecast).filter(MarketForecast.forecast_id == forecast_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Forecast not found")
    db.delete(f)
    db.commit()
    return {"message": "Forecast deleted"}


# ── Advisories ────────────────────────────────────────────────────────────────

@router.get("/advisories")
def list_advisories(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(EnergyAdvisory).order_by(EnergyAdvisory.published_date.desc(), EnergyAdvisory.advisory_id.desc()).all()
    return [advisory_to_dict(a) for a in rows]


@router.post("/advisories", status_code=201)
def create_advisory(payload: AdvisoryCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    a = EnergyAdvisory(**payload.model_dump(), created_by=admin.user_id)
    db.add(a)
    db.commit()
    db.refresh(a)
    return advisory_to_dict(a)


@router.put("/advisories/{advisory_id}")
def update_advisory(advisory_id: int, payload: AdvisoryUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    a = db.query(EnergyAdvisory).filter(EnergyAdvisory.advisory_id == advisory_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Advisory not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(a, key, value)
    db.commit()
    db.refresh(a)
    return advisory_to_dict(a)


@router.delete("/advisories/{advisory_id}")
def delete_advisory(advisory_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    a = db.query(EnergyAdvisory).filter(EnergyAdvisory.advisory_id == advisory_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Advisory not found")
    db.delete(a)
    db.commit()
    return {"message": "Advisory deleted"}


# ── Feedback inbox ────────────────────────────────────────────────────────────

def _feedback_to_dict(f: Feedback, station: Optional[GasStation], user: Optional[User], current_price) -> dict:
    return {
        "feedback_id": f.feedback_id,
        "user_id": f.user_id,
        "user_full_name": user.full_name if user else None,
        "name": f.name,
        "email": f.email,
        "category": f.category,
        "message": f.message,
        "station_id": f.station_id,
        "station_name": station.name if station else None,
        "station_brand": station.brand if station else None,
        "fuel_type": f.fuel_type,
        "reported_price": float(f.reported_price) if f.reported_price is not None else None,
        # Current listed price for the reported station + fuel, so admins can compare at a glance
        "current_price": float(current_price) if current_price is not None else None,
        "status": f.status or "new",
        "created_at": f.created_at.isoformat() if f.created_at else None,
    }


def _serialize_feedback(db: Session, rows: list[Feedback]) -> list[dict]:
    station_ids = {f.station_id for f in rows if f.station_id}
    user_ids = {f.user_id for f in rows if f.user_id}
    stations = (
        {s.station_id: s for s in db.query(GasStation).filter(GasStation.station_id.in_(station_ids))}
        if station_ids else {}
    )
    users = {u.user_id: u for u in db.query(User).filter(User.user_id.in_(user_ids))} if user_ids else {}
    prices = {}
    if station_ids:
        for p in db.query(FuelPrice).filter(FuelPrice.station_id.in_(station_ids), FuelPrice.status == "active"):
            prices[(p.station_id, p.fuel_type)] = p.price_per_liter
    return [
        _feedback_to_dict(f, stations.get(f.station_id), users.get(f.user_id), prices.get((f.station_id, f.fuel_type)))
        for f in rows
    ]


def _feedback_counts(db: Session) -> dict:
    counts = dict(db.query(Feedback.status, func.count(Feedback.feedback_id)).group_by(Feedback.status).all())
    by_status = {s: int(counts.get(s, 0)) for s in FEEDBACK_STATUSES}
    by_status["new"] += int(counts.get(None, 0))
    return {"total": sum(by_status.values()), **by_status}


@router.get("/feedback/summary")
def feedback_summary(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Counts per status — powers the 'new feedback' badge in the admin menu."""
    return _feedback_counts(db)


@router.get("/feedback")
def list_feedback(
    category: Optional[FeedbackCategory] = Query(None),
    status: Optional[FeedbackStatus] = Query(None),
    q: Optional[str] = Query(None, max_length=100, description="Search message, name or email"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    query = db.query(Feedback)
    if category:
        query = query.filter(Feedback.category == category)
    if status:
        query = query.filter(Feedback.status == status)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(Feedback.message.ilike(term), Feedback.name.ilike(term), Feedback.email.ilike(term)))
    rows = query.order_by(Feedback.created_at.desc(), Feedback.feedback_id.desc()).limit(limit).all()
    return _serialize_feedback(db, rows)


@router.patch("/feedback/{feedback_id}")
def update_feedback_status(
    feedback_id: int,
    payload: FeedbackStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    f = db.query(Feedback).filter(Feedback.feedback_id == feedback_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Feedback not found")
    f.status = payload.status
    db.commit()
    db.refresh(f)
    return _serialize_feedback(db, [f])[0]


@router.delete("/feedback/{feedback_id}")
def delete_feedback(feedback_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    f = db.query(Feedback).filter(Feedback.feedback_id == feedback_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(f)
    db.commit()
    return {"message": "Feedback deleted"}

