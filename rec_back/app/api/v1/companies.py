from fastapi import APIRouter, HTTPException, Query, Body
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
    companies = load_data("company_profiles.json")
    employer_profiles = load_data("employer_profiles.json")
    users = load_data("users.json")
    jobs = load_data("jobs.json")
    
    # Combine company_profiles and employer_profiles
    all_companies = []
    
    # Process company profiles
    for company in companies:
        employer_user_id = company.get("user_id")
        user = next((u for u in users if u["id"] == employer_user_id), None)
        
        if user:
            # Calculate open positions
            open_jobs = 0
            job_ids = company.get("job_ids", [])
            company_jobs = []
            
            for job_id in job_ids:
                job = next((j for j in jobs if j["id"] == job_id), None)
                if job:
                    if job.get("status", "").lower() == "open":
                        open_jobs += 1
                    company_jobs.append(job)
            
            contact = company.get("contact_details", {})
            
            # Format for frontend schema
            enhanced_company = {
                "id": f"comp-{company['id']}",
                "name": company["company_name"],
                "industry": company["industry"],
                "size": company.get("size", "Unknown"),
                "website": company.get("website", ""),
                "logoUrl": company.get("logo_url", ""),
                "contactPerson": contact.get("name", ""),
                "contactTitle": contact.get("title", ""),
                "contactEmail": contact.get("email", ""),
                "contactPhone": contact.get("phone", ""),
                "address": company.get("location", ""),
                "description": company.get("description", ""),
                "createdAt": datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else datetime.now(),
                "updatedAt": datetime.fromisoformat(user["updated_at"]) if isinstance(user["updated_at"], str) else datetime.now(),
                "openPositions": open_jobs,
                "totalHires": len(company.get("recruitment_history", [])),
                "jobIds": job_ids,
                "jobs": format_jobs(company_jobs),
                "officeId": str((company["id"] % 3) + 1)  # Mock office assignment
            }
            all_companies.append(enhanced_company)
    
    # Process employer profiles (these are also companies)
    for employer in employer_profiles:
        # Check if this employer is already included from company_profiles
        if any(comp.get("id") == f"comp-{employer['id']}" for comp in all_companies):
            continue
            
        employer_user_id = employer.get("user_id")
        user = next((u for u in users if u["id"] == employer_user_id), None)
        
        if user:
            # Calculate open positions
            open_jobs = 0
            job_ids = employer.get("job_ids", [])
            employer_jobs = []
            
            for job_id in job_ids:
                job = next((j for j in jobs if j["id"] == job_id), None)
                if job:
                    if job.get("status", "").lower() == "open":
                        open_jobs += 1
                    employer_jobs.append(job)
            
            contact = employer.get("contact_details", {})
            
            # Format for frontend schema
            enhanced_company = {
                "id": f"comp-{employer['id']}",
                "name": employer["company_name"],
                "industry": employer["industry"],
                "size": employer.get("size", "Unknown"),
                "website": employer.get("website", ""),
                "logoUrl": employer.get("logo_url", ""),
                "contactPerson": contact.get("name", ""),
                "contactTitle": contact.get("title", ""),
                "contactEmail": contact.get("email", ""),
                "contactPhone": contact.get("phone", ""),
                "address": employer.get("location", ""),
                "description": employer.get("description", ""),
                "createdAt": datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else datetime.now(),
                "updatedAt": datetime.fromisoformat(user["updated_at"]) if isinstance(user["updated_at"], str) else datetime.now(),
                "openPositions": open_jobs,
                "totalHires": len(employer.get("recruitment_history", [])),
                "jobIds": job_ids,
                "jobs": format_jobs(employer_jobs),
                "officeId": str((employer["id"] % 3) + 1)  # Mock office assignment
            }
            all_companies.append(enhanced_company)
    
    return all_companies

def format_jobs(jobs):
    """Format job data for frontend display"""
    return [
        {
            "id": str(job["id"]),
            "title": job["title"],
            "status": job.get("status", "Open").lower(),
            "location": job.get("location", "Remote"),
            "contractType": job.get("contract_type", "Permanent"),
            "postingDate": job.get("posting_date", "")
        }
        for job in jobs
    ]

