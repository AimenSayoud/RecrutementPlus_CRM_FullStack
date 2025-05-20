from fastapi import APIRouter, HTTPException, Query, Body, Depends
from typing import List, Optional, Dict, Any
import json
from pathlib import Path
from datetime import datetime
import random

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
def format_user(user, include_extended_info=False):
    # Basic user info
    formatted_user = {
        "id": str(user["id"]),
        "name": f"{user['first_name']} {user['last_name']}",
        "firstName": user["first_name"],
        "lastName": user["last_name"],
        "email": user["email"],
        "role": map_role(user["role"]),
        "officeId": str((user["id"] % 3) + 1),  # Mock office assignment
        "createdAt": datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else datetime.now(),
        "updatedAt": datetime.fromisoformat(user["updated_at"]) if isinstance(user["updated_at"], str) else datetime.now(),
        "lastLogin": datetime.fromisoformat(user["last_login"]) if isinstance(user.get("last_login", ""), str) else None,
        "isActive": user.get("is_active", True)
    }
    
    # If extended info is requested, include role-specific data
    if include_extended_info:
        # Get role-specific profile data
        if user["role"] == "admin":
            admin_profiles = load_data("admin_profiles.json")
            profile = next((p for p in admin_profiles if p["user_id"] == user["id"]), None)
            if profile:
                formatted_user["permissions"] = profile.get("permissions", [])
                formatted_user["activities"] = profile.get("activities", [])
                
        elif user["role"] == "consultant":
            consultant_profiles = load_data("consultant_profiles.json")
            profile = next((p for p in consultant_profiles if p["user_id"] == user["id"]), None)
            if profile:
                formatted_user["phone"] = profile.get("phone", "")
                formatted_user["specializations"] = profile.get("specializations", [])
                formatted_user["performance"] = profile.get("performance_metrics", {})
                
        elif user["role"] == "employer":
            employer_profiles = load_data("employer_profiles.json")
            company_profiles = load_data("company_profiles.json")
            
            # Try employer profiles first
            profile = next((p for p in employer_profiles if p["user_id"] == user["id"]), None)
            if not profile:
                # If not found, try company profiles
                profile = next((p for p in company_profiles if p["user_id"] == user["id"]), None)
                
            if profile:
                formatted_user["company"] = profile.get("company_name", "")
                formatted_user["phone"] = profile.get("contact_details", {}).get("phone", "")
                formatted_user["industry"] = profile.get("industry", "")
                
        elif user["role"] == "candidate":
            candidate_profiles = load_data("candidate_profiles.json")
            profile = next((p for p in candidate_profiles if p["user_id"] == user["id"]), None)
            if profile:
                formatted_user["phone"] = profile.get("phone", "")
                formatted_user["location"] = profile.get("location", "")
                formatted_user["skills"] = get_skill_names(profile.get("skill_ids", []))
                
        elif user["role"] == "superadmin":
            superadmin_profiles = load_data("superadmin_profiles.json")
            profile = next((p for p in superadmin_profiles if p["user_id"] == user["id"]), None)
            if profile:
                formatted_user["accessLevel"] = profile.get("system_access_level", "full")
                formatted_user["systemChanges"] = profile.get("system_changes", [])
    
    return formatted_user

# Map backend role to frontend role
def map_role(role):
    role_map = {
        "superadmin": "super_admin",
        "admin": "admin",
        "consultant": "employee",
        "employer": "client",
        "candidate": "candidate"
    }
    return role_map.get(role, "employee")

# Get skill names from skill IDs
def get_skill_names(skill_ids):
    skills_data = load_data("skills.json")
    skill_lookup = {skill["id"]: skill["name"] for skill in skills_data}
    return [skill_lookup.get(skill_id, f"Skill-{skill_id}") for skill_id in skill_ids]

