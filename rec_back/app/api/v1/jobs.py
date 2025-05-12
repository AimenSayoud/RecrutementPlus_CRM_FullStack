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
    jobs_data = load_data("jobs.json")
    skills_data = load_data("skills.json")
    employers_data = load_data("employer_profiles.json")
    
    # Create skill lookup
    skill_lookup = {skill["id"]: skill["name"] for skill in skills_data}
    
    # Create employer lookup
    employer_lookup = {emp["id"]: emp for emp in employers_data}
    
    # Format jobs for frontend schema
    enhanced_jobs = []
    for job in jobs_data:
        employer = employer_lookup.get(job["employer_id"], {})
        company_name = employer.get("company_name", f"Company {job['employer_id']}")
        
        enhanced_job = {
            "id": str(job["id"]),
            "title": job["title"],
            "companyId": str(job["employer_id"]),
            "companyName": company_name,
            "description": job["description"],
            "requirements": job.get("requirements", []),
            "location": job.get("location", "Remote"),
            "salaryRange": f"{job.get('salary_range', {}).get('min', 0):,} - {job.get('salary_range', {}).get('max', 0):,}" if job.get("salary_range") else None,
            "status": job.get("status", "Open").lower(),
            "createdAt": datetime.strptime(job.get("posting_date", "2024-01-01"), "%Y-%m-%d") if isinstance(job.get("posting_date"), str) else datetime.now(),
            "updatedAt": datetime.now(),
            "deadline": datetime.strptime(job.get("deadline", "2024-12-31"), "%Y-%m-%d") if job.get("deadline") and isinstance(job.get("deadline"), str) else None,
            "officeId": str((job["id"] % 3) + 1),  # Mock office assignment
            "candidates": job.get("applications_count", len(job.get("applications", [])) if job.get("applications") else job["id"] % 10)  # Mock count
        }
        enhanced_jobs.append(enhanced_job)
    
    return enhanced_jobs

@router.get("/")
async def get_jobs(
    office_id: Optional[str] = None,
    company_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all jobs, optionally filtered by office ID or company ID"""
    jobs = get_all_data()
    
    # Apply filters
    if office_id:
        jobs = [j for j in jobs if j["officeId"] == office_id]
    
    if company_id:
        jobs = [j for j in jobs if j["companyId"] == company_id]
    
    # Apply pagination
    jobs = jobs[skip:skip + limit]
    
    return jobs

@router.get("/{job_id}")
async def get_job(job_id: str):
    """Get a specific job by ID"""
    jobs = get_all_data()
    job = next((j for j in jobs if j["id"] == job_id), None)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

@router.post("/")
async def create_job(job: dict):
    """Create a new job (mock implementation)"""
    # In a real implementation, we would save to the database
    # For this mock API, we'll just return the job with an ID
    job["id"] = f"job-new-{datetime.now().timestamp()}"
    return job

@router.put("/{job_id}")
async def update_job(job_id: str, job: dict):
    """Update a job (mock implementation)"""
    jobs = get_all_data()
    existing = next((j for j in jobs if j["id"] == job_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # In a real implementation, we would update the database
    # For this mock API, we'll just return the updated job
    return {**existing, **job, "updatedAt": datetime.now()}

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