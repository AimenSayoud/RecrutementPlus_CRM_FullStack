from app.db.session import engine
from sqlalchemy import text

def check_users():
    with engine.connect() as conn:
        # Check the admin user
        result = conn.execute(text("SELECT * FROM users WHERE email = 'admin@example.com'"))
        rows = result.fetchall()
        print(f"Found {len(rows)} users with email admin@example.com")
        for row in rows:
            print(row)
        
        # Check for role enum values
        result = conn.execute(text("SELECT DISTINCT role FROM users"))
        roles = result.fetchall()
        print(f"\nDistinct roles in the database:")
        for role in roles:
            print(role[0])
            
        # Find the admin/superadmin users
        result = conn.execute(text("SELECT * FROM users WHERE role IN ('ADMIN', 'SUPERADMIN') LIMIT 5"))
        admin_rows = result.fetchall()
        print(f"\nFound {len(admin_rows)} users with role 'ADMIN' or 'SUPERADMIN'")
        for row in admin_rows:
            print(f"Email: {row[0]}, Role: {row[4]}")

if __name__ == "__main__":
    check_users()