@router.get("/")
async def get_users(
    office_id: Optional[str] = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
    active: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all users, optionally filtered by various parameters"""
    users = load_data("users.json")
    
    # Apply filters
    if role:
        # Map frontend role to backend role
        backend_role = None
        if role == "super_admin":
            backend_role = "superadmin"
        elif role == "admin":
            backend_role = "admin"
        elif role == "employee":
            backend_role = "consultant"
        elif role == "client":
            backend_role = "employer"
        elif role == "candidate":
            backend_role = "candidate"
            
        if backend_role:
            users = [u for u in users if u["role"] == backend_role]
    
    if active is not None:
        users = [u for u in users if u.get("is_active", True) == active]
    
    if search:
        search_lower = search.lower()
        users = [u for u in users if 
                search_lower in u["first_name"].lower() or 
                search_lower in u["last_name"].lower() or 
                search_lower in u["email"].lower()]
    
    # Format users for frontend
    formatted_users = [format_user(user) for user in users]
    
    # Filter by office if provided
    if office_id:
        formatted_users = [u for u in formatted_users if u["officeId"] == office_id]
    
    # Get total count before pagination
    total_count = len(formatted_users)
    
    # Apply pagination
    formatted_users = formatted_users[skip:skip + limit]
    
    return {
        "items": formatted_users,
        "totalCount": total_count,
        "page": skip // limit + 1 if limit > 0 else 1,
        "pageSize": limit,
        "pageCount": (total_count + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/{user_id}")
async def get_user(user_id: str):
    """Get a specific user by ID with extended profile information"""
    users = load_data("users.json")
    user = next((u for u in users if str(u["id"]) == user_id), None)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return format_user(user, include_extended_info=True)

@router.post("/login")
async def login(login_data: Dict[str, Any] = Body(...)):
    """Mock login endpoint"""
    users = load_data("users.json")
    
    user = next((u for u in users if u["email"] == login_data.get("email")), None)
    
    if not user or login_data.get("password") != "password":  # Simple mock for demo
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    # Update last login time (in a real app, we would save this to database)
    user["last_login"] = datetime.now().isoformat()
    
    # Generate mock token with user info
    token = f"mock-token-{user['id']}-{user['role']}-{datetime.now().timestamp()}"
    
    return {
        "user": format_user(user, include_extended_info=True),
        "token": token,
        "tokenExpiry": (datetime.now().timestamp() + 86400) * 1000  # 24 hours from now, in milliseconds
    }

@router.post("/")
async def create_user(user_data: Dict[str, Any] = Body(...)):
    """Create a new user (mock implementation)"""
    users = load_data("users.json")
    
    # Check if email already exists
    if any(u["email"] == user_data.get("email") for u in users):
        raise HTTPException(status_code=400, detail="Email already in use")
    
    # Generate a new user ID
    new_id = max([u["id"] for u in users], default=0) + 1
    
    # Create user
    now = datetime.now().isoformat()
    new_user = {
        "id": new_id,
        "email": user_data.get("email"),
        "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # Mock password hash
        "first_name": user_data.get("firstName"),
        "last_name": user_data.get("lastName"),
        "role": map_role_to_backend(user_data.get("role", "employee")),
        "is_active": user_data.get("isActive", True),
        "created_at": now,
        "updated_at": now,
    }
    
    return format_user(new_user)

@router.put("/{user_id}")
async def update_user(user_id: str, user_data: Dict[str, Any] = Body(...)):
    """Update a user (mock implementation)"""
    users = load_data("users.json")
    user = next((u for u in users if str(u["id"]) == user_id), None)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    if "firstName" in user_data:
        user["first_name"] = user_data["firstName"]
    if "lastName" in user_data:
        user["last_name"] = user_data["lastName"]
    if "email" in user_data:
        user["email"] = user_data["email"]
    if "role" in user_data:
        user["role"] = map_role_to_backend(user_data["role"])
    if "isActive" in user_data:
        user["is_active"] = user_data["isActive"]
    
    user["updated_at"] = datetime.now().isoformat()
    
    return format_user(user, include_extended_info=True)

@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Delete a user (mock implementation)"""
    users = load_data("users.json")
    user = next((u for u in users if str(u["id"]) == user_id), None)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # In a real implementation, we would remove from the database
    # For this mock API, we'll just return success
    return {"success": True, "message": f"User {user_id} deleted"}

# Helper function to map frontend role to backend role
def map_role_to_backend(frontend_role):
    role_map = {
        "super_admin": "superadmin",
        "admin": "admin",
        "employee": "consultant",
        "client": "employer",
        "candidate": "candidate"
    }
    return role_map.get(frontend_role, "consultant")