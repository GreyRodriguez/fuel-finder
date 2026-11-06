from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, ForeignKey, func
from app.db.session import Base


class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(100))
    email = Column(String(150))
    category = Column(String(30), nullable=False)   # System Needs | Suggestion | Price Report | Other
    message = Column(Text, nullable=False)
    # Price Report extras
    station_id = Column(Integer, ForeignKey("gas_stations.station_id", ondelete="SET NULL"), nullable=True)
    fuel_type = Column(String(30))
    reported_price = Column(Numeric(6, 2))
    status = Column(String(15), nullable=False, default="new")  # new | reviewed | resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())

