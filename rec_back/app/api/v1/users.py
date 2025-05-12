from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import json
from pathlib import Path
from datetime import datetime

router = APIRouter()

# Helper function to load data
def load_data(filename):
    try:
        file_path = Path(f"fake_data/{filename}")
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return []

# Format user data for frontend
def format_user(user):
    return {
        "id": str(user["id"]),
        "name": f"{user['first_name']} {user['last_name']}",
        "email": user["email"],
        "role": map_role(user["role"]),
        "officeId": str((user["id"] % 3) + 1),  # Mock office assignment
        "createdAt": datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else datetime.now(),
        "updatedAt": datetime.fromisoformat(user["updated_at"]) if isinstance(user["updated_at"], str) else datetime.now(),
        "lastLogin": datetime.fromisoformat(user["last_login"]) if isinstance(user.get("last_login", ""), str) else None
    }

# Map backend role to frontend role
def map_role(role):
    role_map = {
        "superadmin": "super_admin",
        "admin": "admin",
        "consultant": "employee",
        "employer": "employee"
    }
    return role_map.get(role, "employee")

@router.get("/")
async def get_users(
    office_id: Optional[str] = None,
    role: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all users, optionally filtered by office ID or role"""
    users = load_data("users.json")
    
    # Format for frontend
    formatted_users = [format_user(user) for user in users]
    
    # Apply filters
    if office_id:
        formatted_users = [u for u in formatted_users if u["officeId"] == office_id]
    
    if role:
        formatted_users = [u for u in formatted_users if u["role"] == role]
    
    # Apply pagination
    formatted_users = formatted_users[skip:skip + limit]
    
    return formatted_users

@router.get("/{user_id}")
async def get_user(user_id: str):
    """Get a specific user by ID"""
    users = load_data("users.json")
    user = next((u for u in users if str(u["id"]) == user_id), None)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return format_user(user)

@router.post("/login")
async def login(login_data: dict):
    """Mock login endpoint"""
    users = load_data("users.json")
    
    user = next((u for u in users if u["email"] == login_data.get("email")), None)
    
    if not user or login_data.get("password") != "password":  # Simple mock for demo
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "user": format_user(user),
        "token": f"mock-token-{user['id']}-{datetime.now().timestamp()}"
    }