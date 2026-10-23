import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.models.station import GasStation
from app.models.price import FuelPrice
from app.schemas.station import StationOut
from app.core.security import get_current_user

router = APIRouter(prefix="/api/stations", tags=["stations"])


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lng points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def station_to_dict(station: GasStation, distance_km: Optional[float] = None) -> dict:
    data = {
        "station_id": station.station_id,
        "name": station.name,
        "brand": station.brand,
        "address": station.address,
        "barangay": station.barangay,
        "city": station.city,
        "latitude": float(station.latitude),
        "longitude": float(station.longitude),
        "contact_info": station.contact_info,
        "status": station.status,
        "distance_km": round(distance_km, 2) if distance_km is not None else None,
        "fuel_prices": [
            {
                "price_id": p.price_id,
                "fuel_type": p.fuel_type,
                "price_per_liter": float(p.price_per_liter),
                "date_updated": str(p.date_updated),
                "time_updated": str(p.time_updated),
                "status": p.status,
            }
            for p in station.fuel_prices if p.status == "active"
        ],
    }
    return data


@router.get("/")
def get_stations(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius: float = Query(10.0),
    fuel_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(GasStation).filter(
        GasStation.city == "Taguig City",
        GasStation.status == "active",
    )
    stations = query.all()

    results = []
    for s in stations:
        dist = None
        if lat is not None and lng is not None:
            dist = haversine(lat, lng, float(s.latitude), float(s.longitude))
            if dist > radius:
                continue
        results.append(station_to_dict(s, dist))

    if lat is not None and lng is not None:
        results.sort(key=lambda x: x["distance_km"] or 9999)

    return results


@router.get("/search")
def search_stations(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    stations = db.query(GasStation).filter(
        GasStation.status == "active",
        GasStation.city == "Taguig City",
        (GasStation.name.ilike(f"%{q}%") | GasStation.address.ilike(f"%{q}%") | GasStation.brand.ilike(f"%{q}%")),
    ).all()
    return [station_to_dict(s) for s in stations]


@router.get("/compare")
def compare_stations(
    ids: str = Query(..., description="Comma-separated station IDs"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    id_list = [int(i) for i in ids.split(",") if i.strip().isdigit()]
    stations = db.query(GasStation).filter(GasStation.station_id.in_(id_list)).all()
    return [station_to_dict(s) for s in stations]


@router.get("/{station_id}")
def get_station(
    station_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    station = db.query(GasStation).filter(GasStation.station_id == station_id).first()
    if not station:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Station not found")
    return station_to_dict(station)
