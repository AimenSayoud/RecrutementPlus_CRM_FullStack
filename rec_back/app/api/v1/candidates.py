from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import json
from pathlib import Path
import os
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

# Load related data
def get_all_data():
    candidates = load_data("candidate_profiles.json")
    users = load_data("users.json")
    skills_data = load_data("skills.json")
    
    # Create skill lookup
    skill_lookup = {skill["id"]: skill["name"] for skill in skills_data}
    
    # Associate user data with candidate profiles
    enhanced_candidates = []
    for candidate in candidates:
        user = next((u for u in users if u["id"] == candidate["user_id"]), None)
        if user:
            # Format for frontend schema
            enhanced_candidate = {
                "id": str(candidate["id"]),
                "firstName": user["first_name"],
                "lastName": user["last_name"],
                "email": user["email"],
                "phone": candidate.get("phone", ""),
                "position": candidate.get("experience", [{}])[0].get("title", "Unknown Position") if candidate.get("experience") else "Unknown Position",
                "status": "new",  # Default status
                "cvUrl": candidate.get("cv_urls", [""])[0] if candidate.get("cv_urls") else None,
                "createdAt": datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else datetime.now(),
                "updatedAt": datetime.fromisoformat(user["updated_at"]) if isinstance(user["updated_at"], str) else datetime.now(),
                "tags": [skill_lookup.get(skill_id, f"Skill-{skill_id}") for skill_id in candidate.get("skill_ids", [])],
                "rating": len(candidate.get("skill_ids", [])) % 5 + 1,  # Mock rating based on skills
                "assignedTo": f"user-{(candidate['id'] % 3) + 1}",  # Mock assignment
                "officeId": str((candidate["id"] % 3) + 1)  # Mock office assignment
            }
            enhanced_candidates.append(enhanced_candidate)
    
    return enhanced_candidates

@router.get("/")
async def get_candidates(
    office_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all candidates, optionally filtered by office ID"""
    candidates = get_all_data()
    
    # Filter by office if provided
    if office_id:
        candidates = [c for c in candidates if c["officeId"] == office_id]
    
    # Apply pagination
    candidates = candidates[skip:skip + limit]
    
    return candidates

@router.get("/{candidate_id}")
async def get_candidate(candidate_id: str):
    """Get a specific candidate by ID"""
    candidates = get_all_data()
    candidate = next((c for c in candidates if c["id"] == candidate_id), None)
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return candidate

@router.post("/")
async def create_candidate(candidate: dict):
    """Create a new candidate (mock implementation)"""
    # In a real implementation, we would save to the database
    # For this mock API, we'll just return the candidate with an ID
    candidate["id"] = f"cand-new-{datetime.now().timestamp()}"
    return candidate

@router.put("/{candidate_id}")
async def update_candidate(candidate_id: str, candidate: dict):
    """Update a candidate (mock implementation)"""
    candidates = get_all_data()
    existing = next((c for c in candidates if c["id"] == candidate_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # In a real implementation, we would update the database
    # For this mock API, we'll just return the updated candidate
    return {**existing, **candidate, "updatedAt": datetime.now()}

@router.delete("/{candidate_id}")
async def delete_candidate(candidate_id: str):
    """Delete a candidate (mock implementation)"""
    candidates = get_all_data()
    existing = next((c for c in candidates if c["id"] == candidate_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # In a real implementation, we would remove from the database
    # For this mock API, we'll just return success
    return {"success": True, "message": f"Candidate {candidate_id} deleted"}