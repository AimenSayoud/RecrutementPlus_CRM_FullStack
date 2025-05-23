from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.enums import UserRole, OfficeId

# Request schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Optional[UserRole] = UserRole.EMPLOYEE
    office_id: Optional[OfficeId] = OfficeId.OFFICE_1

# Response schemas
class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    office_id: OfficeId
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class LoginResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class AuthStatusResponse(BaseModel):
    is_authenticated: bool
    user: Optional[UserResponse] = None