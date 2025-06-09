import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection - try to use the same as the application
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123@localhost/recruitment_plus")
print(f"Using database URL: {DB_URL}")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

# Check candidate_profiles table
try:
    # Check if table exists
    result = db.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidate_profiles')"))
    table_exists = result.scalar()
    print(f"candidate_profiles table exists: {table_exists}")

    if table_exists:
        # Count records
        result = db.execute(text("SELECT COUNT(*) FROM candidate_profiles"))
        count = result.scalar()
        print(f"Total candidates: {count}")

        # Get column names
        result = db.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'candidate_profiles'"
        ))
        columns = [row[0] for row in result]
        print(f"Table columns: {columns}")

        # Check for date_of_birth column
        has_dob = 'date_of_birth' in columns
        print(f"Has date_of_birth column: {has_dob}")

        # Get sample data if there are records
        if count > 0:
            # Use specific columns we know exist
            result = db.execute(text(
                "SELECT id, user_id, current_position, current_company, "
                "summary, years_of_experience, profile_completed, created_at "
                "FROM candidate_profiles LIMIT 1"
            ))
            sample = result.fetchone()
            print(f"Sample candidate: {sample}")
            
            # Check the associated user
            user_id = sample[1]  # user_id is at index 1
            result = db.execute(text(
                f"SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = '{user_id}'"
            ))
            user = result.fetchone()
            print(f"Associated user: {user}")
            
            # Check if the actual API returns candidates
            result = db.execute(text(
                "SELECT COUNT(*) FROM candidate_profiles "
                "JOIN users ON candidate_profiles.user_id = users.id "
            ))
            joined_count = result.scalar()
            print(f"Candidates with joined users: {joined_count}")
            
            # Check user roles - important for authorization
            result = db.execute(text(
                "SELECT role, COUNT(*) FROM users GROUP BY role"
            ))
            roles = result.fetchall()
            print(f"User roles: {roles}")
            
            # Check required fields for CandidateFullProfile schema
            missing_fields = []
            required_fields = [
                'profile_visibility', 'is_open_to_opportunities', 
                'nationality', 'address', 'postal_code'
            ]
            for field in required_fields:
                if field not in columns:
                    missing_fields.append(field)
            print(f"Missing required fields: {missing_fields}")
            
            # Check join between candidate_profiles and skills
            result = db.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidate_skills')"
            ))
            has_skills_table = result.scalar()
            print(f"Has candidate_skills table: {has_skills_table}")
            
            if has_skills_table:
                sql = text("SELECT COUNT(*) FROM candidate_skills WHERE candidate_id = :candidate_id")
                result = db.execute(sql, {"candidate_id": str(sample[0])})
                skill_count = result.scalar()
                print(f"Number of skills for this candidate: {skill_count}")
except Exception as e:
    print(f"Error checking candidates: {e}")
finally:
    db.close()