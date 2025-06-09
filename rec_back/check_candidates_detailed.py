"""
Script to investigate why the candidates API is returning empty results.
This will trace each step of the API call process to identify the issue.
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.schemas.candidate import CandidateSearchFilters
from app.crud.candidate import candidate_profile
from app.models.user import User
from app.models.candidate import CandidateProfile

# Load environment variables
load_dotenv()

# Database connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123@localhost:5432/recruitment_plus")
print(f"Using database URL: {DB_URL}")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    print("\n=== STEP 1: Check if users with CANDIDATE role exist ===")
    result = db.query(User).filter(User.role == 'CANDIDATE').all()
    print(f"Found {len(result)} users with CANDIDATE role")
    for user in result[:3]:  # Show first 3 users
        print(f"  User: {user.email} ({user.first_name} {user.last_name}), ID: {user.id}")
    
    print("\n=== STEP 2: Check if candidate_profiles exist for these users ===")
    # Get all user IDs for candidates
    candidate_user_ids = [user.id for user in result]
    
    # Check if profiles exist
    if candidate_user_ids:
        profiles = db.query(CandidateProfile).filter(CandidateProfile.user_id.in_(candidate_user_ids)).all()
        print(f"Found {len(profiles)} candidate profiles for {len(candidate_user_ids)} candidate users")
        
        # Show details of the first few profiles
        for profile in profiles[:3]:
            print(f"  Profile ID: {profile.id}")
            print(f"  User ID: {profile.user_id}")
            print(f"  Current Position: {profile.current_position}")
            print(f"  Summary: {profile.summary and profile.summary[:50]}...")
            print("")
        
        # Print any candidate users without profiles
        profile_user_ids = [profile.user_id for profile in profiles]
        missing_profiles = [uid for uid in candidate_user_ids if uid not in profile_user_ids]
        if missing_profiles:
            print(f"Found {len(missing_profiles)} candidate users without profiles:")
            for i, user_id in enumerate(missing_profiles[:3], 1):
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    print(f"  {i}. {user.email}")
    
    print("\n=== STEP 3: Test the get_multi_with_search method directly ===")
    filters = CandidateSearchFilters(
        page=1,
        page_size=100,
        sort_by="updated_at",
        sort_order="desc"
    )
    try:
        candidates, total = candidate_profile.get_multi_with_search(db, filters=filters)
        print(f"get_multi_with_search returned {len(candidates)} candidates and total={total}")
        
        # Check if user relationship is loaded
        for i, candidate in enumerate(candidates[:3], 1):
            print(f"  Candidate {i}:")
            print(f"    ID: {candidate.id}")
            print(f"    User ID: {candidate.user_id}")
            print(f"    Has user relationship: {hasattr(candidate, 'user') and candidate.user is not None}")
            if hasattr(candidate, 'user') and candidate.user is not None:
                print(f"    User email: {candidate.user.email}")
            else:
                print("    Loading user manually...")
                user = db.query(User).filter(User.id == candidate.user_id).first()
                if user:
                    print(f"    User email (manually loaded): {user.email}")
                else:
                    print(f"    No user found with ID {candidate.user_id}")
    except Exception as e:
        print(f"Error in get_multi_with_search: {e}")
        
    print("\n=== STEP 4: Check the database directly for candidate_profiles ===")
    # Use raw SQL to check candidate_profiles table
    result = db.execute(text("SELECT COUNT(*) FROM candidate_profiles"))
    count = result.scalar()
    print(f"candidate_profiles table contains {count} rows")
    
    if count > 0:
        # Get sample rows
        result = db.execute(text("""
        SELECT cp.id, cp.user_id, u.email, cp.current_position 
        FROM candidate_profiles cp 
        JOIN users u ON cp.user_id = u.id 
        LIMIT 3
        """))
        rows = result.fetchall()
        print("Sample profiles:")
        for row in rows:
            print(f"  ID: {row[0]}, User ID: {row[1]}, Email: {row[2]}, Position: {row[3]}")
            
    print("\n=== STEP 5: Analyze the fix in the candidates endpoint ===")
    # Try to implement a fix similar to the one in todo_updated_candidates.py
    query = db.query(User.id).filter(User.role == 'CANDIDATE')
    candidate_ids = [r[0] for r in query.all()]
    print(f"Found {len(candidate_ids)} candidate users")
        
    # Build candidate profiles manually
    candidate_profiles = []
    for user_id in candidate_ids[:3]:  # Process first 3 for demonstration
        try:
            # Get user
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                print(f"User not found for ID: {user_id}")
                continue
            
            # Get profile
            profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
            if not profile:
                print(f"Profile not found for user: {user.email}")
                continue
            
            # This would be converted to a CandidateFullProfile in the actual endpoint
            print(f"Successfully built profile for: {user.email}")
            
        except Exception as e:
            print(f"Error processing candidate {user_id}: {str(e)}")
    
    print("\n=== Analysis Complete ===")

except Exception as e:
    print(f"Error: {str(e)}")
finally:
    db.close()