from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Skill(BaseModel):
    __tablename__ = "skills"

    name = Column(String, nullable=False, unique=True, index=True)
    category = Column(String, nullable=True)  # 'Programming', 'Design', 'Management', etc.
    description = Column(Text, nullable=True)

    # Relationships
    candidate_skills = relationship("CandidateSkill", back_populates="skill", cascade="all, delete-orphan")
    job_skills = relationship("JobSkill", back_populates="skill", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Skill(id={self.id}, name={self.name}, category={self.category})>"