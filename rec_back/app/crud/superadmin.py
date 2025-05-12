from typing import List, Optional
import json
from pathlib import Path

# Helper function to load data
def load_data(filename):
    try:
        file_path = Path(f"fake_data/{filename}")
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return []

# Mock CRUD operations for superadmin
def get_superadmin(db, superadmin_id: int):
    superadmins = load_data("superadmin_profiles.json")
    return next((a for a in superadmins if a["id"] == superadmin_id), None)

def get_superadmin_by_user_id(db, user_id: int):
    superadmins = load_data("superadmin_profiles.json")
    return next((a for a in superadmins if a["user_id"] == user_id), None)

def get_superadmins(db, skip: int = 0, limit: int = 100):
    superadmins = load_data("superadmin_profiles.json")
    return superadmins[skip:skip + limit]

def create_superadmin(db, superadmin):
    # In a real app, this would add to the database
    return {
        "id": 999,  # Mock ID
        "user_id": superadmin.user_id,
        "office": superadmin.office
    }

def update_superadmin(db, superadmin_id: int, superadmin):
    # In a real app, this would update the database
    db_superadmin = get_superadmin(db, superadmin_id)
    if db_superadmin:
        # Just return a mock updated object
        return {
            "id": superadmin_id,
            "user_id": db_superadmin["user_id"],
            "office": superadmin.office or db_superadmin["office"]
        }
    return None

def delete_superadmin(db, superadmin_id: int):
    # In a real app, this would delete from the database
    db_superadmin = get_superadmin(db, superadmin_id)
    return db_superadmin is not None