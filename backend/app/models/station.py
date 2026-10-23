from sqlalchemy import Column, Integer, String, Numeric, DateTime, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class GasStation(Base):
    __tablename__ = "gas_stations"

    station_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    brand = Column(String(100))
    address = Column(String, nullable=False)
    barangay = Column(String(100))
    city = Column(String(100), nullable=False, default="Taguig City")
    latitude = Column(Numeric(10, 7), nullable=False)
    longitude = Column(Numeric(10, 7), nullable=False)
    contact_info = Column(String(100))
    status = Column(String(10), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    fuel_prices = relationship("FuelPrice", back_populates="station", cascade="all, delete-orphan")
