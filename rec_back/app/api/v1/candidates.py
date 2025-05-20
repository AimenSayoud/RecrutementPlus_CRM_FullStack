from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
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
    cv_samples = load_data("cv_samples.json")
    
    # Create skill lookup
    skill_lookup = {skill["id"]: skill["name"] for skill in skills_data}
    
    # Create CV content lookup
    cv_lookup = {sample["candidate_user_id"]: sample["content"] for sample in cv_samples}
    
    # Associate user data with candidate profiles
    enhanced_candidates = []
    for candidate in candidates:
        user = next((u for u in users if u["id"] == candidate["user_id"]), None)
        if user:
            # Get current job from experience if available
            current_job = next((exp for exp in candidate.get("experience", []) if exp.get("current", False)), {})
            
            # Get education details
            education = candidate.get("education", [{}])[0] if candidate.get("education") else {}
            
            # Format for frontend schema
            enhanced_candidate = {
                "id": str(candidate["id"]),
                "firstName": user["first_name"],
                "lastName": user["last_name"],
                "email": user["email"],
                "phone": candidate.get("phone", ""),
                "position": current_job.get("title", "Unknown Position"),
                "company": current_job.get("company", ""),
                "status": "available",  # Default status
                "cvUrl": candidate.get("cv_urls", [""])[0] if candidate.get("cv_urls") else None,
                "cvContent": cv_lookup.get(candidate["user_id"], ""),
                "education": {
                    "institution": education.get("institution", ""),
                    "degree": education.get("degree", ""),
                    "fieldOfStudy": education.get("field_of_study", ""),
                    "graduationYear": education.get("end_date", "").split("-")[0] if education.get("end_date") else ""
                },
                "location": candidate.get("location", ""),
                "createdAt": datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else datetime.now(),
                "updatedAt": datetime.fromisoformat(user["updated_at"]) if isinstance(user["updated_at"], str) else datetime.now(),
                "skills": [skill_lookup.get(skill_id, f"Skill-{skill_id}") for skill_id in candidate.get("skill_ids", [])],
                "tags": [{"id": str(i), "name": skill_lookup.get(skill_id, f"Skill-{skill_id}"), "color": f"#{hash(skill_lookup.get(skill_id, f'Skill-{skill_id}')) % 0xFFFFFF:06x}"} 
                         for i, skill_id in enumerate(candidate.get("skill_ids", []))],
                "experiences": [
                    {
                        "id": str(exp.get("id", i)),
                        "position": exp.get("title", ""),
                        "company": exp.get("company", ""),
                        "startDate": exp.get("start_date", ""),
                        "endDate": exp.get("end_date", None),
                        "description": exp.get("description", ""),
                        "current": exp.get("current", False)
                    }
                    for i, exp in enumerate(candidate.get("experience", []))
                ],
                "preferences": {
                    "desiredSectors": candidate.get("preferences", {}).get("desired_sectors", []),
                    "desiredLocations": candidate.get("preferences", {}).get("desired_locations", []),
                    "contractTypes": candidate.get("preferences", {}).get("contract_types", []),
                    "salaryExpectation": candidate.get("preferences", {}).get("salary_expectation", 0),
                    "willingToRelocate": candidate.get("preferences", {}).get("willing_to_relocate", False)
                },
                "rating": len(candidate.get("skill_ids", [])) % 5 + 1,  # Mock rating based on skills
                "assignedTo": f"user-{(candidate['id'] % 3) + 1}",  # Mock assignment
                "officeId": str((candidate["id"] % 3) + 1)  # Mock office assignment
            }
            enhanced_candidates.append(enhanced_candidate)
    
    return enhanced_candidates

@router.get("/")
async def get_candidates(
    office_id: Optional[str] = None,
    skill: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all candidates, optionally filtered by various parameters"""
    candidates = get_all_data()
    
    # Filter by office if provided
    if office_id:
        candidates = [c for c in candidates if c["officeId"] == office_id]
    
    # Filter by skill if provided
    if skill:
        candidates = [c for c in candidates if skill.lower() in [s.lower() for s in c["skills"]]]
    
    # Filter by status if provided
    if status:
        candidates = [c for c in candidates if c["status"].lower() == status.lower()]
    
    # Filter by search term if provided
    if search:
        search_lower = search.lower()
        candidates = [c for c in candidates if 
                    search_lower in c["firstName"].lower() or 
                    search_lower in c["lastName"].lower() or 
                    search_lower in c["position"].lower() or
                    search_lower in c["company"].lower() or
                    any(search_lower in skill.lower() for skill in c["skills"])]
    
    # Get total count before pagination
    total_count = len(candidates)
    
    # Apply pagination
    candidates = candidates[skip:skip + limit]
    
    return {
        "items": candidates,
        "totalCount": total_count,
        "page": skip // limit + 1 if limit > 0 else 1,
        "pageSize": limit,
        "pageCount": (total_count + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/{candidate_id}")
async def get_candidate(candidate_id: str):
    """Get a specific candidate by ID"""
    candidates = get_all_data()
    candidate = next((c for c in candidates if c["id"] == candidate_id), None)
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return candidate

@router.post("/")
async def create_candidate(candidate: Dict[str, Any]):
    """Create a new candidate (mock implementation)"""
    # In a real implementation, we would save to the database
    # For this mock API, we'll just return the candidate with an ID
    candidate["id"] = f"new-{datetime.now().timestamp()}"
    candidate["createdAt"] = datetime.now()
    candidate["updatedAt"] = datetime.now()
    
    # Generate other missing fields as needed
    if "skills" not in candidate:
        candidate["skills"] = []
    if "tags" not in candidate:
        candidate["tags"] = []
    
    return candidate

@router.put("/{candidate_id}")
async def update_candidate(candidate_id: str, candidate: Dict[str, Any]):
    """Update a candidate (mock implementation)"""
    candidates = get_all_data()
    existing = next((c for c in candidates if c["id"] == candidate_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # In a real implementation, we would update the database
    # For this mock API, we'll just return the updated candidate
    updated = {**existing, **candidate, "updatedAt": datetime.now()}
    return updated

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