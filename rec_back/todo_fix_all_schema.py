# TODO: Run this script on the VPS to fix database schema issues in candidate_profiles table
# This script will:
# TODO: 1. Check for missing columns in candidate_profiles table 
# TODO: 2. Add any missing columns required by the model definition
# TODO: 3. Create test candidate profiles for testing
# TODO: 4. Update profile visibility and completion status for existing profiles

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123@localhost:5432/recruitment_plus")
print(f"Using database URL: {DB_URL}")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

# TODO: These are all fields from the model that should exist in the database
# If any of these columns are missing, they will be added to the table
required_fields = [
    "cover_letter_url VARCHAR(500)",
    "linkedin_url VARCHAR(500)",
    "github_url VARCHAR(500)",
    "portfolio_url VARCHAR(500)",
    "languages JSONB",
    "certifications JSONB",
    "awards JSONB",
    "publications JSONB",
    "notes TEXT",
    "nationality VARCHAR(100)",
    "address VARCHAR(500)",
    "postal_code VARCHAR(20)",
    "profile_visibility VARCHAR(20) NOT NULL DEFAULT 'public'",
    "is_open_to_opportunities BOOLEAN NOT NULL DEFAULT TRUE"
]

# TODO: Create a simple candidate directly using SQL (to avoid ORM issues)
insert_candidate_sql = """
INSERT INTO candidate_profiles 
(id, user_id, current_position, current_company, summary, years_of_experience, location, city, 
country, profile_completed, willing_to_relocate, created_at, updated_at)
VALUES 
(:id, :user_id, :position, :company, :summary, :years, :location, :city, 
:country, :completed, :relocate, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING
"""

try:
    # TODO: Check existing columns
    result = db.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = 'candidate_profiles'"
    ))
    existing_columns = [row[0] for row in result]
    print(f"Existing columns: {existing_columns}")
    
    # TODO: Add missing fields
    for field_def in required_fields:
        field_name = field_def.split()[0].lower()
        if field_name not in existing_columns:
            sql = f"ALTER TABLE candidate_profiles ADD COLUMN {field_def}"
            print(f"Adding missing field: {field_name}")
            db.execute(text(sql))
    
    db.commit()
    print("Schema updated successfully")
    
    # TODO: Get all candidate users
    result = db.execute(text(
        "SELECT id, email, first_name, last_name FROM users WHERE role = 'CANDIDATE'"
    ))
    candidate_users = result.fetchall()
    print(f"Found {len(candidate_users)} candidate users")
    
    # TODO: Check for existing candidate profiles
    result = db.execute(text("SELECT COUNT(*) FROM candidate_profiles"))
    existing_count = result.scalar()
    print(f"Found {existing_count} existing candidate profiles")
    
    # TODO: Insert a profile for each candidate user if they don't have one
    profiles_added = 0
    for user in candidate_users:
        user_id = user[0]
        
        # Check if profile exists
        result = db.execute(text(
            "SELECT COUNT(*) FROM candidate_profiles WHERE user_id = :user_id"
        ), {"user_id": user_id})
        has_profile = result.scalar() > 0
        
        if not has_profile:
            # Create basic profile
            profile_id = os.urandom(16).hex()
            params = {
                "id": profile_id,
                "user_id": user_id,
                "position": f"{user[2]}'s Position",
                "company": "Example Company",
                "summary": f"Profile summary for {user[2]} {user[3]}",
                "years": 2,
                "location": "New York, USA",
                "city": "New York",
                "country": "USA",
                "completed": True,
                "relocate": True
            }
            
            db.execute(text(insert_candidate_sql), params)
            profiles_added += 1
            print(f"Added profile for {user[1]}")
    
    if profiles_added > 0:
        db.commit()
        print(f"Added {profiles_added} new candidate profiles")
    
    # TODO: Insert one test candidate using SQL
    # First add a test user if they don't exist
    test_email = "testcandidate@example.com"
    result = db.execute(text(
        "SELECT id FROM users WHERE email = :email"
    ), {"email": test_email})
    test_user_id = result.scalar()
    
    if not test_user_id:
        test_user_id = os.urandom(16).hex()
        db.execute(text("""
            INSERT INTO users 
            (id, email, password_hash, first_name, last_name, role, is_active, is_verified, created_at, updated_at)
            VALUES 
            (:id, :email, '$2b$12$CwrF0Ymm2O3oT97vV3BuHesNoJG3zZrByfqgQtsr8Qb1w4EupRluy', 'Test', 'Candidate', 'CANDIDATE', true, true, NOW(), NOW())
        """), {"id": test_user_id, "email": test_email})
        db.commit()
        print(f"Created test user {test_email} with ID {test_user_id}")
    
    # Then add a profile for this user
    result = db.execute(text(
        "SELECT COUNT(*) FROM candidate_profiles WHERE user_id = :user_id"
    ), {"user_id": test_user_id})
    has_profile = result.scalar() > 0
    
    if not has_profile:
        profile_id = os.urandom(16).hex()
        params = {
            "id": profile_id,
            "user_id": test_user_id,
            "position": "Full Stack Developer",
            "company": "Tech Innovations",
            "summary": "Experienced developer with expertise in multiple programming languages.",
            "years": 5,
            "location": "San Francisco, USA",
            "city": "San Francisco",
            "country": "USA",
            "completed": True,
            "relocate": True
        }
        
        db.execute(text(insert_candidate_sql), params)
        db.commit()
        print(f"Added profile for test candidate {test_email}")
    
    # TODO: Final count
    result = db.execute(text("SELECT COUNT(*) FROM candidate_profiles"))
    final_count = result.scalar()
    print(f"Final count of candidate profiles: {final_count}")
    
    # TODO: Update all profile visibility and completion status
    db.execute(text("""
        UPDATE candidate_profiles
        SET profile_visibility = 'public',
            is_open_to_opportunities = TRUE,
            profile_completed = TRUE
        WHERE profile_completed IS FALSE OR profile_completed = FALSE
    """))
    db.commit()
    print("Updated all profiles to be complete and visible")
    
except Exception as e:
    db.rollback()
    print(f"Error fixing schema: {e}")
finally:
    db.close()