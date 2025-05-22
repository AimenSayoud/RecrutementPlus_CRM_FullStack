from sqlalchemy import Column, String, Text, Date, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel


class ApplicationStatus(str, enum.Enum):
    SUBMITTED = "Submitted"
    UNDER_REVIEW_RECRUITMENTPLUS = "Under Review by RecrutementPlus"
    PRESENTED_TO_EMPLOYER = "Presented to Employer"
    INTERVIEW_SCHEDULED = "Interview Scheduled"
    REJECTED = "Rejected"
    OFFER_MADE = "Offer Made"
    HIRED = "Hired"


class Application(BaseModel):
    __tablename__ = "applications"

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    cover_letter = Column(Text, nullable=True)
    application_date = Column(Date, nullable=False)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.SUBMITTED, nullable=False)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")
    notes = relationship("ApplicationNote", back_populates="application", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Application(id={self.id}, candidate_id={self.candidate_id}, job_id={self.job_id}, status={self.status})>"


class ApplicationStatusHistory(BaseModel):
    __tablename__ = "application_status_history"

    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    status = Column(String, nullable=False)
    comment = Column(Text, nullable=True)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date_changed = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    application = relationship("Application", back_populates="status_history")
    changed_by_user = relationship("User", foreign_keys=[changed_by])

    def __repr__(self):
        return f"<ApplicationStatusHistory(id={self.id}, application_id={self.application_id}, status={self.status})>"


class ApplicationNote(BaseModel):
    __tablename__ = "application_notes"

    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=False)
    note_text = Column(Text, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="notes")
    consultant = relationship("ConsultantProfile", back_populates="application_notes")

    def __repr__(self):
        return f"<ApplicationNote(id={self.id}, application_id={self.application_id}, consultant_id={self.consultant_id})>"