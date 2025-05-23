from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
import logging
from datetime import datetime

from app.models.candidate import CandidateProfile
from app.models.user import User, UserRole
from app.models.skill import Skill
from app.schemas.candidate import (
    CandidateProfileCreate, CandidateProfileUpdate,
    CandidateFullProfile, CandidateSearchFilters,
    EducationCreate, EducationUpdate,
    WorkExperienceCreate, WorkExperienceUpdate,
    CandidateJobPreferenceUpdate,
    CandidateSkillCreate
)
from app.crud import (
    candidate_profile as candidate_crud,
    education as education_crud,
    work_experience as experience_crud,
    candidate_job_preference as preference_crud,
    candidate_notification_settings as notification_crud,
    candidate_skill as skill_crud
)
from app.services.base import BaseService

logger = logging.getLogger(__name__)


class CandidateService(BaseService[CandidateProfile, type(candidate_crud)]):
    """Service for handling candidate operations"""
    
    def __init__(self):
        super().__init__(candidate_crud)
        self.education_crud = education_crud
        self.experience_crud = experience_crud
        self.preference_crud = preference_crud
        self.notification_crud = notification_crud
        self.skill_crud = skill_crud
    
    def create_candidate_profile(
        self,
        db: Session,
        *,
        user_id: UUID,
        profile_data: CandidateProfileCreate
    ) -> Optional[CandidateProfile]:
        """
        Create a complete candidate profile
        
        Args:
            db: Database session
            user_id: User ID
            profile_data: Profile data
            
        Returns:
            Created candidate profile
        """
        logger.info(f"Creating candidate profile for user {user_id}")
        
        # Verify user exists and has candidate role
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.role != UserRole.CANDIDATE:
            logger.error(f"Invalid user {user_id} for candidate profile")
            return None
        
        # Check if profile already exists
        existing = self.crud.get_by_user_id(db, user_id=user_id)
        if existing:
            logger.warning(f"Candidate profile already exists for user {user_id}")
            return existing
        
        # Create profile
        profile_data.user_id = user_id
        profile = self.crud.create(db, obj_in=profile_data)
        
        # Create default notification settings
        self.notification_crud.create_or_update(
            db, 
            candidate_id=profile.id,
            obj_in={"email_alerts": True, "job_matches": True, "application_updates": True}
        )
        
        logger.info(f"Successfully created candidate profile {profile.id}")
        return profile
    
    def get_candidate_full_profile(
        self,
        db: Session,
        *,
        candidate_id: UUID
    ) -> Optional[CandidateFullProfile]:
        """
        Get complete candidate profile with all related data
        
        Args:
            db: Database session
            candidate_id: Candidate profile ID
            
        Returns:
            Complete candidate profile
        """
        logger.debug(f"Getting full profile for candidate {candidate_id}")
        
        candidate = self.crud.get_with_details(db, id=candidate_id)
        if not candidate:
            return None
        
        # Build full profile response
        full_profile = CandidateFullProfile(
            id=candidate.user.id,
            email=candidate.user.email,
            first_name=candidate.user.first_name,
            last_name=candidate.user.last_name,
            phone=candidate.user.phone,
            is_active=candidate.user.is_active,
            is_verified=candidate.user.is_verified,
            created_at=candidate.user.created_at,
            updated_at=candidate.user.updated_at,
            profile=candidate
        )
        
        return full_profile
    
    def update_candidate_profile(
        self,
        db: Session,
        *,
        candidate_id: UUID,
        profile_data: CandidateProfileUpdate,
        update_completion: bool = True
    ) -> Optional[CandidateProfile]:
        """
        Update candidate profile
        
        Args:
            db: Database session
            candidate_id: Candidate profile ID
            profile_data: Update data
            update_completion: Whether to update profile completion status
            
        Returns:
            Updated candidate profile
        """
        logger.info(f"Updating candidate profile {candidate_id}")
        
        profile = self.crud.update(db, id=candidate_id, obj_in=profile_data)
        if profile and update_completion:
            self.crud.update_profile_completion(db, candidate_id=candidate_id)
        
        return profile
    
    def add_education(
        self,
        db: Session,
        *,
        candidate_id: UUID,
        education_data: EducationCreate
    ):
        """
        Add education record to candidate profile
        
        Args:
            db: Database session
            candidate_id: Candidate profile ID
            education_data: Education data
            
        Returns:
            Created education record
        """
        logger.info(f"Adding education for candidate {candidate_id}")
        
        education_data.candidate_id = candidate_id
        education = self.education_crud.create(db, obj_in=education_data)
        
        # Update profile completion
        self.crud.update_profile_completion(db, candidate_id=candidate_id)
        
        return education
    
    def update_education(
        self,
        db: Session,
        *,
        education_id: UUID,
        education_data: EducationUpdate
    ):
        """Update education record"""
        logger.info(f"Updating education {education_id}")
        return self.education_crud.update(db, id=education_id, obj_in=education_data)
    
    def delete_education(
        self,
        db: Session,
        *,
        education_id: UUID
    ):
        """Delete education record"""
        logger.info(f"Deleting education {education_id}")
        education = self.education_crud.get(db, id=education_id)
        if education:
            result = self.education_crud.remove(db, id=education_id)
            # Update profile completion
            self.crud.update_profile_completion(db, candidate_id=education.candidate_id)
            return result
        return None
    
    def add_work_experience(
        self,
        db: Session,
        *,
        candidate_id: UUID,
        experience_data: WorkExperienceCreate
    ):
        """
        Add work experience to candidate profile
        
        Args:
            db: Database session
            candidate_id: Candidate profile ID
            experience_data: Experience data
            
        Returns:
            Created experience record
        """
        logger.info(f"Adding work experience for candidate {candidate_id}")
        
        experience_data.candidate_id = candidate_id
        experience = self.experience_crud.create(db, obj_in=experience_data)
        
        # Update total experience years
        total_years = self.experience_crud.calculate_total_experience(db, candidate_id=candidate_id)
        self.crud.update(
            db, 
            id=candidate_id, 
            obj_in={"years_of_experience": total_years}
        )
        
        # Update profile completion
        self.crud.update_profile_completion(db, candidate_id=candidate_id)
        
        return experience
    
    def update_work_experience(
        self,
        db: Session,
        *,
        experience_id: UUID,
        experience_data: WorkExperienceUpdate
    ):
        """Update work experience"""
        logger.info(f"Updating work experience {experience_id}")
        experience = self.experience_crud.update(db, id=experience_id, obj_in=experience_data)
        
        if experience:
            # Update total experience years
            total_years = self.experience_crud.calculate_total_experience(
                db, 
                candidate_id=experience.candidate_id
            )
            self.crud.update(
                db, 
                id=experience.candidate_id, 
                obj_in={"years_of_experience": total_years}
            )
        
        return experience
    
    def delete_work_experience(
        self,
        db: Session,
        *,
        experience_id: UUID
    ):
        """Delete work experience"""
        logger.info(f"Deleting work experience {experience_id}")
        experience = self.experience_crud.get(db, id=experience_id)
        if experience:
            candidate_id = experience.candidate_id
            result = self.experience_crud.remove(db, id=experience_id)
            
            # Update total experience years
            total_years = self.experience_crud.calculate_total_experience(
                db, 
                candidate_id=candidate_id
            )
            self.crud.update(
                db, 
                id=candidate_id, 
                obj_in={"years_of_experience": total_years}
            )
            
            # Update profile completion
            self.crud.update_profile_completion(db, candidate_id=candidate_id)
            
            return result
        return None
    
    def update_job_preferences(
        self,
        db: Session,
        *,
        candidate_id: UUID,
        preferences_data: CandidateJobPreferenceUpdate
    ):
        """Update candidate job preferences"""
        logger.info(f"Updating job preferences for candidate {candidate_id}")
        
        preferences = self.preference_crud.create_or_update(
            db, 
            candidate_id=candidate_id,
            obj_in=preferences_data
        )
        
        # Update profile completion
        self.crud.update_profile_completion(db, candidate_id=candidate_id)
        
        return preferences
    
    def update_skills(
        self,
        db: Session,
        *,
        candidate_id: UUID,
        skill_ids: List[UUID],
        skill_details: Optional[List[Dict[str, Any]]] = None
    ):
        """
        Update candidate skills
        
        Args:
            db: Database session
            candidate_id: Candidate profile ID
            skill_ids: List of skill IDs
            skill_details: Optional details for each skill (proficiency, experience)
            
        Returns:
            List of candidate skills
        """
        logger.info(f"Updating skills for candidate {candidate_id}")
        
        # Prepare skill data
        skill_data = []
        for i, skill_id in enumerate(skill_ids):
            data = {
                "skill_id": skill_id,
                "proficiency_level": None,
                "years_experience": None
            }
            
            # Add details if provided
            if skill_details and i < len(skill_details):
                data.update(skill_details[i])
            
            skill_data.append(data)
        
        # Update skills
        skills = self.skill_crud.update_candidate_skills(
            db,
            candidate_id=candidate_id,
            skill_data=skill_data
        )
        
        # Update profile completion
        self.crud.update_profile_completion(db, candidate_id=candidate_id)
        
        return skills
    
    def search_candidates(
        self,
        db: Session,
        *,
        filters: CandidateSearchFilters
    ) -> tuple[List[CandidateProfile], int]:
        """
        Search candidates with filters
        
        Args:
            db: Database session
            filters: Search filters
            
        Returns:
            Tuple of (candidates, total_count)
        """
        logger.info(f"Searching candidates with filters: {filters}")
        return self.crud.get_multi_with_search(db, filters=filters)
    
    def get_candidate_statistics(
        self,
        db: Session,
        *,
        candidate_id: UUID
    ) -> Dict[str, Any]:
        """
        Get candidate statistics
        
        Args:
            db: Database session
            candidate_id: Candidate profile ID
            
        Returns:
            Dictionary of statistics
        """
        from app.models.application import Application, ApplicationStatus
        
        candidate = self.crud.get(db, id=candidate_id)
        if not candidate:
            return {}
        
        # Get application statistics
        applications = db.query(Application)\
            .filter(Application.candidate_id == candidate_id)\
            .all()
        
        status_counts = {}
        for app in applications:
            status = app.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Get profile completion percentage
        completion_percentage = self._calculate_profile_completion(candidate)
        
        return {
            "total_applications": len(applications),
            "application_status_breakdown": status_counts,
            "profile_completion": completion_percentage,
            "total_skills": len(candidate.skills) if candidate.skills else 0,
            "years_of_experience": candidate.years_of_experience or 0,
            "education_count": len(candidate.education_records) if candidate.education_records else 0,
            "experience_count": len(candidate.experience_records) if candidate.experience_records else 0
        }
    
    def _calculate_profile_completion(self, candidate: CandidateProfile) -> int:
        """Calculate profile completion percentage"""
        total_fields = 10  # Adjust based on important fields
        completed_fields = 0
        
        if candidate.summary:
            completed_fields += 1
        if candidate.cv_urls:
            completed_fields += 1
        if candidate.current_position:
            completed_fields += 1
        if candidate.years_of_experience:
            completed_fields += 1
        if candidate.education_records:
            completed_fields += 1
        if candidate.experience_records:
            completed_fields += 1
        if candidate.skills:
            completed_fields += 1
        if candidate.preferences:
            completed_fields += 1
        if candidate.linkedin_url:
            completed_fields += 1
        if candidate.city and candidate.country:
            completed_fields += 1
        
        return int((completed_fields / total_fields) * 100)
    
    def upload_cv(
        self,
        db: Session,
        *,
        candidate_id: UUID,
        cv_url: str,
        cv_name: Optional[str] = None
    ) -> Optional[CandidateProfile]:
        """
        Upload CV for candidate
        
        Args:
            db: Database session
            candidate_id: Candidate profile ID
            cv_url: CV file URL
            cv_name: Optional CV name
            
        Returns:
            Updated candidate profile
        """
        logger.info(f"Uploading CV for candidate {candidate_id}")
        
        candidate = self.crud.get(db, id=candidate_id)
        if not candidate:
            return None
        
        # Update CV URLs
        cv_urls = candidate.cv_urls or []
        cv_data = {"url": cv_url, "name": cv_name or "CV", "uploaded_at": datetime.utcnow().isoformat()}
        cv_urls.append(cv_data)
        
        # Keep only last 5 CVs
        if len(cv_urls) > 5:
            cv_urls = cv_urls[-5:]
        
        return self.crud.update(db, id=candidate_id, obj_in={"cv_urls": cv_urls})


# Create service instance
candidate_service = CandidateService()