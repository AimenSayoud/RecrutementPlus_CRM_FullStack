"""Script to add test candidates to the database."""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import application models and schema
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.models.user import User
from app.models.candidate import CandidateProfile
from app.models.enums import UserRole

# Database connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123@localhost:5432/recruitment_plus")
print(f"Using database URL: {DB_URL}")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

def create_test_candidate(email, first_name, last_name, position, company, summary, location):
    """Create a test candidate user and profile."""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists. Using existing user.")
            user = existing_user
        else:
            # Create new user
            user = User(
                id=uuid.uuid4(),
                email=email,
                password_hash="$2b$12$8A5K4BVj3Pvy5Ksz1qW9NeHwFZGHhsyloFxqMI2pVlhD2dyhk2d3u",  # hashed 'password123'
                first_name=first_name,
                last_name=last_name,
                role=UserRole.CANDIDATE,
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(user)
            db.flush()  # Get user ID without committing
            print(f"Created new user: {user.email} with ID: {user.id}")

        # Check if candidate profile exists
        existing_profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
        if existing_profile:
            print(f"Candidate profile for user {email} already exists. Updating profile.")
            # Update existing profile
            existing_profile.current_position = position
            existing_profile.current_company = company
            existing_profile.summary = summary
            existing_profile.location = location
            existing_profile.profile_completed = True
            existing_profile.years_of_experience = 3
            existing_profile.city = location.split(", ")[0] if ", " in location else location
            existing_profile.country = location.split(", ")[-1] if ", " in location else None
            existing_profile.updated_at = datetime.now(timezone.utc)
            profile = existing_profile
        else:
            # Create new candidate profile
            profile = CandidateProfile(
                id=uuid.uuid4(),
                user_id=user.id,
                current_position=position,
                current_company=company,
                summary=summary,
                years_of_experience=3,
                location=location,
                city=location.split(", ")[0] if ", " in location else location,
                country=location.split(", ")[-1] if ", " in location else None,
                profile_completed=True,
                profile_visibility="public",
                is_open_to_opportunities=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(profile)
            print(f"Created new candidate profile for {email} with ID: {profile.id}")
        
        # Commit changes
        db.commit()
        return profile
    except Exception as e:
        db.rollback()
        print(f"Error creating candidate {email}: {e}")
        return None

def main():
    """Main function to add test candidates."""
    try:
        # Add test candidates
        candidates = [
            {
                "email": "john.dev@example.com",
                "first_name": "John",
                "last_name": "Developer",
                "position": "Senior Software Engineer",
                "company": "Tech Solutions Inc.",
                "summary": "Experienced software engineer with 5 years of experience in web development.",
                "location": "San Francisco, USA"
            },
            {
                "email": "sarah.pm@example.com",
                "first_name": "Sarah",
                "last_name": "Manager",
                "position": "Product Manager",
                "company": "Innovative Products Ltd.",
                "summary": "Product manager with a passion for creating user-friendly applications.",
                "location": "London, UK"
            },
            {
                "email": "michael.design@example.com",
                "first_name": "Michael",
                "last_name": "Designer",
                "position": "UI/UX Designer",
                "company": "Creative Designs Co.",
                "summary": "UI/UX designer with expertise in creating beautiful and intuitive interfaces.",
                "location": "Berlin, Germany"
            }
        ]
        
        # Create all test candidates
        created_profiles = []
        for candidate in candidates:
            profile = create_test_candidate(**candidate)
            if profile:
                created_profiles.append(profile)
        
        # Print results
        print(f"Successfully added {len(created_profiles)} candidate profiles.")
        
        # Update existing profiles if they have missing fields
        result = db.query(CandidateProfile).all()
        updated_count = 0
        for profile in result:
            updated = False
            if not profile.profile_visibility:
                profile.profile_visibility = "public"
                updated = True
            if profile.is_open_to_opportunities is None:
                profile.is_open_to_opportunities = True
                updated = True
                
            if updated:
                updated_count += 1
        
        if updated_count > 0:
            db.commit()
            print(f"Updated {updated_count} existing profiles with missing fields.")
        
        # Count final records
        count = db.query(CandidateProfile).count()
        print(f"Total candidate profiles in database: {count}")
        
    except Exception as e:
        print(f"Error in main function: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()