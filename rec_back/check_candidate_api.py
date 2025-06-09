"""Script to debug the candidates API issue."""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.schemas.candidate import CandidateSearchFilters, CandidateFullProfile
from app.crud.candidate import candidate_profile
from app.models.user import User

# Load environment variables
load_dotenv()

# Database connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123@localhost:5432/recruitment_plus")
print(f"Using database URL: {DB_URL}")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    # Create a simple search filter
    filters = CandidateSearchFilters(
        page=1,
        page_size=100,
        sort_by="updated_at",
        sort_order="desc"
    )
    
    print("Getting candidates with search filters...")
    
    # Get candidates with search
    try:
        candidates, total = candidate_profile.get_multi_with_search(db, filters=filters)
        print(f"Raw candidates returned from get_multi_with_search: {len(candidates)}")
        
        # Print each candidate's basic info
        for i, candidate in enumerate(candidates, 1):
            print(f"\nCandidate {i}:")
            print(f"  ID: {candidate.id}")
            print(f"  User ID: {candidate.user_id}")
            print(f"  Position: {candidate.current_position}")
            
            # Check if user relationship is loaded
            if hasattr(candidate, 'user') and candidate.user:
                print(f"  User: {candidate.user.email} ({candidate.user.first_name} {candidate.user.last_name})")
            else:
                # Try to load user manually
                user = db.query(User).filter(User.id == candidate.user_id).first()
                if user:
                    print(f"  User (manually loaded): {user.email} ({user.first_name} {user.last_name})")
                    # Attach user to candidate
                    candidate.user = user
                else:
                    print(f"  User: Not found for user_id {candidate.user_id}")
        
        # Try converting to schema
        print("\nAttempting to convert candidates to CandidateFullProfile schema...")
        candidate_profiles = []
        for i, candidate in enumerate(candidates, 1):
            try:
                # Ensure user is attached to candidate
                if not hasattr(candidate, 'user') or not candidate.user:
                    user = db.query(User).filter(User.id == candidate.user_id).first()
                    if user:
                        candidate.user = user
                    else:
                        print(f"Cannot convert candidate {candidate.id} - user not found")
                        continue
                
                # Create a candidate full profile
                profile = CandidateFullProfile(
                    id=candidate.user.id,
                    email=candidate.user.email,
                    first_name=candidate.user.first_name,
                    last_name=candidate.user.last_name,
                    is_active=candidate.user.is_active,
                    is_verified=candidate.user.is_verified,
                    created_at=candidate.user.created_at,
                    updated_at=candidate.user.updated_at,
                    profile=candidate
                )
                candidate_profiles.append(profile)
                print(f"Successfully converted candidate {i}")
            except Exception as e:
                print(f"Error converting candidate {candidate.id} to CandidateFullProfile: {str(e)}")
        
        print(f"\nSuccessfully converted {len(candidate_profiles)} candidates to profiles")
        
    except Exception as e:
        print(f"Error in get_multi_with_search: {str(e)}")

except Exception as e:
    print(f"Error: {str(e)}")
finally:
    db.close()