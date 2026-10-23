from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserOut(BaseModel):
    user_id: int
    full_name: str
    email: EmailStr
    role: str
    status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_new_password: str


class AdminUserUpdate(BaseModel):
    status: Optional[str] = None
    role: Optional[str] = None
    full_name: Optional[str] = None
