from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123@localhost/recruitment_plus")
print(f"Using database URL: {DB_URL}")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

# List of fields to fix
fields_to_add = [
    "profile_visibility VARCHAR(20) NOT NULL DEFAULT 'public'",
    "is_open_to_opportunities BOOLEAN NOT NULL DEFAULT TRUE",
    "nationality VARCHAR(100)",
    "address VARCHAR(500)",
    "postal_code VARCHAR(20)"
]

try:
    # Check which fields need to be added
    result = db.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = 'candidate_profiles'"
    ))
    existing_columns = [row[0] for row in result]
    print(f"Existing columns: {existing_columns}")
    
    # Add missing fields
    added_fields = []
    for field_def in fields_to_add:
        field_name = field_def.split()[0].lower()
        if field_name not in existing_columns:
            sql = f"ALTER TABLE candidate_profiles ADD COLUMN {field_def}"
            print(f"Executing: {sql}")
            db.execute(text(sql))
            added_fields.append(field_name)
    
    # Commit the changes
    db.commit()
    print(f"Added missing fields: {added_fields}")
    
    # Count records after fix
    result = db.execute(text("SELECT COUNT(*) FROM candidate_profiles"))
    count = result.scalar()
    print(f"Total candidates after fix: {count}")
    
    # Verify the schema
    result = db.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = 'candidate_profiles'"
    ))
    updated_columns = [row[0] for row in result]
    print(f"Updated columns: {updated_columns}")
    
except Exception as e:
    print(f"Error fixing candidate schema: {e}")
    db.rollback()
finally:
    db.close()