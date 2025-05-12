from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
import json
from pathlib import Path
from datetime import datetime
from pydantic import BaseModel

from app.api.v1.users import format_user, load_data
from app.core.auth import get_current_active_user, User

router = APIRouter()

# Available offices
AVAILABLE_OFFICES = ["Montreal", "Dubai", "Istanbul"]

# Schema for office data
class OfficeUpdate(BaseModel):
    office: str

class OfficeList(BaseModel):
    offices: List[str]

# Helper to get a superadmin by user ID
def get_superadmin_by_user_id(user_id):
    superadmins = load_data("superadmin_profiles.json")
    return next((a for a in superadmins if a["user_id"] == user_id), None)

@router.get("/offices", response_model=OfficeList)
def get_available_offices(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get a list of all available offices.
    """
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return {"offices": AVAILABLE_OFFICES}

@router.put("/update-office/{user_id}")
def update_superadmin_office(
    user_id: int,
    office_data: OfficeUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a user's office.
    """
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if office is valid
    if office_data.office not in AVAILABLE_OFFICES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid office. Available options are: {', '.join(AVAILABLE_OFFICES)}"
        )
    
    # Load users
    users = load_data("users.json")
    user = next((u for u in users if u["id"] == user_id), None)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # In a real app, we would update the database
    # For demo, we'll just return success
    return {
        "id": user_id,
        "office": office_data.office,
        "message": f"Office updated successfully to {office_data.office}"
    }