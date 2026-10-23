from sqlalchemy import Column, Integer, String, DateTime, func
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String(10), nullable=False, default="user")   # "user" | "admin"
    status = Column(String(10), nullable=False, default="active")  # "active" | "inactive"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
