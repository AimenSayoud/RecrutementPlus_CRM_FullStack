from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class SuperAdmin(Base):
    __tablename__ = "superadmins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    office = Column(String, index=True)
    
    # In a real application, this would be a relationship to the User model
    # user = relationship("User", back_populates="superadmin")
    
    def __repr__(self):
        return f"<SuperAdmin(id={self.id}, user_id={self.user_id}, office={self.office})>"