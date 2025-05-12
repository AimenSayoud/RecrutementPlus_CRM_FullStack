from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from typing import List, Optional, Dict, Any
import json
from pathlib import Path
import os
from datetime import datetime
import logging

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper function to load data
def load_data(filename):
    try:
        file_path = Path(f"fake_data/{filename}")
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading {filename}: {e}")
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
        # Use enhanced OpenAI integration
        analysis = ai_service.analyze_cv_with_openai(cv_text)
        
        # Log the successful analysis
        logger.info(f"Successfully analyzed CV with {len(analysis.get('skills', []))} skills extracted")
        
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing CV: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing CV: {str(e)}")

@router.post("/match-jobs")
async def match_jobs(
    cv_analysis: Dict[str, Any] = Body(...),
    job_id: Optional[int] = None
):
    """Match CV against jobs with enhanced semantic matching"""
    try:
        # Use enhanced job matching
        matches = ai_service.match_jobs_with_openai(cv_analysis, job_id)
        
        # Log the successful matching
        logger.info(f"Successfully matched CV against {len(matches)} jobs")
        
        return matches
    except Exception as e:
        logger.error(f"Error matching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error matching jobs: {str(e)}")

@router.post("/generate-email")
async def generate_email(
    template_id: str = Body(...),
    context: Dict[str, Any] = Body(...)
):
    """Generate a personalized email based on template and context"""
    try:
        # Use enhanced email generation
        result = ai_service.generate_email_with_openai(template_id, context)
        
        # Log the successful email generation
        logger.info(f"Successfully generated email using template {template_id}")
        
        return result
    except Exception as e:
        logger.error(f"Error generating email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating email: {str(e)}")

@router.post("/generate-interview-questions")
async def generate_interview_questions(
    job_description: Dict[str, Any] = Body(...),
    candidate_info: Optional[Dict[str, Any]] = Body(None)
):
    """Generate interview questions based on job description and optional candidate info"""
    try:
        # Use interview questions generator
        questions = ai_service.generate_interview_questions(job_description, candidate_info)
        
        # Log the successful generation
        logger.info(f"Successfully generated {len(questions)} interview questions")
        
        return questions
    except Exception as e:
        logger.error(f"Error generating interview questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating interview questions: {str(e)}")

@router.post("/generate-job-description")
async def generate_job_description(
    position: str = Body(...),
    company_name: str = Body(...),
    industry: Optional[str] = Body(None),
    required_skills: Optional[List[str]] = Body(None)
):
    """Generate a comprehensive job description"""
    try:
        # Use job description generator
        job_description = ai_service.generate_job_description(
            position, company_name, industry, required_skills
        )
        
        # Log the successful generation
        logger.info(f"Successfully generated job description for {position} at {company_name}")
        
        return job_description
    except Exception as e:
        logger.error(f"Error generating job description: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating job description: {str(e)}")

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