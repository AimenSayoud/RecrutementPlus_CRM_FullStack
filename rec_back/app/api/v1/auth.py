from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from typing import Optional

from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    verify_token
)
from app.core.auth import get_current_user, get_current_active_user, require_admin, require_super_admin
from app.db.session import get_db
from app.models.user import User, UserRole, OfficeId
from app.schemas.auth import (
    LoginRequest, 
    RegisterRequest, 
    RefreshTokenRequest,
    LoginResponse, 
    RefreshResponse, 
    UserResponse, 
    TokenResponse,
    AuthStatusResponse
)
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate user and return JWT tokens."""
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    token_data = {"sub": user.id, "email": user.email, "role": user.role.value}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return LoginResponse(
        user=UserResponse.from_orm(user),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    )

@router.post("/register", response_model=UserResponse)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == register_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        id=str(uuid.uuid4()),
        email=register_data.email,
        name=register_data.name,
        hashed_password=get_password_hash(register_data.password),
        role=register_data.role,
        office_id=register_data.office_id,
        is_active=True,
        is_verified=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse.from_orm(user)

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token."""
    payload = verify_token(refresh_data.refresh_token, "refresh")
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new access token
    token_data = {"sub": user.id, "email": user.email, "role": user.role.value}
    access_token = create_access_token(data=token_data)
    
    return RefreshResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information."""
    return UserResponse.from_orm(current_user)

@router.get("/status", response_model=AuthStatusResponse)
async def auth_status(
    current_user: Optional[User] = Depends(get_current_user)
):
    """Check authentication status."""
    if current_user:
        return AuthStatusResponse(
            is_authenticated=True,
            user=UserResponse.from_orm(current_user)
        )
    else:
        return AuthStatusResponse(is_authenticated=False)

@router.post("/logout")
async def logout():
    """Logout user (client should discard tokens)."""
    return {"message": "Successfully logged out"}

# Demo endpoints for testing role-based access
@router.get("/admin-only")
async def admin_only_endpoint(
    current_user: User = Depends(require_admin)
):
    """Admin-only endpoint for testing."""
    return {"message": f"Hello admin {current_user.name}!", "role": current_user.role}

@router.get("/super-admin-only") 
async def super_admin_only_endpoint(
    current_user: User = Depends(require_super_admin)
):
    """Super admin-only endpoint for testing."""
    return {"message": f"Hello super admin {current_user.name}!", "role": current_user.role}