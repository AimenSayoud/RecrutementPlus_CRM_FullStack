from pydantic import BaseModel
from typing import Optional, List

# Base Superadmin Schema
class SuperAdminBase(BaseModel):
    office: str

# Schema for creating a new Superadmin
class SuperAdminCreate(SuperAdminBase):
    user_id: int

# Schema for updating a Superadmin
class SuperAdminUpdate(BaseModel):
    office: Optional[str] = None

# Schema for reading a Superadmin
class SuperAdmin(SuperAdminBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

# Schema for combined User and Superadmin data
class SuperAdminWithUser(SuperAdmin):
    user_name: str
    user_email: str

    class Config:
        orm_mode = True