from sqlalchemy import Column, Integer, String, Numeric, Date, Time, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class FuelPrice(Base):
    __tablename__ = "fuel_prices"

    price_id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("gas_stations.station_id", ondelete="CASCADE"), nullable=False)
    fuel_type = Column(String(30), nullable=False)  # "Gasoline" | "Diesel" | "Premium Gasoline"
    price_per_liter = Column(Numeric(6, 2), nullable=False)
    date_updated = Column(Date, server_default=func.current_date(), nullable=False)
    time_updated = Column(Time, server_default=func.current_time(), nullable=False)
    status = Column(String(10), nullable=False, default="active")
    updated_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    station = relationship("GasStation", back_populates="fuel_prices")
    admin = relationship("User", foreign_keys=[updated_by])
