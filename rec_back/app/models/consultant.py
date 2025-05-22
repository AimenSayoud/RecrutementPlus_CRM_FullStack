import enum
from sqlalchemy import Column, String, Text, Integer, Boolean, DECIMAL, ForeignKey, DateTime, Table
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import BaseModel


class ConsultantStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    SUSPENDED = "suspended"


class ConsultantProfile(BaseModel):
    __tablename__ = "consultant_profiles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    employee_id = Column(String(50), nullable=True, unique=True)
    department = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default=ConsultantStatus.ACTIVE)
    
    # Experience and skills
    years_of_experience = Column(Integer, nullable=True)
    specializations = Column(JSONB, nullable=True)  # Array of specialization areas
    certifications = Column(JSONB, nullable=True)  # Array of certification objects
    
    # Performance metrics
    total_placements = Column(Integer, nullable=False, default=0)
    successful_placements = Column(Integer, nullable=False, default=0)
    average_rating = Column(DECIMAL(3, 2), nullable=True)
    total_revenue_generated = Column(DECIMAL(15, 2), nullable=True)
    
    # Contact and availability
    phone_number = Column(String(20), nullable=True)
    availability_status = Column(String(20), nullable=True)  # available, busy, unavailable
    working_hours = Column(JSONB, nullable=True)  # Schedule object
    
    # Assignment preferences
    preferred_job_types = Column(JSONB, nullable=True)  # Array of job types
    preferred_industries = Column(JSONB, nullable=True)  # Array of industries
    max_concurrent_assignments = Column(Integer, nullable=True, default=10)
    
    # Performance tracking
    current_active_jobs = Column(Integer, nullable=False, default=0)
    this_month_placements = Column(Integer, nullable=False, default=0)
    this_quarter_revenue = Column(DECIMAL(15, 2), nullable=True)
    
    # Administrative fields
    hire_date = Column(DateTime, nullable=True)
    last_performance_review = Column(DateTime, nullable=True)
    next_performance_review = Column(DateTime, nullable=True)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=True)
    
    # Notes and comments
    notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)  # Internal notes for admins
    
    # Relationships
    user = relationship("User", back_populates="consultant_profile")
    manager = relationship("ConsultantProfile", remote_side="ConsultantProfile.id")
    team_members = relationship("ConsultantProfile", back_populates="manager")
    
    # Job assignments
    assigned_jobs = relationship("Job", back_populates="assigned_consultant")
    managed_applications = relationship("Application", back_populates="consultant")


# Association table for consultant skills (many-to-many)
consultant_skills = Table(
    'consultant_skills',
    BaseModel.metadata,
    Column('consultant_id', UUID(as_uuid=True), ForeignKey('consultant_profiles.id'), primary_key=True),
    Column('skill_id', UUID(as_uuid=True), ForeignKey('skills.id'), primary_key=True),
    Column('proficiency_level', String(20), nullable=True),  # beginner, intermediate, advanced, expert
    Column('years_experience', Integer, nullable=True)
)


class ConsultantTarget(BaseModel):
    __tablename__ = "consultant_targets"
    
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=False)
    target_period = Column(String(20), nullable=False)  # monthly, quarterly, yearly
    target_year = Column(Integer, nullable=False)
    target_month = Column(Integer, nullable=True)  # For monthly targets
    target_quarter = Column(Integer, nullable=True)  # For quarterly targets
    
    # Targets
    placement_target = Column(Integer, nullable=True)
    revenue_target = Column(DECIMAL(15, 2), nullable=True)
    client_satisfaction_target = Column(DECIMAL(3, 2), nullable=True)
    
    # Actual performance
    actual_placements = Column(Integer, nullable=False, default=0)
    actual_revenue = Column(DECIMAL(15, 2), nullable=False, default=0)
    actual_client_satisfaction = Column(DECIMAL(3, 2), nullable=True)
    
    # Status
    is_achieved = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    consultant = relationship("ConsultantProfile", backref="targets")


class ConsultantPerformanceReview(BaseModel):
    __tablename__ = "consultant_performance_reviews"
    
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    review_period_start = Column(DateTime, nullable=False)
    review_period_end = Column(DateTime, nullable=False)
    
    # Ratings (1-5 scale)
    communication_rating = Column(Integer, nullable=True)
    client_satisfaction_rating = Column(Integer, nullable=True)
    target_achievement_rating = Column(Integer, nullable=True)
    teamwork_rating = Column(Integer, nullable=True)
    innovation_rating = Column(Integer, nullable=True)
    overall_rating = Column(DECIMAL(3, 2), nullable=True)
    
    # Feedback
    strengths = Column(Text, nullable=True)
    areas_for_improvement = Column(Text, nullable=True)
    development_goals = Column(JSONB, nullable=True)  # Array of goal objects
    reviewer_comments = Column(Text, nullable=True)
    consultant_comments = Column(Text, nullable=True)
    
    # Status
    status = Column(String(20), nullable=False, default="draft")  # draft, completed, approved
    
    # Relationships
    consultant = relationship("ConsultantProfile", backref="performance_reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])