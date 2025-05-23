from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from uuid import UUID
import logging
from passlib.context import CryptContext
from jose import JWTError, jwt

from app.models.user import User, UserRole
from app.models.candidate import CandidateProfile
from app.models.company import EmployerProfile
from app.models.consultant import ConsultantProfile
from app.models.admin import AdminProfile, SuperAdminProfile
from app.schemas.auth import (
    RegisterRequest, LoginRequest, UserResponse, 
    TokenResponse, LoginResponse
)
from app.crud.base import CRUDBase
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.services.base import BaseService

logger = logging.getLogger(__name__)

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for handling authentication and authorization"""
    
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS
    
    def register_user(
        self, 
        db: Session, 
        *, 
        register_data: RegisterRequest,
        auto_verify: bool = False
    ) -> Optional[User]:
        """
        Register a new user
        
        Args:
            db: Database session
            register_data: Registration data
            auto_verify: Whether to auto-verify the user
            
        Returns:
            Created user or None if email already exists
        """
        logger.info(f"Registering new user with email: {register_data.email}")
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == register_data.email).first()
        if existing_user:
            logger.warning(f"User with email {register_data.email} already exists")
            return None
        
        # Create new user
        user = User(
            email=register_data.email,
            password_hash=get_password_hash(register_data.password),
            first_name=register_data.first_name,
            last_name=register_data.last_name,
            role=register_data.role,
            is_active=True,
            is_verified=auto_verify,
            phone=register_data.phone
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create role-specific profile
        self._create_role_profile(db, user)
        
        logger.info(f"Successfully registered user with id: {user.id}")
        return user
    
    def authenticate_user(
        self, 
        db: Session, 
        *, 
        email: str, 
        password: str
    ) -> Optional[User]:
        """
        Authenticate a user by email and password
        
        Args:
            db: Database session
            email: User email
            password: User password
            
        Returns:
            Authenticated user or None if authentication fails
        """
        logger.debug(f"Authenticating user with email: {email}")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning(f"User with email {email} not found")
            return None
        
        if not verify_password(password, user.password_hash):
            logger.warning(f"Invalid password for user {email}")
            return None
        
        if not user.is_active:
            logger.warning(f"Inactive user {email} attempted to login")
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        logger.info(f"Successfully authenticated user {email}")
        return user
    
    def create_access_token(
        self, 
        subject: str, 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create a JWT access token
        
        Args:
            subject: Token subject (usually user ID)
            expires_delta: Optional expiration time
            
        Returns:
            JWT token string
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(
        self, 
        subject: str, 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create a JWT refresh token
        
        Args:
            subject: Token subject (usually user ID)
            expires_delta: Optional expiration time
            
        Returns:
            JWT token string
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        
        to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str, token_type: str = "access") -> Optional[str]:
        """
        Verify a JWT token
        
        Args:
            token: JWT token string
            token_type: Type of token (access or refresh)
            
        Returns:
            Token subject (user ID) if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            if payload.get("type") != token_type:
                return None
            return payload.get("sub")
        except JWTError:
            return None
    
    def login(self, db: Session, *, login_data: LoginRequest) -> Optional[LoginResponse]:
        """
        Login a user
        
        Args:
            db: Database session
            login_data: Login credentials
            
        Returns:
            Login response with user and tokens
        """
        user = self.authenticate_user(db, email=login_data.email, password=login_data.password)
        if not user:
            return None
        
        # Create tokens
        access_token = self.create_access_token(subject=user.id)
        refresh_token = self.create_refresh_token(subject=user.id)
        
        # Create response
        user_response = UserResponse.from_orm(user)
        token_response = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=self.access_token_expire_minutes * 60
        )
        
        return LoginResponse(user=user_response, tokens=token_response)
    
    def refresh_access_token(
        self, 
        db: Session, 
        *, 
        refresh_token: str
    ) -> Optional[TokenResponse]:
        """
        Refresh an access token using a refresh token
        
        Args:
            db: Database session
            refresh_token: Refresh token
            
        Returns:
            New token response or None if refresh token is invalid
        """
        user_id = self.verify_token(refresh_token, token_type="refresh")
        if not user_id:
            return None
        
        # Verify user still exists and is active
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            return None
        
        # Create new access token
        access_token = self.create_access_token(subject=user_id)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,  # Return same refresh token
            token_type="bearer",
            expires_in=self.access_token_expire_minutes * 60
        )
    
    def get_current_user(self, db: Session, *, token: str) -> Optional[User]:
        """
        Get current user from access token
        
        Args:
            db: Database session
            token: Access token
            
        Returns:
            Current user or None if token is invalid
        """
        user_id = self.verify_token(token, token_type="access")
        if not user_id:
            return None
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            return None
        
        return user
    
    def change_password(
        self, 
        db: Session, 
        *, 
        user_id: UUID, 
        current_password: str, 
        new_password: str
    ) -> bool:
        """
        Change user password
        
        Args:
            db: Database session
            user_id: User ID
            current_password: Current password
            new_password: New password
            
        Returns:
            True if password changed successfully, False otherwise
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        if not verify_password(current_password, user.password_hash):
            logger.warning(f"Invalid current password for user {user_id}")
            return False
        
        user.password_hash = get_password_hash(new_password)
        db.commit()
        
        logger.info(f"Password changed for user {user_id}")
        return True
    
    def reset_password(
        self, 
        db: Session, 
        *, 
        email: str, 
        new_password: str, 
        reset_token: str
    ) -> bool:
        """
        Reset user password with reset token
        
        Args:
            db: Database session
            email: User email
            new_password: New password
            reset_token: Password reset token
            
        Returns:
            True if password reset successfully, False otherwise
        """
        # Verify reset token
        token_email = self.verify_token(reset_token, token_type="reset")
        if not token_email or token_email != email:
            return False
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return False
        
        user.password_hash = get_password_hash(new_password)
        db.commit()
        
        logger.info(f"Password reset for user {email}")
        return True
    
    def create_password_reset_token(self, email: str) -> str:
        """
        Create a password reset token
        
        Args:
            email: User email
            
        Returns:
            Password reset token
        """
        expire = datetime.utcnow() + timedelta(hours=24)
        to_encode = {"exp": expire, "sub": email, "type": "reset"}
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_email(self, db: Session, *, user_id: UUID, verification_token: str) -> bool:
        """
        Verify user email
        
        Args:
            db: Database session
            user_id: User ID
            verification_token: Email verification token
            
        Returns:
            True if email verified successfully, False otherwise
        """
        token_user_id = self.verify_token(verification_token, token_type="verification")
        if not token_user_id or token_user_id != str(user_id):
            return False
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.is_verified = True
        db.commit()
        
        logger.info(f"Email verified for user {user_id}")
        return True
    
    def create_email_verification_token(self, user_id: UUID) -> str:
        """
        Create an email verification token
        
        Args:
            user_id: User ID
            
        Returns:
            Email verification token
        """
        expire = datetime.utcnow() + timedelta(days=7)
        to_encode = {"exp": expire, "sub": str(user_id), "type": "verification"}
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def _create_role_profile(self, db: Session, user: User):
        """
        Create role-specific profile for user
        
        Args:
            db: Database session
            user: User instance
        """
        if user.role == UserRole.CANDIDATE:
            profile = CandidateProfile(user_id=user.id)
            db.add(profile)
        elif user.role == UserRole.EMPLOYER:
            # Employer profile needs company association, so skip for now
            pass
        elif user.role == UserRole.CONSULTANT:
            profile = ConsultantProfile(user_id=user.id)
            db.add(profile)
        elif user.role == UserRole.ADMIN:
            profile = AdminProfile(user_id=user.id)
            db.add(profile)
        elif user.role == UserRole.SUPERADMIN:
            profile = SuperAdminProfile(user_id=user.id)
            db.add(profile)
        
        db.commit()
    
    def check_permissions(
        self, 
        user: User, 
        required_roles: Optional[List[UserRole]] = None,
        required_permissions: Optional[List[str]] = None
    ) -> bool:
        """
        Check if user has required roles or permissions
        
        Args:
            user: User instance
            required_roles: List of required roles
            required_permissions: List of required permissions
            
        Returns:
            True if user has required roles/permissions, False otherwise
        """
        # Check roles
        if required_roles and user.role not in required_roles:
            return False
        
        # Check permissions (for admin users)
        if required_permissions and user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            # This would need to check against admin profile permissions
            # Simplified for now
            pass
        
        return True


# Create service instance
auth_service = AuthService()