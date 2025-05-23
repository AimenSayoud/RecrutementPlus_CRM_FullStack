from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
import logging
from datetime import datetime, date

from app.models.consultant import ConsultantProfile, ConsultantStatus
from app.models.user import User, UserRole
from app.schemas.consultant import (
    ConsultantProfileCreate, ConsultantProfileUpdate,
    ConsultantSearchFilters, ConsultantTargetCreate,
    ConsultantPerformanceReviewCreate
)
from app.crud import (
    consultant_profile as consultant_crud,
    consultant_target as target_crud,
    consultant_performance_review as review_crud,
    consultant_candidate as candidate_crud,
    consultant_client as client_crud
)
from app.services.base import BaseService

logger = logging.getLogger(__name__)


class ConsultantService(BaseService[ConsultantProfile, type(consultant_crud)]):
    """Service for handling consultant operations"""
    
    def __init__(self):
        super().__init__(consultant_crud)
        self.target_crud = target_crud
        self.review_crud = review_crud
        self.candidate_crud = candidate_crud
        self.client_crud = client_crud
    
    def create_consultant_profile(
        self,
        db: Session,
        *,
        user_id: UUID,
        profile_data: ConsultantProfileCreate
    ) -> Optional[ConsultantProfile]:
        """
        Create consultant profile
        
        Args:
            db: Database session
            user_id: User ID
            profile_data: Profile data
            
        Returns:
            Created consultant profile
        """
        logger.info(f"Creating consultant profile for user {user_id}")
        
        # Verify user exists and has consultant role
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.role != UserRole.CONSULTANT:
            logger.error(f"Invalid user {user_id} for consultant profile")
            return None
        
        # Check if profile already exists
        existing = self.crud.get_by_user_id(db, user_id=user_id)
        if existing:
            logger.warning(f"Consultant profile already exists for user {user_id}")
            return existing
        
        # Create profile
        profile_data.user_id = user_id
        profile = self.crud.create(db, obj_in=profile_data)
        
        logger.info(f"Successfully created consultant profile {profile.id}")
        return profile
    
    def update_consultant_profile(
        self,
        db: Session,
        *,
        consultant_id: UUID,
        profile_data: ConsultantProfileUpdate
    ) -> Optional[ConsultantProfile]:
        """
        Update consultant profile
        
        Args:
            db: Database session
            consultant_id: Consultant ID
            profile_data: Update data
            
        Returns:
            Updated consultant profile
        """
        logger.info(f"Updating consultant profile {consultant_id}")
        
        profile = self.crud.update(db, id=consultant_id, obj_in=profile_data)
        
        # Update performance metrics if needed
        if profile:
            self.crud.update_performance_metrics(db, consultant_id=consultant_id)
        
        return profile
    
    def assign_candidate(
        self,
        db: Session,
        *,
        consultant_id: UUID,
        candidate_id: UUID,
        assigned_by_user_id: UUID,
        notes: Optional[str] = None
    ):
        """
        Assign candidate to consultant
        
        Args:
            db: Database session
            consultant_id: Consultant ID
            candidate_id: Candidate ID
            assigned_by_user_id: User making the assignment
            notes: Optional notes
            
        Returns:
            Assignment record
        """
        logger.info(f"Assigning candidate {candidate_id} to consultant {consultant_id}")
        
        # Verify consultant exists and is active
        consultant = self.crud.get(db, id=consultant_id)
        if not consultant or consultant.status != ConsultantStatus.ACTIVE:
            logger.error(f"Consultant {consultant_id} is not active")
            return None
        
        # Create assignment
        assignment = self.candidate_crud.assign_candidate(
            db,
            consultant_id=consultant_id,
            candidate_id=candidate_id,
            notes=notes
        )
        
        # Update consultant metrics
        self.crud.update_performance_metrics(db, consultant_id=consultant_id)
        
        # Log action
        self.log_action(
            "candidate_assigned",
            user_id=assigned_by_user_id,
            details={
                "consultant_id": str(consultant_id),
                "candidate_id": str(candidate_id)
            }
        )
        
        return assignment
    
    def assign_client(
        self,
        db: Session,
        *,
        consultant_id: UUID,
        company_id: UUID,
        assigned_by_user_id: UUID,
        is_primary: bool = False,
        notes: Optional[str] = None
    ):
        """
        Assign client company to consultant
        
        Args:
            db: Database session
            consultant_id: Consultant ID
            company_id: Company ID
            assigned_by_user_id: User making the assignment
            is_primary: Whether consultant is primary for this client
            notes: Optional notes
            
        Returns:
            Assignment record
        """
        logger.info(f"Assigning client {company_id} to consultant {consultant_id}")
        
        # Verify consultant exists and is active
        consultant = self.crud.get(db, id=consultant_id)
        if not consultant or consultant.status != ConsultantStatus.ACTIVE:
            logger.error(f"Consultant {consultant_id} is not active")
            return None
        
        # Create assignment
        assignment = self.client_crud.assign_client(
            db,
            consultant_id=consultant_id,
            company_id=company_id,
            is_primary=is_primary,
            notes=notes
        )
        
        # Update consultant metrics
        self.crud.update_performance_metrics(db, consultant_id=consultant_id)
        
        # Log action
        self.log_action(
            "client_assigned",
            user_id=assigned_by_user_id,
            details={
                "consultant_id": str(consultant_id),
                "company_id": str(company_id),
                "is_primary": is_primary
            }
        )
        
        return assignment
    
    def set_target(
        self,
        db: Session,
        *,
        consultant_id: UUID,
        target_data: ConsultantTargetCreate,
        set_by_user_id: UUID
    ):
        """
        Set performance target for consultant
        
        Args:
            db: Database session
            consultant_id: Consultant ID
            target_data: Target data
            set_by_user_id: User setting the target
            
        Returns:
            Created target
        """
        logger.info(f"Setting target for consultant {consultant_id}")
        
        # Verify consultant exists
        consultant = self.crud.get(db, id=consultant_id)
        if not consultant:
            return None
        
        # Create target
        target_data.consultant_id = consultant_id
        target = self.target_crud.create(db, obj_in=target_data)
        
        # Log action
        self.log_action(
            "target_set",
            user_id=set_by_user_id,
            details={
                "consultant_id": str(consultant_id),
                "target_type": target_data.target_type,
                "target_value": str(target_data.target_value)
            }
        )
        
        return target
    
    def create_performance_review(
        self,
        db: Session,
        *,
        consultant_id: UUID,
        review_data: ConsultantPerformanceReviewCreate,
        reviewer_user_id: UUID
    ):
        """
        Create performance review for consultant
        
        Args:
            db: Database session
            consultant_id: Consultant ID
            review_data: Review data
            reviewer_user_id: User creating the review
            
        Returns:
            Created review
        """
        logger.info(f"Creating performance review for consultant {consultant_id}")
        
        # Verify consultant exists
        consultant = self.crud.get(db, id=consultant_id)
        if not consultant:
            return None
        
        # Create review
        review_data.consultant_id = consultant_id
        review_data.reviewer_id = reviewer_user_id
        review = self.review_crud.create(db, obj_in=review_data)
        
        # Update consultant's next review date
        if review:
            self.crud.update(
                db,
                id=consultant_id,
                obj_in={
                    "last_performance_review": datetime.utcnow(),
                    "next_performance_review": datetime.utcnow().replace(month=datetime.utcnow().month + 6)
                }
            )
        
        return review
    
    def approve_performance_review(
        self,
        db: Session,
        *,
        review_id: UUID,
        approved_by_user_id: UUID
    ):
        """
        Approve performance review
        
        Args:
            db: Database session
            review_id: Review ID
            approved_by_user_id: User approving
            
        Returns:
            Approved review
        """
        logger.info(f"Approving performance review {review_id}")
        
        review = self.review_crud.approve_review(db, review_id=review_id)
        
        if review:
            self.log_action(
                "review_approved",
                user_id=approved_by_user_id,
                details={
                    "review_id": str(review_id),
                    "consultant_id": str(review.consultant_id)
                }
            )
        
        return review
    
    def search_consultants(
        self,
        db: Session,
        *,
        filters: ConsultantSearchFilters
    ) -> tuple[List[ConsultantProfile], int]:
        """
        Search consultants with filters
        
        Args:
            db: Database session
            filters: Search filters
            
        Returns:
            Tuple of (consultants, total_count)
        """
        logger.info(f"Searching consultants with filters: {filters}")
        return self.crud.get_multi_with_search(db, filters=filters)
    
    def get_consultant_statistics(
        self,
        db: Session,
        *,
        consultant_id: UUID
    ) -> Dict[str, Any]:
        """
        Get consultant statistics
        
        Args:
            db: Database session
            consultant_id: Consultant ID
            
        Returns:
            Statistics dictionary
        """
        logger.debug(f"Getting statistics for consultant {consultant_id}")
        
        consultant = self.crud.get_with_details(db, id=consultant_id)
        if not consultant:
            return {}
        
        # Current month stats
        current_month = date.today().replace(day=1)
        current_targets = self.target_crud.get_current_targets(
            db,
            consultant_id=consultant_id,
            target_period="monthly"
        )
        
        # Performance metrics
        latest_review = self.review_crud.get_latest_review(db, consultant_id=consultant_id)
        
        # Assignment counts
        active_candidates = len([a for a in consultant.candidate_assignments if a.is_active])
        active_clients = len([a for a in consultant.client_assignments if a.is_active])
        
        # Calculate achievement percentage
        achievement_percentage = 0
        if current_targets:
            if current_targets.placement_target and current_targets.placement_target > 0:
                achievement_percentage = (
                    current_targets.actual_placements / current_targets.placement_target * 100
                )
        
        return {
            "consultant_id": str(consultant_id),
            "status": consultant.status.value,
            "performance_metrics": {
                "total_placements": consultant.total_placements,
                "successful_placements": consultant.successful_placements,
                "average_rating": float(consultant.average_rating) if consultant.average_rating else None,
                "total_revenue_generated": float(consultant.total_revenue_generated) if consultant.total_revenue_generated else 0
            },
            "current_month": {
                "placements": consultant.this_month_placements,
                "revenue": float(consultant.this_quarter_revenue) if consultant.this_quarter_revenue else 0,
                "target_achievement": round(achievement_percentage, 2)
            },
            "assignments": {
                "active_candidates": active_candidates,
                "active_clients": active_clients,
                "total_active": consultant.current_active_jobs
            },
            "latest_review": {
                "overall_rating": float(latest_review.overall_rating) if latest_review else None,
                "review_date": latest_review.review_period_end if latest_review else None
            }
        }
    
    def update_consultant_status(
        self,
        db: Session,
        *,
        consultant_id: UUID,
        status: ConsultantStatus,
        updated_by_user_id: UUID,
        reason: Optional[str] = None
    ) -> Optional[ConsultantProfile]:
        """
        Update consultant status
        
        Args:
            db: Database session
            consultant_id: Consultant ID
            status: New status
            updated_by_user_id: User updating status
            reason: Optional reason for status change
            
        Returns:
            Updated consultant profile
        """
        logger.info(f"Updating consultant {consultant_id} status to {status}")
        
        consultant = self.crud.update(db, id=consultant_id, obj_in={"status": status})
        
        if consultant:
            self.log_action(
                "consultant_status_change",
                user_id=updated_by_user_id,
                details={
                    "consultant_id": str(consultant_id),
                    "new_status": status.value,
                    "reason": reason
                }
            )
            
            # If suspending consultant, may need to reassign candidates/clients
            if status == ConsultantStatus.SUSPENDED:
                logger.warning(f"Consultant {consultant_id} suspended - consider reassigning active cases")
        
        return consultant
    
    def get_consultant_workload(
        self,
        db: Session,
        *,
        consultant_id: UUID
    ) -> Dict[str, Any]:
        """
        Get consultant workload information
        
        Args:
            db: Database session
            consultant_id: Consultant ID
            
        Returns:
            Workload information
        """
        consultant = self.crud.get(db, id=consultant_id)
        if not consultant:
            return {}
        
        # Get active assignments
        active_candidates = self.candidate_crud.get_consultant_candidates(
            db,
            consultant_id=consultant_id,
            limit=1000
        )
        active_candidates = [a for a in active_candidates if a.is_active]
        
        active_clients = self.client_crud.get_consultant_clients(
            db,
            consultant_id=consultant_id,
            limit=1000
        )
        active_clients = [a for a in active_clients if a.is_active]
        
        # Calculate workload score (simple example)
        workload_score = len(active_candidates) + (len(active_clients) * 2)
        max_workload = consultant.max_concurrent_assignments or 10
        workload_percentage = (workload_score / max_workload) * 100
        
        return {
            "consultant_id": str(consultant_id),
            "active_candidates": len(active_candidates),
            "active_clients": len(active_clients),
            "max_concurrent_assignments": max_workload,
            "workload_percentage": round(workload_percentage, 2),
            "availability_status": consultant.availability_status,
            "can_accept_more": workload_percentage < 80
        }
    
    def record_placement(
        self,
        db: Session,
        *,
        consultant_id: UUID,
        candidate_id: UUID,
        company_id: UUID,
        placement_value: Optional[float] = None
    ):
        """
        Record successful placement by consultant
        
        Args:
            db: Database session
            consultant_id: Consultant ID
            candidate_id: Candidate ID
            company_id: Company ID
            placement_value: Optional placement revenue
        """
        logger.info(f"Recording placement by consultant {consultant_id}")
        
        # Update consultant metrics
        consultant = self.crud.get(db, id=consultant_id)
        if consultant:
            consultant.total_placements += 1
            consultant.successful_placements += 1
            consultant.this_month_placements += 1
            
            if placement_value and consultant.commission_rate:
                commission = placement_value * float(consultant.commission_rate)
                consultant.total_revenue_generated = (
                    float(consultant.total_revenue_generated or 0) + commission
                )
                consultant.this_quarter_revenue = (
                    float(consultant.this_quarter_revenue or 0) + commission
                )
            
            db.commit()
        
        # Update assignment metrics
        self.candidate_crud.update_metrics(
            db,
            consultant_id=consultant_id,
            candidate_id=candidate_id,
            metric_type="placement"
        )
        
        self.client_crud.update_performance(
            db,
            consultant_id=consultant_id,
            company_id=company_id,
            metric_type="placement",
            value=placement_value
        )


# Create service instance
consultant_service = ConsultantService()