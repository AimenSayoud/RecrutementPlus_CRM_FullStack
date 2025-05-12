from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from datetime import datetime, timedelta

# Mock authentication for development
# In a real app, this would use JWT or similar

# Fake user database for demo
fake_users_db = {
    "user1": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "superadmin"
    }
}

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Mock User model
class User:
    def __init__(self, id, username, email, role):
        self.id = id
        self.username = username
        self.email = email
        self.role = role

# Get current user function
async def get_current_user(token: str = Depends(oauth2_scheme)):
    # In a real app, this would validate JWT tokens
    # For demo, just return a fake user
    user_data = fake_users_db.get("user1")
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return User(
        id=user_data["id"],
        username=user_data["username"],
        email=user_data["email"],
        role=user_data["role"]
    )

# Get current active user
async def get_current_active_user(current_user: User = Depends(get_current_user)):
    # In a real app, this would check if the user is active
    return current_user