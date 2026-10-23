from datetime import date, time as time_type
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.station import GasStation
from app.models.price import FuelPrice
from app.models.user import User
from app.schemas.station import StationCreate, StationUpdate
from app.schemas.price import PriceCreate
from app.schemas.user import UserOut, AdminUserUpdate
from app.core.security import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Stations ──────────────────────────────────────────────────────────────────

@router.get("/stations")
def list_stations(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(GasStation).all()


@router.post("/stations", status_code=201)
def create_station(payload: StationCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if payload.city != "Taguig City":
        raise HTTPException(status_code=400, detail="Only Taguig City stations are allowed")
    station = GasStation(**payload.model_dump())
    db.add(station)
    db.commit()
    db.refresh(station)
    return station


@router.put("/stations/{station_id}")
def update_station(station_id: int, payload: StationUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    station = db.query(GasStation).filter(GasStation.station_id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(station, key, value)
    db.commit()
    db.refresh(station)
    return station


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

    price = FuelPrice(
        station_id=payload.station_id,
        fuel_type=payload.fuel_type,
        price_per_liter=payload.price_per_liter,
        date_updated=date.today(),
        time_updated=time_type(),
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
    if q:
        query = query.filter(User.full_name.ilike(f"%{q}%") | User.email.ilike(f"%{q}%"))
    return query.all()


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


# ── Reports ───────────────────────────────────────────────────────────────────

@router.get("/reports")
def get_reports(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_stations = db.query(GasStation).count()
    active_stations = db.query(GasStation).filter(GasStation.status == "active").count()
    inactive_stations = total_stations - active_stations
    total_users = db.query(User).filter(User.role == "user").count()
    recent_prices = db.query(FuelPrice).order_by(FuelPrice.date_updated.desc(), FuelPrice.time_updated.desc()).limit(10).all()

    return {
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
                "date_updated": str(p.date_updated),
                "time_updated": str(p.time_updated),
            }
            for p in recent_prices
        ],
    }
