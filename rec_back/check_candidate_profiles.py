"""
Script to check if candidate profiles are now correctly displaying in the database.
This will print details about all candidate profiles including the new columns.
"""
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

try:
    # Count total profiles
    result = db.execute(text("SELECT COUNT(*) FROM candidate_profiles"))
    total_count = result.scalar()
    print(f"Total candidate profiles: {total_count}")
    
    # Get all columns for candidate_profiles table
    result = db.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = 'candidate_profiles' "
        "ORDER BY ordinal_position"
    ))
    columns = [row[0] for row in result]
    print(f"All columns in candidate_profiles table ({len(columns)}):")
    print(", ".join(columns))
    
    # Get candidate profile data with user information
    query = text("""
    SELECT 
        cp.id, 
        u.email,
        u.first_name,
        u.last_name,
        cp.current_position,
        cp.current_company,
        cp.summary,
        cp.years_of_experience,
        cp.location,
        cp.linkedin_url,
        cp.github_url,
        cp.portfolio_url,
        cp.profile_visibility,
        cp.is_open_to_opportunities,
        cp.profile_completed,
        cp.created_at
    FROM 
        candidate_profiles cp
    JOIN 
        users u ON cp.user_id = u.id
    ORDER BY 
        cp.created_at DESC
    """)
    
    result = db.execute(query)
    profiles = result.fetchall()
    
    print(f"\nFound {len(profiles)} candidate profiles with user data:\n")
    for i, profile in enumerate(profiles, 1):
        print(f"--- Profile {i} ---")
        print(f"ID: {profile[0]}")
        print(f"User: {profile[1]} ({profile[2]} {profile[3]})")
        print(f"Position: {profile[4]}")
        print(f"Company: {profile[5]}")
        print(f"Summary: {profile[6][:60]}..." if profile[6] and len(profile[6]) > 60 else f"Summary: {profile[6]}")
        print(f"Experience: {profile[7]} years")
        print(f"Location: {profile[8]}")
        print(f"LinkedIn: {profile[9]}")
        print(f"GitHub: {profile[10]}")
        print(f"Portfolio: {profile[11]}")
        print(f"Visibility: {profile[12]}")
        print(f"Open to Opportunities: {profile[13]}")
        print(f"Profile Completed: {profile[14]}")
        print(f"Created: {profile[15]}")
        print()
    
except Exception as e:
    print(f"Error checking candidate profiles: {e}")
finally:
    db.close()