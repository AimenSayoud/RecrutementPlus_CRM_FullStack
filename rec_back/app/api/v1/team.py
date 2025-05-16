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

# Load team data
def get_all_team_members():
    team_members = load_data("team_profiles.json")
    
    # Format dates for frontend
    for member in team_members:
        if "joined_date" in member:
            member["joinedDate"] = member.pop("joined_date")
        if "last_activity" in member:
            member["lastActivity"] = member.pop("last_activity")
        
        # Convert snake_case to camelCase for frontend compatibility
        if "office_id" in member:
            member["officeId"] = str(member.pop("office_id"))
        if "user_id" in member:
            member["userId"] = str(member.pop("user_id"))
        if "years_experience" in member:
            member["yearsExperience"] = member.pop("years_experience")
        if "performance_metrics" in member:
            metrics = member["performance_metrics"]
            camel_metrics = {}
            for key, value in metrics.items():
                camel_key = ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(key.split('_')))
                camel_metrics[camel_key] = value
            member["performanceMetrics"] = camel_metrics
            del member["performance_metrics"]
        
        # Add frontend required fields
        member["id"] = f"team-{member['id']}"
        member["createdAt"] = datetime.now().isoformat()
        member["updatedAt"] = datetime.now().isoformat()
    
    return team_members

@router.get("/")
async def get_team_members(
    office_id: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all team members, optionally filtered by office ID, type, or status"""
    team_members = get_all_team_members()
    
    # Filter by office if provided
    if office_id:
        team_members = [m for m in team_members if m.get("officeId") == office_id]
    
    # Filter by type if provided
    if type:
        team_members = [m for m in team_members if m.get("type") == type]
    
    # Filter by status if provided
    if status:
        team_members = [m for m in team_members if m.get("status") == status]
    
    # Apply pagination
    team_members = team_members[skip:skip + limit]
    
    return team_members

@router.get("/{member_id}")
async def get_team_member(member_id: str):
    """Get a specific team member by ID"""
    team_members = get_all_team_members()
    member = next((m for m in team_members if m["id"] == member_id), None)
    
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    return member

@router.get("/user/{user_id}")
async def get_team_member_by_user_id(user_id: str):
    """Get team member by user ID"""
    team_members = get_all_team_members()
    member = next((m for m in team_members if m.get("userId") == user_id), None)
    
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    return member

@router.post("/")
async def create_team_member(member: dict):
    """Create a new team member (mock implementation)"""
    member["id"] = f"team-new-{datetime.now().timestamp()}"
    member["createdAt"] = datetime.now().isoformat()
    member["updatedAt"] = datetime.now().isoformat()
    return member

@router.put("/{member_id}")
async def update_team_member(member_id: str, member: dict):
    """Update a team member (mock implementation)"""
    team_members = get_all_team_members()
    existing = next((m for m in team_members if m["id"] == member_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    member["updatedAt"] = datetime.now().isoformat()
    return {**existing, **member}

@router.delete("/{member_id}")
async def delete_team_member(member_id: str):
    """Delete a team member (mock implementation)"""
    team_members = get_all_team_members()
    existing = next((m for m in team_members if m["id"] == member_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    return {"success": True, "message": f"Team member {member_id} deleted"}