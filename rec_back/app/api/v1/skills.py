from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import json
from pathlib import Path

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

@router.get("/")
async def get_skills():
    """Get all skills"""
    skills = load_data("skills.json")
    
    # Convert to format expected by frontend
    formatted_skills = [
        {
            "id": str(skill["id"]),
            "name": skill["name"],
            "color": f"#{hash(skill['name']) % 0xFFFFFF:06x}"  # Generate consistent colors based on name
        }
        for skill in skills
    ]
    
    return formatted_skills

@router.get("/{skill_id}")
async def get_skill(skill_id: str):
    """Get a specific skill by ID"""
    skills = load_data("skills.json")
    skill = next((s for s in skills if str(s["id"]) == skill_id), None)
    
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    return {
        "id": str(skill["id"]),
        "name": skill["name"],
        "color": f"#{hash(skill['name']) % 0xFFFFFF:06x}"  # Generate consistent colors based on name
    }