@router.get("/")
async def get_companies(
    office_id: Optional[str] = None,
    industry: Optional[str] = None,
    search: Optional[str] = None,
    has_open_positions: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all companies, optionally filtered by various parameters"""
    companies = get_all_data()
    
    # Filter by office if provided
    if office_id:
        companies = [c for c in companies if c["officeId"] == office_id]
    
    # Filter by industry if provided
    if industry:
        industry_lower = industry.lower()
        companies = [c for c in companies if industry_lower in c["industry"].lower()]
    
    # Filter by open positions
    if has_open_positions is not None:
        if has_open_positions:
            companies = [c for c in companies if c["openPositions"] > 0]
        else:
            companies = [c for c in companies if c["openPositions"] == 0]
    
    # Filter by search term if provided
    if search:
        search_lower = search.lower()
        companies = [c for c in companies if 
                   search_lower in c["name"].lower() or 
                   search_lower in c["industry"].lower() or 
                   search_lower in c["description"].lower() or
                   search_lower in c["address"].lower() or
                   search_lower in c["contactPerson"].lower()]
    
    # Get total count before pagination
    total_count = len(companies)
    
    # Apply pagination
    companies = companies[skip:skip + limit]
    
    return {
        "items": companies,
        "totalCount": total_count,
        "page": skip // limit + 1 if limit > 0 else 1,
        "pageSize": limit,
        "pageCount": (total_count + limit - 1) // limit if limit > 0 else 1
    }

@router.get("/{company_id}")
async def get_company(company_id: str):
    """Get a specific company by ID"""
    companies = get_all_data()
    company = next((c for c in companies if c["id"] == company_id), None)
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Get additional company details
    # In a real application, this would pull from database with more detailed info
    
    # Get related jobs with more detail
    jobs_data = load_data("jobs.json")
    skills_data = load_data("skills.json")
    job_ids = [int(job_id.replace("job-", "")) for job_id in company.get("jobIds", [])]
    
    # Create skill lookup
    skill_lookup = {skill["id"]: skill["name"] for skill in skills_data}
    
    # Get detailed jobs
    detailed_jobs = []
    for job_id in job_ids:
        job = next((j for j in jobs_data if j["id"] == job_id), None)
        if job:
            # Format skills
            job_skills = [{"id": str(skill_id), "name": skill_lookup.get(skill_id, f"Skill-{skill_id}")} 
                          for skill_id in job.get("skills", [])]
            
            detailed_job = {
                "id": str(job["id"]),
                "title": job["title"],
                "description": job["description"],
                "location": job.get("location", "Remote"),
                "contractType": job.get("contract_type", "Permanent"),
                "remoteOption": job.get("remote_option", False),
                "status": job.get("status", "Open").lower(),
                "postingDate": job.get("posting_date", ""),
                "skills": job_skills,
                "requirements": job.get("requirements", []),
                "responsibilities": job.get("responsibilities", [])
            }
            detailed_jobs.append(detailed_job)
    
    # Add detailed jobs to company
    company["detailedJobs"] = detailed_jobs
    
    # Add hire history
    company_id_raw = int(company_id.replace("comp-", ""))
    
    # First check in company_profiles
    companies_data = load_data("company_profiles.json")
    company_data = next((c for c in companies_data if c["id"] == company_id_raw), None)
    
    # If not found, check in employer_profiles
    if not company_data:
        employers_data = load_data("employer_profiles.json")
        company_data = next((e for e in employers_data if e["id"] == company_id_raw), None)
    
    # Add recruitment history
    if company_data and "recruitment_history" in company_data:
        company["recruitmentHistory"] = company_data["recruitment_history"]
    
    return company

@router.post("/")
async def create_company(company: Dict[str, Any] = Body(...)):
    """Create a new company (mock implementation)"""
    # In a real implementation, we would save to the database
    # For this mock API, we'll just return the company with an ID
    company["id"] = f"comp-new-{datetime.now().timestamp()}"
    company["createdAt"] = datetime.now()
    company["updatedAt"] = datetime.now()
    company["openPositions"] = 0
    company["totalHires"] = 0
    
    if "jobIds" not in company:
        company["jobIds"] = []
    if "jobs" not in company:
        company["jobs"] = []
    
    return company

@router.put("/{company_id}")
async def update_company(company_id: str, company: Dict[str, Any] = Body(...)):
    """Update a company (mock implementation)"""
    companies = get_all_data()
    existing = next((c for c in companies if c["id"] == company_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # In a real implementation, we would update the database
    # For this mock API, we'll just return the updated company
    updated = {**existing, **company, "updatedAt": datetime.now()}
    return updated

@router.delete("/{company_id}")
async def delete_company(company_id: str):
    """Delete a company (mock implementation)"""
    companies = get_all_data()
    existing = next((c for c in companies if c["id"] == company_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # In a real implementation, we would remove from the database
    # For this mock API, we'll just return success
    return {"success": True, "message": f"Company {company_id} deleted"}

@router.get("/{company_id}/jobs")
async def get_company_jobs(company_id: str):
    """Get all jobs for a specific company"""
    companies = get_all_data()
    company = next((c for c in companies if c["id"] == company_id), None)
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Get detailed jobs
    jobs_data = load_data("jobs.json")
    skills_data = load_data("skills.json")
    
    # Create skill lookup
    skill_lookup = {skill["id"]: skill["name"] for skill in skills_data}
    
    # Extract job IDs from company
    job_ids = []
    if "jobIds" in company:
        job_ids = company["jobIds"]
    
    # Convert string job IDs to integers
    job_ids = [int(job_id) if isinstance(job_id, str) and job_id.isdigit() else job_id for job_id in job_ids]
    
    # Get detailed jobs
    detailed_jobs = []
    for job_id in job_ids:
        job = next((j for j in jobs_data if j["id"] == job_id), None)
        if job:
            # Format skills
            job_skills = [{"id": str(skill_id), "name": skill_lookup.get(skill_id, f"Skill-{skill_id}")} 
                          for skill_id in job.get("skills", [])]
            
            detailed_job = {
                "id": str(job["id"]),
                "title": job["title"],
                "description": job["description"],
                "location": job.get("location", "Remote"),
                "contractType": job.get("contract_type", "Permanent"),
                "remoteOption": job.get("remote_option", False),
                "status": job.get("status", "Open").lower(),
                "postingDate": job.get("posting_date", ""),
                "skills": job_skills,
                "requirements": job.get("requirements", []),
                "responsibilities": job.get("responsibilities", [])
            }
            detailed_jobs.append(detailed_job)
    
    return {"jobs": detailed_jobs, "total": len(detailed_jobs)}