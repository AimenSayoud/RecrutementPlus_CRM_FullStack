from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User, UserRole, OfficeId
from app.db.session import SessionLocal, engine
import uuid

def create_tables():
    """Create all database tables."""
    from app.models.user import Base
    Base.metadata.create_all(bind=engine)

def create_test_users(db: Session):
    """Create test users for development."""
    
    # Check if users already exist
    existing_user = db.query(User).first()
    if existing_user:
        print("Users already exist, skipping creation...")
        return
    
    test_users = [
        {
            "id": str(uuid.uuid4()),
            "email": "super_admin@example.com",
            "name": "Super Admin",
            "hashed_password": get_password_hash("password123"),
            "role": UserRole.SUPER_ADMIN,
            "office_id": OfficeId.OFFICE_1,
            "is_active": True,
            "is_verified": True
        },
        {
            "id": str(uuid.uuid4()),
            "email": "admin@example.com",
            "name": "Admin User",
            "hashed_password": get_password_hash("password123"),
            "role": UserRole.ADMIN,
            "office_id": OfficeId.OFFICE_1,
            "is_active": True,
            "is_verified": True
        },
        {
            "id": str(uuid.uuid4()),
            "email": "employee@example.com",
            "name": "Employee User",
            "hashed_password": get_password_hash("password123"),
            "role": UserRole.EMPLOYEE,
            "office_id": OfficeId.OFFICE_1,
            "is_active": True,
            "is_verified": True
        },
        {
            "id": str(uuid.uuid4()),
            "email": "test@example.com",
            "name": "Test User",
            "hashed_password": get_password_hash("password123"),
            "role": UserRole.EMPLOYEE,
            "office_id": OfficeId.OFFICE_2,
            "is_active": True,
            "is_verified": True
        }
    ]
    
    for user_data in test_users:
        user = User(**user_data)
        db.add(user)
    
    db.commit()
    print(f"Created {len(test_users)} test users")

def init_db():
    """Initialize database with tables and test data."""
    print("Creating database tables...")
    create_tables()
    
    print("Creating test users...")
    db = SessionLocal()
    try:
        create_test_users(db)
    finally:
        db.close()
    
    print("Database initialization complete!")

if __name__ == "__main__":
    init_db()