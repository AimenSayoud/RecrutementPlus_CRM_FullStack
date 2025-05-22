from sqlalchemy import Column, String, Text, Integer, Date, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


class ContractType(str, enum.Enum):
    PERMANENT = "Permanent"
    CONTRACT = "Contract"
    FREELANCE = "Freelance"
    INTERNSHIP = "Internship"


class JobStatus(str, enum.Enum):
    DRAFT = "Draft"
    OPEN = "Open"
    CLOSED = "Closed"
    FILLED = "Filled"
    CANCELLED = "Cancelled"


class ProficiencyLevel(str, enum.Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    EXPERT = "Expert"


class Job(BaseModel):
    __tablename__ = "jobs"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    posted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    responsibilities = Column(JSONB, nullable=True)  # Array of responsibilities
    requirements = Column(JSONB, nullable=True)  # Array of requirements
    location = Column(String, nullable=False)
    contract_type = Column(SQLEnum(ContractType), nullable=False)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    remote_option = Column(Boolean, default=False, nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.DRAFT, nullable=False)
    posting_date = Column(Date, nullable=True)
    deadline_date = Column(Date, nullable=True)

    # Relationships
    company = relationship("Company", back_populates="jobs")
    posted_by_user = relationship("User", back_populates="posted_jobs", foreign_keys=[posted_by])
    skills = relationship("JobSkill", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    @property
    def salary_range_display(self):
        if self.salary_min and self.salary_max:
            return f"¬{self.salary_min:,} - ¬{self.salary_max:,}"
        elif self.salary_min:
            return f"¬{self.salary_min:,}+"
        elif self.salary_max:
            return f"Up to ¬{self.salary_max:,}"
        return "Salary not specified"

    def __repr__(self):
        return f"<Job(id={self.id}, title={self.title}, company_id={self.company_id}, status={self.status})>"


class JobSkill(BaseModel):
    __tablename__ = "job_skills"

    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)
    is_required = Column(Boolean, default=True, nullable=False)
    proficiency_level = Column(SQLEnum(ProficiencyLevel), nullable=True)

    # Relationships
    job = relationship("Job", back_populates="skills")
    skill = relationship("Skill", back_populates="job_skills")

    def __repr__(self):
        return f"<JobSkill(job_id={self.job_id}, skill_id={self.skill_id}, required={self.is_required})>"