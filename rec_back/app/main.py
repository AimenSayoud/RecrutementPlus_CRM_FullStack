from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Create API tools module if it doesn't exist
try:
    from app.api.v1 import ai_tools
    has_ai_tools = True
except ImportError:
    print("Warning: AI tools module not found, creating api/v1/ai_tools.py")
    has_ai_tools = False

# Create API endpoints modules
from app.api.v1 import candidates, companies, jobs, users, skills

app = FastAPI(
    title="RecrutementPlus API",
    description="CRM API for Recruitment",
    version="0.1.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
if has_ai_tools:
    app.include_router(ai_tools.router, prefix="/api/v1/ai-tools", tags=["ai-tools"])

# Include data endpoints
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["candidates"])
app.include_router(companies.router, prefix="/api/v1/companies", tags=["companies"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(skills.router, prefix="/api/v1/skills", tags=["skills"])

@app.get("/")
async def root():
    return {"message": "Welcome to RecrutementPlus CRM API"}