from sqlalchemy import (
    Column, Integer, String, Numeric, Date, DateTime, Text, ForeignKey, UniqueConstraint, func,
)
from app.db.session import Base


class FuelPriceSnapshot(Base):
    """Weekly average pump price per fuel type (one row per week_start + fuel_type). Feeds the trend sparklines."""
    __tablename__ = "fuel_price_snapshots"
    __table_args__ = (UniqueConstraint("week_start", "fuel_type", name="uq_snapshot_week_fuel"),)

    snapshot_id = Column(Integer, primary_key=True, index=True)
    week_start = Column(Date, nullable=False, index=True)          # Monday of the week
    fuel_type = Column(String(30), nullable=False)                 # "Unleaded 91" | "Premium 95" | "Diesel"
    avg_price = Column(Numeric(6, 2), nullable=False)
    station_count = Column(Integer, nullable=False, default=0)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MarketForecast(Base):
    """Next-week price outlook for a fuel group. The latest row per fuel_type is shown to users."""
    __tablename__ = "market_forecasts"

    forecast_id = Column(Integer, primary_key=True, index=True)
    fuel_type = Column(String(30), nullable=False, index=True)     # "Gasoline" | "Diesel" | "Kerosene"
    change_per_liter = Column(Numeric(6, 2), nullable=False)       # + increase / - decrease (PHP per liter)
    effective_date = Column(Date, nullable=False)                  # start of the week the outlook applies to
    source = Column(String(150), nullable=False, default="Fuel Finder")
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class EnergyAdvisory(Base):
    """Official energy advisory (DOE, etc.), listed newest first on the Updates page."""
    __tablename__ = "energy_advisories"

    advisory_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)                   # e.g. "DOE"
    source_url = Column(String(500))
    published_date = Column(Date, nullable=False, index=True)
    fuel_type = Column(String(30), nullable=False, default="All")  # "All" | "Unleaded 91" | "Premium 95" | "Diesel" | "Kerosene"
    created_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

