from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
import logging
from datetime import datetime, date

from app.models.application import Application, ApplicationStatus
from app.models.job import Job, JobStatus
from app.models.candidate import CandidateProfile
from app.models.consultant import ConsultantProfile
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationWithDetails,
    ApplicationSearchFilters, ApplicationStatusChange,
    ScheduleInterview, MakeOffer, BulkApplicationUpdate
)
from app.crud import (
    application as application_crud,
    application_status_history as status_history_crud,
    application_note as note_crud,
    job as job_crud,
    candidate_profile as candidate_crud
)
from app.services.base import BaseService
from app.services.notification import notification_service

logger = logging.getLogger(__name__)


class ApplicationService(BaseService[Application, type(application_crud)]):
    """Service for handling job applications"""
    
    def __init__(self):
        super().__init__(application_crud)
        self.status_history_crud = status_history_crud
        self.note_crud = note_crud
        self.job_crud = job_crud
        self.candidate_crud = candidate_crud
        self.notification_service = notification_service
    
    def create_application(
        self,
        db: Session,
        *,
        application_data: ApplicationCreate,
        candidate_user_id: UUID
    ) -> Optional[Application]:
        """
        Create a new job application
        
        Args:
            db: Database session
            application_data: Application data
            candidate_user_id: User ID of the candidate
            
        Returns:
            Created application or None if validation fails
        """
        logger.info(f"Creating application for job {application_data.job_id} by candidate {candidate_user_id}")
        
        # Get candidate profile
        candidate = db.query(CandidateProfile).filter(
            CandidateProfile.user_id == candidate_user_id
        ).first()
        
        if not candidate:
            logger.error(f"Candidate profile not found for user {candidate_user_id}")
            return None
        
        # Verify job is open
        job = self.job_crud.get(db, id=application_data.job_id)
        if not job or job.status != JobStatus.OPEN:
            logger.error(f"Job {application_data.job_id} is not open for applications")
            return None
        
        # Check if already applied
        existing = db.query(Application).filter(
            Application.candidate_id == candidate.id,
            Application.job_id == application_data.job_id
        ).first()
        
        if existing:
            logger.warning(f"Candidate {candidate.id} already applied to job {application_data.job_id}")
            return existing
        
        # Set candidate ID and initial fields
        application_data.candidate_id = candidate.id
        application_data.status = ApplicationStatus.SUBMITTED
        application_data.applied_at = datetime.utcnow()
        
        # Create application
        application = self.crud.create(db, obj_in=application_data)
        
        # Create initial status history
        self.status_history_crud.create_status_change(
            db,
            application_id=application.id,
            status=ApplicationStatus.SUBMITTED,
            comment="Application submitted"
        )
        
        # Update job application count
        job.application_count = (job.application_count or 0) + 1
        db.commit()
        
        # Send notifications
        self._send_application_notifications(db, application, "new_application")
        
        logger.info(f"Successfully created application {application.id}")
        return application
    
    def update_application_status(
        self,
        db: Session,
        *,
        application_id: UUID,
        status_change: ApplicationStatusChange,
        changed_by_user_id: UUID
    ) -> Optional[Application]:
        """
        Update application status
        
        Args:
            db: Database session
            application_id: Application ID
            status_change: Status change data
            changed_by_user_id: User making the change
            
        Returns:
            Updated application
        """
        logger.info(f"Updating status for application {application_id} to {status_change.new_status}")
        
        application = self.crud.change_status(
            db,
            application_id=application_id,
            status_change=status_change,
            changed_by=changed_by_user_id
        )
        
        if not application:
            return None
        
        # Send notifications if requested
        if status_change.notify_candidate or status_change.notify_employer:
            self._send_application_notifications(
                db, 
                application, 
                "status_change",
                notify_candidate=status_change.notify_candidate,
                notify_employer=status_change.notify_employer
            )
        
        # Handle specific status transitions
        if status_change.new_status == ApplicationStatus.HIRED:
            self._handle_hire(db, application)
        
        return application
    
    def schedule_interview(
        self,
        db: Session,
        *,
        application_id: UUID,
        interview_data: ScheduleInterview,
        scheduled_by_user_id: UUID
    ) -> Optional[Application]:
        """
        Schedule interview for application
        
        Args:
            db: Database session
            application_id: Application ID
            interview_data: Interview details
            scheduled_by_user_id: User scheduling the interview
            
        Returns:
            Updated application
        """
        logger.info(f"Scheduling interview for application {application_id}")
        
        # Update application
        application = self.crud.schedule_interview(
            db,
            application_id=application_id,
            interview_data=interview_data
        )
        
        if not application:
            return None
        
        # Update status to interview scheduled
        status_change = ApplicationStatusChange(
            new_status=ApplicationStatus.INTERVIEW_SCHEDULED,
            comment=f"Interview scheduled for {interview_data.interview_date}",
            notify_candidate=interview_data.notify_candidate
        )
        
        self.update_application_status(
            db,
            application_id=application_id,
            status_change=status_change,
            changed_by_user_id=scheduled_by_user_id
        )
        
        # Send interview invitation if requested
        if interview_data.notify_candidate:
            self._send_interview_invitation(db, application, interview_data)
        
        return application
    
    def make_offer(
        self,
        db: Session,
        *,
        application_id: UUID,
        offer_data: MakeOffer,
        offered_by_user_id: UUID
    ) -> Optional[Application]:
        """
        Make offer to candidate
        
        Args:
            db: Database session
            application_id: Application ID
            offer_data: Offer details
            offered_by_user_id: User making the offer
            
        Returns:
            Updated application
        """
        logger.info(f"Making offer for application {application_id}")
        
        # Update application
        application = self.crud.make_offer(
            db,
            application_id=application_id,
            offer_data=offer_data
        )
        
        if not application:
            return None
        
        # Update status to offer made
        status_change = ApplicationStatusChange(
            new_status=ApplicationStatus.OFFER_MADE,
            comment=f"Offer made: {offer_data.salary_amount} {offer_data.currency}",
            notify_candidate=offer_data.notify_candidate
        )
        
        self.update_application_status(
            db,
            application_id=application_id,
            status_change=status_change,
            changed_by_user_id=offered_by_user_id
        )
        
        # Send offer letter if requested
        if offer_data.notify_candidate:
            self._send_offer_letter(db, application, offer_data)
        
        return application
    
    def add_note(
        self,
        db: Session,
        *,
        application_id: UUID,
        note_text: str,
        consultant_id: UUID
    ):
        """
        Add note to application
        
        Args:
            db: Database session
            application_id: Application ID
            note_text: Note text
            consultant_id: Consultant adding the note
            
        Returns:
            Created note
        """
        logger.info(f"Adding note to application {application_id}")
        
        return self.note_crud.create_note(
            db,
            application_id=application_id,
            consultant_id=consultant_id,
            note_text=note_text
        )
    
    def bulk_update_applications(
        self,
        db: Session,
        *,
        bulk_update: BulkApplicationUpdate,
        updated_by_user_id: UUID
    ) -> Dict[str, Any]:
        """
        Bulk update multiple applications
        
        Args:
            db: Database session
            bulk_update: Bulk update data
            updated_by_user_id: User performing the update
            
        Returns:
            Update results
        """
        logger.info(f"Bulk updating {len(bulk_update.application_ids)} applications")
        
        return self.crud.bulk_update(
            db,
            bulk_update=bulk_update,
            updated_by=updated_by_user_id
        )
    
    def search_applications(
        self,
        db: Session,
        *,
        filters: ApplicationSearchFilters
    ) -> tuple[List[Application], int]:
        """
        Search applications with filters
        
        Args:
            db: Database session
            filters: Search filters
            
        Returns:
            Tuple of (applications, total_count)
        """
        logger.info(f"Searching applications with filters: {filters}")
        return self.crud.get_multi_with_search(db, filters=filters)
    
    def get_application_with_details(
        self,
        db: Session,
        *,
        application_id: UUID
    ) -> Optional[ApplicationWithDetails]:
        """
        Get application with all details
        
        Args:
            db: Database session
            application_id: Application ID
            
        Returns:
            Application with details
        """
        logger.debug(f"Getting application details for {application_id}")
        
        application = self.crud.get_with_details(db, id=application_id)
        if not application:
            return None
        
        # Build detailed response
        details = ApplicationWithDetails(
            id=application.id,
            candidate_id=application.candidate_id,
            candidate_name=application.candidate.user.full_name if application.candidate else None,
            candidate_email=application.candidate.user.email if application.candidate else None,
            candidate_phone=application.candidate.user.phone if application.candidate else None,
            job_id=application.job_id,
            job_title=application.job.title if application.job else None,
            job_location=application.job.location if application.job else None,
            company_name=application.job.company.name if application.job and application.job.company else None,
            consultant_id=application.consultant_id,
            consultant_name=application.consultant.user.full_name if application.consultant else None,
            status=application.status,
            applied_at=application.applied_at,
            last_updated=application.last_updated,
            created_at=application.created_at,
            updated_at=application.updated_at,
            cover_letter=application.cover_letter,
            cv_url=application.cv_url,
            portfolio_url=application.portfolio_url,
            source=application.source,
            referral_source=application.referral_source,
            interview_date=application.interview_date,
            interview_type=application.interview_type,
            interview_feedback=application.interview_feedback,
            interview_rating=application.interview_rating,
            offer_salary=application.offer_salary,
            offer_currency=application.offer_currency,
            offer_date=application.offer_date,
            offer_expiry_date=application.offer_expiry_date,
            offer_response=application.offer_response,
            candidate_feedback=application.candidate_feedback,
            employer_feedback=application.employer_feedback,
            internal_notes=application.internal_notes,
            rejection_reason=application.rejection_reason,
            rejection_feedback=application.rejection_feedback,
            application_metadata=application.application_metadata,
            status_history=application.status_history,
            notes=application.notes
        )
        
        return details
    
    def get_candidate_applications(
        self,
        db: Session,
        *,
        candidate_user_id: UUID,
        status: Optional[ApplicationStatus] = None
    ) -> List[Application]:
        """
        Get applications for a candidate
        
        Args:
            db: Database session
            candidate_user_id: Candidate user ID
            status: Optional status filter
            
        Returns:
            List of applications
        """
        # Get candidate profile
        candidate = db.query(CandidateProfile).filter(
            CandidateProfile.user_id == candidate_user_id
        ).first()
        
        if not candidate:
            return []
        
        applications = self.crud.get_by_candidate(db, candidate_id=candidate.id)
        
        if status:
            applications = [app for app in applications if app.status == status]
        
        return applications
    
    def get_application_statistics(
        self,
        db: Session,
        *,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get application statistics
        
        Args:
            db: Database session
            filters: Optional filters
            
        Returns:
            Statistics dictionary
        """
        return self.crud.get_application_stats(db, filters=filters)
    
    def _handle_hire(self, db: Session, application: Application):
        """Handle actions when candidate is hired"""
        # Update job status if all positions filled
        job = application.job
        hired_count = db.query(Application).filter(
            Application.job_id == job.id,
            Application.status == ApplicationStatus.HIRED
        ).count()
        
        # If job has max positions and all filled, close the job
        # This is simplified - you might have a positions_available field
        if hired_count >= 1:  # Assuming 1 position per job
            job.status = JobStatus.FILLED
            db.commit()
        
        # Update consultant metrics if assigned
        if application.consultant_id:
            from app.crud import consultant_candidate as consultant_candidate_crud
            consultant_candidate_crud.update_metrics(
                db,
                consultant_id=application.consultant_id,
                candidate_id=application.candidate_id,
                metric_type="placement"
            )
    
    def _send_application_notifications(
        self,
        db: Session,
        application: Application,
        notification_type: str,
        notify_candidate: bool = True,
        notify_employer: bool = True
    ):
        """Send application-related notifications"""
        # This is a placeholder - implement based on your notification system
        try:
            if notify_candidate and application.candidate:
                self.notification_service.send_notification(
                    recipient_id=application.candidate.user_id,
                    notification_type=f"application_{notification_type}",
                    data={
                        "application_id": str(application.id),
                        "job_title": application.job.title if application.job else "",
                        "company_name": application.job.company.name if application.job and application.job.company else ""
                    }
                )
            
            if notify_employer and application.job:
                # Notify employer/HR
                pass
                
        except Exception as e:
            logger.error(f"Failed to send notifications: {e}")
    
    def _send_interview_invitation(
        self,
        db: Session,
        application: Application,
        interview_data: ScheduleInterview
    ):
        """Send interview invitation to candidate"""
        # Placeholder for email/notification service
        logger.info(f"Sending interview invitation for application {application.id}")
    
    def _send_offer_letter(
        self,
        db: Session,
        application: Application,
        offer_data: MakeOffer
    ):
        """Send offer letter to candidate"""
        # Placeholder for email/notification service
        logger.info(f"Sending offer letter for application {application.id}")


# Create service instance
application_service = ApplicationService()