from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
import logging
from datetime import datetime, date

from app.models.job import Job, JobStatus
from app.models.company import Company, EmployerProfile
from app.models.user import User, UserRole
from app.models.skill import Skill
from app.schemas.job import (
    JobCreate, JobUpdate, JobWithDetails,
    JobSearchFilters, JobSkillRequirementCreate
)
from app.crud import (
    job as job_crud,
    job_skill_requirement as job_skill_crud,
    company as company_crud,
    employer_profile as employer_crud
)
from app.services.base import BaseService

logger = logging.getLogger(__name__)


class JobService(BaseService[Job, type(job_crud)]):
    """Service for handling job operations"""
    
    def __init__(self):
        super().__init__(job_crud)
        self.job_skill_crud = job_skill_crud
        self.company_crud = company_crud
        self.employer_crud = employer_crud
    
    def create_job(
        self,
        db: Session,
        *,
        job_data: JobCreate,
        posted_by_user_id: UUID,
        auto_publish: bool = False
    ) -> Optional[Job]:
        """
        Create a new job posting
        
        Args:
            db: Database session
            job_data: Job data
            posted_by_user_id: User ID who is posting the job
            auto_publish: Whether to automatically publish the job
            
        Returns:
            Created job or None if validation fails
        """
        logger.info(f"Creating job for company {job_data.company_id} by user {posted_by_user_id}")
        
        # Verify user has permission to post jobs for this company
        if not self._verify_posting_permission(db, user_id=posted_by_user_id, company_id=job_data.company_id):
            logger.error(f"User {posted_by_user_id} does not have permission to post jobs for company {job_data.company_id}")
            return None
        
        # Set posted_by
        job_data.posted_by = posted_by_user_id
        
        # Set initial status
        if auto_publish:
            job_data.status = JobStatus.OPEN
            job_data.posting_date = date.today()
        else:
            job_data.status = JobStatus.DRAFT
        
        # Create job
        job = self.crud.create(db, obj_in=job_data)
        
        # Update company active jobs count
        self.company_crud.update_job_counts(db, company_id=job.company_id)
        
        logger.info(f"Successfully created job {job.id}")
        return job
    
    def update_job(
        self,
        db: Session,
        *,
        job_id: UUID,
        job_data: JobUpdate,
        updated_by_user_id: UUID
    ) -> Optional[Job]:
        """
        Update a job posting
        
        Args:
            db: Database session
            job_id: Job ID
            job_data: Update data
            updated_by_user_id: User ID who is updating
            
        Returns:
            Updated job or None if validation fails
        """
        logger.info(f"Updating job {job_id}")
        
        # Get existing job
        job = self.crud.get(db, id=job_id)
        if not job:
            return None
        
        # Verify permission
        if not self._verify_posting_permission(db, user_id=updated_by_user_id, company_id=job.company_id):
            logger.error(f"User {updated_by_user_id} does not have permission to update job {job_id}")
            return None
        
        # Update job
        job = self.crud.update(db, id=job_id, obj_in=job_data)
        
        # Update company active jobs count if status changed
        if job and "status" in job_data.dict(exclude_unset=True):
            self.company_crud.update_job_counts(db, company_id=job.company_id)
        
        return job
    
    def publish_job(
        self,
        db: Session,
        *,
        job_id: UUID,
        published_by_user_id: UUID
    ) -> Optional[Job]:
        """
        Publish a draft job
        
        Args:
            db: Database session
            job_id: Job ID
            published_by_user_id: User ID who is publishing
            
        Returns:
            Published job or None if validation fails
        """
        logger.info(f"Publishing job {job_id}")
        
        job = self.crud.get(db, id=job_id)
        if not job:
            return None
        
        if job.status != JobStatus.DRAFT:
            logger.warning(f"Job {job_id} is not in draft status")
            return job
        
        # Verify permission
        if not self._verify_posting_permission(db, user_id=published_by_user_id, company_id=job.company_id):
            logger.error(f"User {published_by_user_id} does not have permission to publish job {job_id}")
            return None
        
        # Publish job
        update_data = {
            "status": JobStatus.OPEN,
            "posting_date": date.today()
        }
        
        job = self.crud.update(db, id=job_id, obj_in=update_data)
        
        # Update company active jobs count
        self.company_crud.update_job_counts(db, company_id=job.company_id)
        
        logger.info(f"Successfully published job {job_id}")
        return job
    
    def close_job(
        self,
        db: Session,
        *,
        job_id: UUID,
        closed_by_user_id: UUID,
        reason: Optional[str] = None
    ) -> Optional[Job]:
        """
        Close a job posting
        
        Args:
            db: Database session
            job_id: Job ID
            closed_by_user_id: User ID who is closing
            reason: Optional reason for closing
            
        Returns:
            Closed job or None if validation fails
        """
        logger.info(f"Closing job {job_id}")
        
        job = self.crud.get(db, id=job_id)
        if not job:
            return None
        
        if job.status not in [JobStatus.OPEN, JobStatus.DRAFT]:
            logger.warning(f"Job {job_id} cannot be closed from status {job.status}")
            return job
        
        # Verify permission
        if not self._verify_posting_permission(db, user_id=closed_by_user_id, company_id=job.company_id):
            logger.error(f"User {closed_by_user_id} does not have permission to close job {job_id}")
            return None
        
        # Close job
        update_data = {"status": JobStatus.CLOSED}
        
        job = self.crud.update(db, id=job_id, obj_in=update_data)
        
        # Update company active jobs count
        self.company_crud.update_job_counts(db, company_id=job.company_id)
        
        # Log reason if provided
        if reason:
            self.log_action(
                "job_closed",
                user_id=closed_by_user_id,
                details={"job_id": str(job_id), "reason": reason}
            )
        
        logger.info(f"Successfully closed job {job_id}")
        return job
    
    def update_job_skills(
        self,
        db: Session,
        *,
        job_id: UUID,
        skill_requirements: List[JobSkillRequirementCreate],
        updated_by_user_id: UUID
    ) -> Optional[List[Any]]:
        """
        Update job skill requirements
        
        Args:
            db: Database session
            job_id: Job ID
            skill_requirements: List of skill requirements
            updated_by_user_id: User ID who is updating
            
        Returns:
            List of skill requirements or None if validation fails
        """
        logger.info(f"Updating skills for job {job_id}")
        
        job = self.crud.get(db, id=job_id)
        if not job:
            return None
        
        # Verify permission
        if not self._verify_posting_permission(db, user_id=updated_by_user_id, company_id=job.company_id):
            logger.error(f"User {updated_by_user_id} does not have permission to update job {job_id}")
            return None
        
        # Update skills
        skills = self.job_skill_crud.update_job_skills(
            db,
            job_id=job_id,
            skill_requirements=skill_requirements
        )
        
        return skills
    
    def search_jobs(
        self,
        db: Session,
        *,
        filters: JobSearchFilters
    ) -> tuple[List[Job], int]:
        """
        Search jobs with filters
        
        Args:
            db: Database session
            filters: Search filters
            
        Returns:
            Tuple of (jobs, total_count)
        """
        logger.info(f"Searching jobs with filters: {filters}")
        return self.crud.get_multi_with_search(db, filters=filters)
    
    def get_job_with_details(
        self,
        db: Session,
        *,
        job_id: UUID,
        increment_views: bool = False
    ) -> Optional[JobWithDetails]:
        """
        Get job with all details
        
        Args:
            db: Database session
            job_id: Job ID
            increment_views: Whether to increment view count
            
        Returns:
            Job with details
        """
        logger.debug(f"Getting job details for {job_id}")
        
        # Increment view count if requested
        if increment_views:
            self.crud.increment_view_count(db, job_id=job_id)
        
        job = self.crud.get_with_details(db, id=job_id)
        if not job:
            return None
        
        # Build response
        job_details = JobWithDetails(
            id=job.id,
            company_id=job.company_id,
            company_name=job.company.name if job.company else None,
            posted_by=job.posted_by,
            posted_by_name=job.posted_by_user.full_name if job.posted_by_user else None,
            assigned_consultant_id=job.assigned_consultant_id,
            assigned_consultant_name=job.assigned_consultant.user.full_name if job.assigned_consultant else None,
            title=job.title,
            description=job.description,
            responsibilities=job.responsibilities,
            requirements=job.requirements,
            location=job.location,
            is_remote=job.is_remote,
            is_hybrid=job.is_hybrid,
            job_type=job.job_type,
            experience_level=job.experience_level,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            salary_currency=job.salary_currency,
            deadline=job.deadline,
            start_date=job.start_date,
            benefits=job.benefits,
            company_culture=job.company_culture,
            is_featured=job.is_featured,
            requires_cover_letter=job.requires_cover_letter,
            status=job.status,
            application_count=job.application_count,
            view_count=job.view_count,
            created_at=job.created_at,
            updated_at=job.updated_at,
            skill_requirements=job.skill_requirements
        )
        
        return job_details
    
    def get_company_jobs(
        self,
        db: Session,
        *,
        company_id: UUID,
        include_closed: bool = False,
        skip: int = 0,
        limit: int = 100
    ) -> List[Job]:
        """
        Get jobs for a company
        
        Args:
            db: Database session
            company_id: Company ID
            include_closed: Whether to include closed jobs
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of jobs
        """
        logger.debug(f"Getting jobs for company {company_id}")
        
        jobs = self.crud.get_by_company(db, company_id=company_id, skip=skip, limit=limit)
        
        if not include_closed:
            jobs = [job for job in jobs if job.status != JobStatus.CLOSED]
        
        return jobs
    
    def get_job_statistics(
        self,
        db: Session,
        *,
        job_id: UUID
    ) -> Dict[str, Any]:
        """
        Get job statistics
        
        Args:
            db: Database session
            job_id: Job ID
            
        Returns:
            Dictionary of statistics
        """
        logger.debug(f"Getting statistics for job {job_id}")
        
        job = self.crud.get(db, id=job_id)
        if not job:
            return {}
        
        # Get application summary
        app_summary = self.crud.get_application_summary(db, job_id=job_id)
        
        # Calculate conversion rates
        total_apps = app_summary.get("total_applications", 0)
        interview_rate = (app_summary.get("interviewed", 0) / total_apps * 100) if total_apps > 0 else 0
        offer_rate = (app_summary.get("offered", 0) / total_apps * 100) if total_apps > 0 else 0
        hire_rate = (app_summary.get("hired", 0) / total_apps * 100) if total_apps > 0 else 0
        
        # Days since posting
        days_active = (date.today() - job.posting_date).days if job.posting_date else 0
        
        return {
            "job_id": str(job_id),
            "status": job.status.value,
            "view_count": job.view_count or 0,
            "application_summary": app_summary,
            "conversion_rates": {
                "interview_rate": round(interview_rate, 2),
                "offer_rate": round(offer_rate, 2),
                "hire_rate": round(hire_rate, 2)
            },
            "days_active": days_active,
            "applications_per_day": round(total_apps / days_active, 2) if days_active > 0 else 0
        }
    
    def get_similar_jobs(
        self,
        db: Session,
        *,
        job_id: UUID,
        limit: int = 5
    ) -> List[Job]:
        """
        Get similar jobs based on skills and requirements
        
        Args:
            db: Database session
            job_id: Job ID
            limit: Maximum number of similar jobs
            
        Returns:
            List of similar jobs
        """
        logger.debug(f"Getting similar jobs for {job_id}")
        
        job = self.crud.get_with_details(db, id=job_id)
        if not job:
            return []
        
        # Get job skills
        skill_ids = [req.skill_id for req in job.skill_requirements] if job.skill_requirements else []
        
        if not skill_ids:
            # Fallback to same company or location
            filters = JobSearchFilters(
                company_id=job.company_id,
                location=job.location,
                status=JobStatus.OPEN,
                page_size=limit
            )
        else:
            # Search by skills
            skill_names = db.query(Skill.name).filter(Skill.id.in_(skill_ids)).all()
            skill_names = [s[0] for s in skill_names]
            
            filters = JobSearchFilters(
                skills=skill_names,
                status=JobStatus.OPEN,
                page_size=limit + 1  # Get one extra to exclude current job
            )
        
        similar_jobs, _ = self.crud.get_multi_with_search(db, filters=filters)
        
        # Exclude current job
        similar_jobs = [j for j in similar_jobs if j.id != job_id][:limit]
        
        return similar_jobs
    
    def _verify_posting_permission(
        self,
        db: Session,
        *,
        user_id: UUID,
        company_id: UUID
    ) -> bool:
        """
        Verify if user has permission to post/update jobs for company
        
        Args:
            db: Database session
            user_id: User ID
            company_id: Company ID
            
        Returns:
            True if user has permission, False otherwise
        """
        # Check if user is an employer for this company
        employer = self.employer_crud.get_hiring_permissions(
            db,
            user_id=user_id,
            company_id=company_id
        )
        
        if employer:
            return True
        
        # Check if user is admin/superadmin
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            return True
        
        return False
    
    def assign_consultant(
        self,
        db: Session,
        *,
        job_id: UUID,
        consultant_id: UUID,
        assigned_by_user_id: UUID
    ) -> Optional[Job]:
        """
        Assign a consultant to a job
        
        Args:
            db: Database session
            job_id: Job ID
            consultant_id: Consultant ID
            assigned_by_user_id: User who is assigning
            
        Returns:
            Updated job
        """
        logger.info(f"Assigning consultant {consultant_id} to job {job_id}")
        
        job = self.crud.get(db, id=job_id)
        if not job:
            return None
        
        # Verify permission
        if not self._verify_posting_permission(db, user_id=assigned_by_user_id, company_id=job.company_id):
            logger.error(f"User {assigned_by_user_id} does not have permission to assign consultant to job {job_id}")
            return None
        
        # Update job
        job = self.crud.update(db, id=job_id, obj_in={"assigned_consultant_id": consultant_id})
        
        # Create consultant-client relationship if not exists
        from app.crud import consultant_client as consultant_client_crud
        consultant_client_crud.assign_client(
            db,
            consultant_id=consultant_id,
            company_id=job.company_id,
            notes=f"Assigned via job {job.title}"
        )
        
        return job


# Create service instance
job_service = JobService()