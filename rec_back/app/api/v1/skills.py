from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
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

# Helper function to generate consistent colors based on skill name
def generate_skill_color(skill_name):
    return f"#{hash(skill_name) % 0xFFFFFF:06x}"

@router.get("/")
async def get_skills(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all skills, optionally filtered by category or search term"""
    skills = load_data("skills.json")
    
    # Filter by category if provided (map similar categories)
    if category:
        category_lower = category.lower()
        # Simple mapping of skill categories (in a real app, this would be in the database)
        tech_categories = ["programming", "technical", "development", "software", "engineering"]
        design_categories = ["design", "ui", "ux", "graphic"]
        data_categories = ["data", "analytics", "ml", "ai", "machine learning"]
        business_categories = ["business", "management", "finance", "marketing"]
        
        if category_lower in tech_categories:
            skill_ids = list(range(1, 30)) + list(range(37, 45)) + [49, 50, 51, 59, 60, 61, 62]
            skills = [s for s in skills if s["id"] in skill_ids]
        elif category_lower in design_categories:
            skill_ids = list(range(45, 49)) + [15]
            skills = [s for s in skills if s["id"] in skill_ids]
        elif category_lower in data_categories:
            skill_ids = [12, 13, 14, 52, 53, 54, 55, 56, 57, 58, 66, 67, 68]
            skills = [s for s in skills if s["id"] in skill_ids]
        elif category_lower in business_categories:
            skill_ids = list(range(63, 66)) + [69, 70]
            skills = [s for s in skills if s["id"] in skill_ids]
    
    # Filter by search term if provided
    if search:
        search_lower = search.lower()
        skills = [s for s in skills if search_lower in s["name"].lower()]
    
    # Get total count before pagination
    total_count = len(skills)
    
    # Apply pagination
    skills = skills[skip:skip + limit]
    
    # Convert to format expected by frontend
    formatted_skills = [
        {
            "id": str(skill["id"]),
            "name": skill["name"],
            "color": generate_skill_color(skill["name"]),
            "category": get_skill_category(skill["id"], skill["name"]),
            "popularity": get_skill_popularity(skill["id"])
        }
        for skill in skills
    ]
    
    return {
        "items": formatted_skills,
        "totalCount": total_count,
        "page": skip // limit + 1 if limit > 0 else 1,
        "pageSize": limit,
        "pageCount": (total_count + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/{skill_id}")
async def get_skill(skill_id: str):
    """Get a specific skill by ID"""
    skills = load_data("skills.json")
    skill = next((s for s in skills if str(s["id"]) == skill_id), None)
    
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # Gather related data for the skill
    candidates = load_data("candidate_profiles.json")
    jobs = load_data("jobs.json")
    
    # Count candidates with this skill
    candidates_with_skill = [c for c in candidates if int(skill_id) in c.get("skill_ids", [])]
    candidate_count = len(candidates_with_skill)
    
    # Count jobs requiring this skill
    jobs_with_skill = [j for j in jobs if int(skill_id) in j.get("skills", [])]
    job_count = len(jobs_with_skill)
    
    return {
        "id": str(skill["id"]),
        "name": skill["name"],
        "color": generate_skill_color(skill["name"]),
        "category": get_skill_category(skill["id"], skill["name"]),
        "popularity": get_skill_popularity(skill["id"]),
        "candidateCount": candidate_count,
        "jobCount": job_count,
        "related_skills": get_related_skills(int(skill_id))
    }

@router.post("/")
async def create_skill(skill: Dict[str, Any]):
    """Create a new skill (mock implementation)"""
    skills = load_data("skills.json")
    
    # Generate new ID (max existing ID + 1)
    new_id = max([s["id"] for s in skills], default=0) + 1
    
    # Create new skill
    new_skill = {
        "id": str(new_id),
        "name": skill["name"],
        "color": skill.get("color", generate_skill_color(skill["name"])),
        "category": skill.get("category", "Other"),
        "popularity": 0
    }
    
    return new_skill

@router.put("/{skill_id}")
async def update_skill(skill_id: str, skill: Dict[str, Any]):
    """Update a skill (mock implementation)"""
    skills = load_data("skills.json")
    existing = next((s for s in skills if str(s["id"]) == skill_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # Update skill
    updated_skill = {
        "id": skill_id,
        "name": skill.get("name", existing["name"]),
        "color": skill.get("color", generate_skill_color(skill.get("name", existing["name"]))),
        "category": skill.get("category", get_skill_category(int(skill_id), skill.get("name", existing["name"]))),
        "popularity": get_skill_popularity(int(skill_id))
    }
    
    return updated_skill

@router.delete("/{skill_id}")
async def delete_skill(skill_id: str):
    """Delete a skill (mock implementation)"""
    skills = load_data("skills.json")
    existing = next((s for s in skills if str(s["id"]) == skill_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    # In a real implementation, we would remove from the database
    # For this mock API, we'll just return success
    return {"success": True, "message": f"Skill {skill_id} deleted"}

# Helper functions for skill metadata

def get_skill_category(skill_id, skill_name):
    """Determine the category of a skill based on its ID and name"""
    name_lower = skill_name.lower()
    
    # Programming languages
    if skill_id in [1, 2, 18, 19, 23, 27, 29, 30, 31, 32]:
        return "Programming Language"
    
    # Frameworks and libraries
    if skill_id in [3, 10, 13, 21, 22, 24, 28, 33, 34]:
        return "Framework"
    
    # Data
    if skill_id in [4, 25, 26, 52, 53, 54, 55, 66, 67, 68]:
        return "Data"
    
    # Design
    if skill_id in [45, 46, 47, 48]:
        return "Design"
    
    # DevOps
    if skill_id in [9, 11, 16, 17, 35, 36, 37, 38, 39, 40]:
        return "DevOps"
    
    # AI/ML
    if skill_id in [12, 56, 57, 58]:
        return "AI & Machine Learning"
    
    # Security
    if skill_id in [49, 50, 51]:
        return "Security"
    
    # Blockchain
    if skill_id in [59, 60]:
        return "Blockchain"
    
    # IoT & Embedded
    if skill_id in [61, 62]:
        return "IoT & Embedded"
    
    # Management
    if skill_id in [63, 64, 65, 69, 70]:
        return "Management & Soft Skills"
    
    # Marketing
    if skill_id in [5, 6, 7, 8]:
        return "Marketing"
    
    # Default
    return "Other"

def get_skill_popularity(skill_id):
    """Calculate the popularity of a skill based on its presence in candidates and jobs"""
    candidates = load_data("candidate_profiles.json")
    jobs = load_data("jobs.json")
    
    # Count candidates with this skill
    candidates_with_skill = [c for c in candidates if skill_id in c.get("skill_ids", [])]
    candidate_count = len(candidates_with_skill)
    
    # Count jobs requiring this skill
    jobs_with_skill = [j for j in jobs if skill_id in j.get("skills", [])]
    job_count = len(jobs_with_skill)
    
    # Calculate popularity (0-100 scale)
    total_candidates = len(candidates)
    total_jobs = len(jobs)
    
    if total_candidates == 0 or total_jobs == 0:
        return 0
    
    # Weighted score (70% jobs demand, 30% candidate supply)
    job_score = (job_count / total_jobs) * 100 * 0.7
    candidate_score = (candidate_count / total_candidates) * 100 * 0.3
    
    return min(round(job_score + candidate_score), 100)

def get_related_skills(skill_id):
    """Find related skills based on co-occurrence in candidates and jobs"""
    candidates = load_data("candidate_profiles.json")
    jobs = load_data("jobs.json")
    skills_data = load_data("skills.json")
    
    # Find candidates and jobs with this skill
    candidates_with_skill = [c for c in candidates if skill_id in c.get("skill_ids", [])]
    jobs_with_skill = [j for j in jobs if skill_id in j.get("skills", [])]
    
    # Collect all co-occurring skills
    related_skill_ids = {}
    
    # From candidates
    for candidate in candidates_with_skill:
        for s_id in candidate.get("skill_ids", []):
            if s_id != skill_id:
                related_skill_ids[s_id] = related_skill_ids.get(s_id, 0) + 1
    
    # From jobs
    for job in jobs_with_skill:
        for s_id in job.get("skills", []):
            if s_id != skill_id:
                related_skill_ids[s_id] = related_skill_ids.get(s_id, 0) + 2  # Jobs weighted higher
    
    # Sort by count and get top 5
    sorted_related = sorted(related_skill_ids.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Format results
    skill_lookup = {skill["id"]: skill["name"] for skill in skills_data}
    
    return [
        {
            "id": str(s_id),
            "name": skill_lookup.get(s_id, f"Skill-{s_id}"),
            "color": generate_skill_color(skill_lookup.get(s_id, f"Skill-{s_id}"))
        }
        for s_id, count in sorted_related
    ]