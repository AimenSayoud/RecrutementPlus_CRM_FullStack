from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
import json
from pathlib import Path
import os
from datetime import datetime, timedelta

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
    jobs_data = load_data("jobs.json")
    skills_data = load_data("skills.json")
    employers_data = load_data("employer_profiles.json") 
    companies_data = load_data("company_profiles.json")
    applications_data = load_data("applications.json")
    
    # Create skill lookup
    skill_lookup = {skill["id"]: skill["name"] for skill in skills_data}
    
    # Create employer lookup from both employer_profiles and company_profiles
    employer_lookup = {emp["id"]: emp for emp in employers_data}
    
    # Add company profiles to employer lookup
    company_lookup = {comp["id"]: comp for comp in companies_data}
    
    # Format jobs for frontend schema
    enhanced_jobs = []
    for job in jobs_data:
        employer = employer_lookup.get(job["employer_id"], {})
        # If not in employer_profiles, try company_profiles
        if not employer:
            employer = company_lookup.get(job["employer_id"], {})
        
        company_name = employer.get("company_name", f"Company {job['employer_id']}")
        
        # Get application count
        job_applications = [app for app in applications_data if app.get("job_id") == job["id"]]
        application_count = len(job_applications)
        
        # Calculate deadline date (usually posting_date + 30 days if not specified)
        posting_date = datetime.strptime(job.get("posting_date", "2024-01-01"), "%Y-%m-%d") if job.get("posting_date") else datetime.now()
        if job.get("deadline"):
            deadline = datetime.strptime(job["deadline"], "%Y-%m-%d")
        else:
            deadline = posting_date + timedelta(days=30)
        
        # Format skills from skill IDs
        skill_list = []
        for skill_id in job.get("skills", []):
            skill_name = skill_lookup.get(skill_id, f"Skill-{skill_id}")
            skill_list.append({
                "id": str(skill_id),
                "name": skill_name,
                "color": f"#{hash(skill_name) % 0xFFFFFF:06x}"  # Generate consistent colors based on name
            })
        
        enhanced_job = {
            "id": str(job["id"]),
            "title": job["title"],
            "companyId": str(job["employer_id"]),
            "companyName": company_name,
            "description": job["description"],
            "responsibilities": job.get("responsibilities", []),
            "requirements": job.get("requirements", []),
            "location": job.get("location", "Remote"),
            "salaryRange": f"{job.get('salary_range', {}).get('min', 0):,} - {job.get('salary_range', {}).get('max', 0):,}" if job.get("salary_range") else None,
            "salary": {
                "min": job.get('salary_range', {}).get('min', 0),
                "max": job.get('salary_range', {}).get('max', 0)
            },
            "contractType": job.get("contract_type", "Permanent"),
            "remoteOption": job.get("remote_option", False),
            "status": job.get("status", "Open").lower(),
            "postedAt": posting_date,
            "createdAt": posting_date,
            "updatedAt": datetime.now(),
            "deadline": deadline,
            "officeId": str((job["id"] % 3) + 1),  # Mock office assignment
            "candidates": application_count,
            "skills": skill_list,
            "industry": employer.get("industry", "")
        }
        enhanced_jobs.append(enhanced_job)
    
    return enhanced_jobs

@router.get("/")
async def get_jobs(
    office_id: Optional[str] = None,
    company_id: Optional[str] = None,
    status: Optional[str] = None,
    skill: Optional[str] = None, 
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all jobs, optionally filtered by various parameters"""
    jobs = get_all_data()
    
    # Apply filters
    if office_id:
        jobs = [j for j in jobs if j["officeId"] == office_id]
    
    if company_id:
        jobs = [j for j in jobs if j["companyId"] == company_id]
    
    if status:
        jobs = [j for j in jobs if j["status"].lower() == status.lower()]
    
    if skill:
        skill_lower = skill.lower()
        jobs = [j for j in jobs if any(skill_lower == s["name"].lower() for s in j["skills"])]
    
    # Filter by search term if provided
    if search:
        search_lower = search.lower()
        jobs = [j for j in jobs if 
                search_lower in j["title"].lower() or 
                search_lower in j["companyName"].lower() or 
                search_lower in j["description"].lower() or
                search_lower in j["location"].lower() or
                any(search_lower in req.lower() for req in j["requirements"]) or
                any(search_lower in s["name"].lower() for s in j["skills"])]
    
    # Get total count before pagination
    total_count = len(jobs)
    
    # Apply pagination
    jobs = jobs[skip:skip + limit]
    
    return {
        "items": jobs,
        "totalCount": total_count,
        "page": skip // limit + 1 if limit > 0 else 1,
        "pageSize": limit,
        "pageCount": (total_count + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/{job_id}")
async def get_job(job_id: str):
    """Get a specific job by ID"""
    jobs = get_all_data()
    job = next((j for j in jobs if j["id"] == job_id), None)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

@router.post("/")
async def create_job(job: Dict[str, Any]):
    """Create a new job (mock implementation)"""
    # In a real implementation, we would save to the database
    # For this mock API, we'll just return the job with an ID
    job["id"] = f"new-{datetime.now().timestamp()}"
    job["createdAt"] = datetime.now()
    job["updatedAt"] = datetime.now()
    job["postedAt"] = datetime.now()
    
    # Generate other missing fields as needed
    if "skills" not in job:
        job["skills"] = []
    if "requirements" not in job:
        job["requirements"] = []
    if "responsibilities" not in job:
        job["responsibilities"] = []
    
    return job

@router.put("/{job_id}")
async def update_job(job_id: str, job: Dict[str, Any]):
    """Update a job (mock implementation)"""
    jobs = get_all_data()
    existing = next((j for j in jobs if j["id"] == job_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # In a real implementation, we would update the database
    # For this mock API, we'll just return the updated job
    updated = {**existing, **job, "updatedAt": datetime.now()}
    return updated

@router.delete("/{job_id}")
async def delete_job(job_id: str):
    """Delete a job (mock implementation)"""
    jobs = get_all_data()
    existing = next((j for j in jobs if j["id"] == job_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # In a real implementation, we would remove from the database
    # For this mock API, we'll just return success
    return {"success": True, "message": f"Job {job_id} deleted"}