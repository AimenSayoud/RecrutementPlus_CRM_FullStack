from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
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

# Initialize AI service with data
from app.services.ai_service import AIService
ai_service = AIService()

@router.post("/analyze-cv")
async def analyze_cv(
    cv_text: str = Body(...),
):
    """Analyze CV text and extract structured information"""
    try:
        # Use OpenAI if available, otherwise use rule-based approach
        analysis = ai_service.analyze_cv_with_openai(cv_text)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing CV: {str(e)}")

@router.post("/match-jobs")
async def match_jobs(
    cv_analysis: Dict[str, Any] = Body(...),
    job_id: Optional[int] = None
):
    """Match CV against jobs"""
    try:
        matches = ai_service.match_jobs_with_openai(cv_analysis, job_id)
        return matches
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error matching jobs: {str(e)}")

@router.post("/generate-email")
async def generate_email(
    template_id: str = Body(...),
    context: Dict[str, Any] = Body(...)
):
    """Generate a personalized email based on template and context"""
    try:
        result = ai_service.generate_email_with_openai(template_id, context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating email: {str(e)}")

@router.get("/email-templates")
async def get_email_templates():
    """Get available email templates"""
    templates = load_data("email_templates.json")
    
    # Format for frontend
    formatted_templates = [
        {
            "id": template["id"],
            "name": template["id"].replace("_", " ").title(),
            "subject": template["subject"],
            "description": f"Template for {template['id'].replace('_', ' ')}",
            "placeholders": extract_placeholders(template["template"])
        }
        for template in templates
    ]
    
    return formatted_templates

@router.get("/candidates/{candidate_id}/email-context")
async def get_candidate_email_context(candidate_id: str):
    """Get candidate data for email context"""
    # Load data
    candidates = load_data("candidate_profiles.json")
    users = load_data("users.json")
    skills_data = load_data("skills.json")
    
    # Find candidate
    candidate = next((c for c in candidates if str(c["id"]) == candidate_id), None)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Find user
    user = next((u for u in users if u["id"] == candidate["user_id"]), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create skill lookup
    skill_lookup = {skill["id"]: skill["name"] for skill in skills_data}
    skill_names = [skill_lookup.get(skill_id, f"Skill-{skill_id}") for skill_id in candidate.get("skill_ids", [])]
    
    # Create context
    context = {
        "candidate_id": str(candidate["id"]),
        "candidate_name": f"{user['first_name']} {user['last_name']}",
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "email": user["email"],
        "job_title": candidate.get("experience", [{}])[0].get("title", "the position") if candidate.get("experience") else "the position",
        "company_name": "Our Company",
        "skills": skill_names,
        "matching_skills": skill_names,
        "consultant_name": "Recruitment Consultant",
        "cv_analysis": "Professional with experience in " + ", ".join(skill_names)
    }
    
    return context

# Helper function to extract placeholders from template
def extract_placeholders(template: str) -> List[str]:
    import re
    pattern = r"{{([^}]+)}}"
    return list(set(re.findall(pattern, template)))