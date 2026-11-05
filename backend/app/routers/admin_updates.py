"""Admin-only management of market forecasts, energy advisories and submitted feedback."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.models.feedback import Feedback
from app.models.updates import EnergyAdvisory, MarketForecast
from app.models.user import User
from app.routers.updates import advisory_to_dict, forecast_to_dict
from app.schemas.updates import AdvisoryCreate, AdvisoryUpdate, ForecastCreate, ForecastUpdate

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

@router.get("/feedback")
def list_feedback(
    category: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    q = db.query(Feedback)
    if category:
        q = q.filter(Feedback.category == category)
    rows = q.order_by(Feedback.created_at.desc()).limit(limit).all()
    return [
        {
            "feedback_id": f.feedback_id,
            "user_id": f.user_id,
            "name": f.name,
            "email": f.email,
            "category": f.category,
            "message": f.message,
            "station_id": f.station_id,
            "fuel_type": f.fuel_type,
            "reported_price": float(f.reported_price) if f.reported_price is not None else None,
            "status": f.status,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in rows
    ]

