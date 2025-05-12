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
    companies = load_data("company_profiles.json")
    users = load_data("users.json")
    jobs = load_data("jobs.json")
    
    # Create a dictionary of jobs for quick lookup
    job_lookup = {job["id"]: job for job in jobs}
    
    # Create a dictionary of users for quick lookup
    user_lookup = {user["id"]: user for user in users}
    
    # Associate user and job data with company profiles
    enhanced_companies = []
    for company in companies:
        employer_user_id = company.get("user_id")
        user = user_lookup.get(employer_user_id)
        
        if user:
            # Calculate open positions
            open_positions = 0
            job_ids = company.get("job_ids", [])
            for job_id in job_ids:
                job = job_lookup.get(job_id)
                if job and job.get("status", "") == "open":
                    open_positions += 1
            
            # Format for frontend schema
            enhanced_company = {
                "id": f"comp-{company['id']}",
                "name": company["company_name"],
                "industry": company["industry"],
                "website": company.get("website", ""),
                "contactPerson": company["contact_details"]["name"],
                "contactEmail": company["contact_details"]["email"],
                "contactPhone": company["contact_details"].get("phone", ""),
                "address": company.get("location", ""),
                "notes": company.get("description", ""),
                "createdAt": datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else datetime.now(),
                "updatedAt": datetime.fromisoformat(user["updated_at"]) if isinstance(user["updated_at"], str) else datetime.now(),
                "openPositions": open_positions,
                "officeId": str((company["id"] % 3) + 1)  # Mock office assignment
            }
            enhanced_companies.append(enhanced_company)
    
    return enhanced_companies

@router.get("/")
async def get_companies(
    office_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all companies, optionally filtered by office ID"""
    companies = get_all_data()
    
    # Filter by office if provided
    if office_id:
        companies = [c for c in companies if c["officeId"] == office_id]
    
    # Apply pagination
    companies = companies[skip:skip + limit]
    
    return companies

@router.get("/{company_id}")
async def get_company(company_id: str):
    """Get a specific company by ID"""
    companies = get_all_data()
    company = next((c for c in companies if c["id"] == company_id), None)
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return company

@router.post("/")
async def create_company(company: dict):
    """Create a new company (mock implementation)"""
    # In a real implementation, we would save to the database
    # For this mock API, we'll just return the company with an ID
    company["id"] = f"comp-new-{datetime.now().timestamp()}"
    return company

@router.put("/{company_id}")
async def update_company(company_id: str, company: dict):
    """Update a company (mock implementation)"""
    companies = get_all_data()
    existing = next((c for c in companies if c["id"] == company_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # In a real implementation, we would update the database
    # For this mock API, we'll just return the updated company
    return {**existing, **company, "updatedAt": datetime.now()}

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