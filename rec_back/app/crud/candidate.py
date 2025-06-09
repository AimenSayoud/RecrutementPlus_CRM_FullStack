from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, desc, asc, func
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.candidate import (
    CandidateProfile, CandidateEducation, CandidateExperience, 
    CandidatePreferences, CandidateSkill, CandidateNotificationSettings
)
from app.models.user import User
from app.models.skill import Skill
from app.schemas.candidate import (
    CandidateProfileCreate, CandidateProfileUpdate,
    EducationCreate, EducationUpdate,
    WorkExperienceCreate, WorkExperienceUpdate,
    CandidateJobPreferenceCreate, CandidateJobPreferenceUpdate,
    CandidateSearchFilters,
    CandidateNotificationSettingsCreate, CandidateNotificationSettingsUpdate,
    CandidateSkillCreate, CandidateSkillUpdate
)


class CRUDCandidateProfile(CRUDBase[CandidateProfile, CandidateProfileCreate, CandidateProfileUpdate]):
    def get_by_user_id(self, db: Session, *, user_id: UUID) -> Optional[CandidateProfile]:
        """Get candidate profile by user ID"""
        return db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[CandidateProfile]:
        """Get candidate profile with all related data"""
        try:
            # Load candidate with specific column selection to avoid schema issues
            # Use a safer approach by explicitly selecting columns that exist
            base_candidate = db.query(
                CandidateProfile.id,
                CandidateProfile.user_id,
                CandidateProfile.current_position,
                CandidateProfile.current_company,
                CandidateProfile.summary,
                CandidateProfile.years_of_experience,
                CandidateProfile.nationality,
                CandidateProfile.location,
                CandidateProfile.city,
                CandidateProfile.country,
                CandidateProfile.address,
                CandidateProfile.postal_code,
                CandidateProfile.profile_completed,
                CandidateProfile.profile_visibility,
                CandidateProfile.is_open_to_opportunities,
                CandidateProfile.cv_urls,
                CandidateProfile.cover_letter_url,
                CandidateProfile.linkedin_url, 
                CandidateProfile.github_url,
                CandidateProfile.portfolio_url,
                CandidateProfile.languages,
                CandidateProfile.certifications,
                CandidateProfile.awards,
                CandidateProfile.publications,
                CandidateProfile.willing_to_relocate,
                CandidateProfile.salary_expectation,
                CandidateProfile.notes,
                CandidateProfile.created_at,
                CandidateProfile.updated_at
            ).filter(CandidateProfile.id == id).first()
            
            if not base_candidate:
                return None
                
            # Create a proper ORM object
            candidate = CandidateProfile()
            # Map columns manually to avoid missing ones
            candidate.id = base_candidate.id
            candidate.user_id = base_candidate.user_id
            candidate.current_position = base_candidate.current_position
            candidate.current_company = base_candidate.current_company
            candidate.summary = base_candidate.summary
            candidate.years_of_experience = base_candidate.years_of_experience
            candidate.nationality = base_candidate.nationality
            candidate.location = base_candidate.location
            candidate.city = base_candidate.city
            candidate.country = base_candidate.country
            candidate.address = base_candidate.address
            candidate.postal_code = base_candidate.postal_code
            candidate.profile_completed = base_candidate.profile_completed
            candidate.profile_visibility = base_candidate.profile_visibility
            candidate.is_open_to_opportunities = base_candidate.is_open_to_opportunities
            candidate.cv_urls = base_candidate.cv_urls
            candidate.cover_letter_url = base_candidate.cover_letter_url
            candidate.linkedin_url = base_candidate.linkedin_url
            candidate.github_url = base_candidate.github_url
            candidate.portfolio_url = base_candidate.portfolio_url
            candidate.languages = base_candidate.languages
            candidate.certifications = base_candidate.certifications
            candidate.awards = base_candidate.awards
            candidate.publications = base_candidate.publications
            candidate.willing_to_relocate = base_candidate.willing_to_relocate
            candidate.salary_expectation = base_candidate.salary_expectation
            candidate.notes = base_candidate.notes
            candidate.created_at = base_candidate.created_at
            candidate.updated_at = base_candidate.updated_at
            
            # Manually load essential relationships
            try:
                candidate.user = db.query(User).filter(User.id == candidate.user_id).first()
                candidate.education_records = db.query(CandidateEducation).filter(CandidateEducation.candidate_id == id).all()
                candidate.experience_records = db.query(CandidateExperience).filter(CandidateExperience.candidate_id == id).all()
                candidate.skills = db.query(CandidateSkill).filter(CandidateSkill.candidate_id == id).all()
                
                # These might fail so we'll try them separately
                try:
                    candidate.preferences = db.query(CandidatePreferences).filter(CandidatePreferences.candidate_id == id).first()
                except Exception as e:
                    print(f"Error loading preferences: {e}")
                    candidate.preferences = None
                    
                try:
                    candidate.notification_settings = db.query(CandidateNotificationSettings).filter(
                        CandidateNotificationSettings.candidate_id == id).first()
                except Exception as e:
                    print(f"Error loading notification settings: {e}")
                    candidate.notification_settings = None
                
                # Load skills with skill details
                if candidate.skills:
                    for skill in candidate.skills:
                        try:
                            skill.skill = db.query(Skill).filter(Skill.id == skill.skill_id).first()
                        except Exception as e:
                            print(f"Error loading skill details: {e}")
            except Exception as rel_e:
                print(f"Error loading relationships: {rel_e}")
            
            return candidate
            
        except Exception as e:
            # Log the error and return None
            print(f"Error in get_with_details: {e}")
            return None
    
    def get_multi_with_search(
        self, 
        db: Session, 
        *, 
        filters: CandidateSearchFilters
    ) -> Tuple[List[CandidateProfile], int]:
        """Get candidates with search filters and pagination"""
        try:
            print("Starting get_multi_with_search with fixed implementation")
            
            # Get candidate users directly, which we know exists in the database
            query = db.query(User.id).filter(User.role == 'CANDIDATE')
            
            # Apply filters if needed
            if filters.query:
                search_term = f"%{filters.query}%"
                query = query.filter(
                    or_(
                        User.first_name.ilike(search_term),
                        User.last_name.ilike(search_term),
                        User.email.ilike(search_term)
                    )
                )
            
            # Get total count
            total = query.count()
            
            # Apply pagination
            offset = (filters.page - 1) * filters.page_size
            candidate_user_ids = [r[0] for r in query.offset(offset).limit(filters.page_size).all()]
            
            print(f"Found {len(candidate_user_ids)} candidate users")
            
            # Get profiles for these users
            candidates = []
            for user_id in candidate_user_ids:
                try:
                    # Get the profile
                    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
                    if profile:
                        # Manually attach the user to avoid relationship loading issues
                        profile.user = db.query(User).filter(User.id == user_id).first()
                        candidates.append(profile)
                except Exception as e:
                    print(f"Error loading candidate profile for user {user_id}: {e}")
                    
            print(f"Successfully loaded {len(candidates)} candidate profiles")
            return candidates, total
            
        except Exception as e:
            # Log the error and return empty results
            print(f"Error in get_multi_with_search: {e}")
            return [], 0
    
    def update_profile_completion(self, db: Session, *, candidate_id: UUID) -> Optional[CandidateProfile]:
        """Update profile completion status"""
        candidate = self.get(db, id=candidate_id)
        if not candidate:
            return None
        
        # Check if profile is completed
        has_education = db.query(CandidateEducation).filter(CandidateEducation.candidate_id == candidate_id).first() is not None
        has_experience = db.query(CandidateExperience).filter(CandidateExperience.candidate_id == candidate_id).first() is not None
        has_skills = db.query(CandidateSkill).filter(CandidateSkill.candidate_id == candidate_id).first() is not None
        has_preferences = db.query(CandidatePreferences).filter(CandidatePreferences.candidate_id == candidate_id).first() is not None
        
        candidate.profile_completed = (
            has_education and 
            has_experience and 
            has_skills and 
            has_preferences and
            bool(candidate.summary) and
            bool(candidate.cv_urls)
        )
        
        db.commit()
        db.refresh(candidate)
        return candidate


class CRUDEducation(CRUDBase[CandidateEducation, EducationCreate, EducationUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> List[CandidateEducation]:
        """Get all education records for a candidate"""
        return db.query(CandidateEducation)\
            .filter(CandidateEducation.candidate_id == candidate_id)\
            .order_by(desc(CandidateEducation.start_date))\
            .all()
    
    def create_for_candidate(self, db: Session, *, obj_in: EducationCreate) -> CandidateEducation:
        """Create education record for candidate"""
        db_obj = CandidateEducation(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_highest_degree(self, db: Session, *, candidate_id: UUID) -> Optional[CandidateEducation]:
        """Get highest degree for candidate"""
        # This is a simplified version - you might want to implement proper degree ranking
        return db.query(CandidateEducation)\
            .filter(CandidateEducation.candidate_id == candidate_id)\
            .order_by(desc(CandidateEducation.end_date))\
            .first()


class CRUDWorkExperience(CRUDBase[CandidateExperience, WorkExperienceCreate, WorkExperienceUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> List[CandidateExperience]:
        """Get all work experience records for a candidate"""
        return db.query(CandidateExperience)\
            .filter(CandidateExperience.candidate_id == candidate_id)\
            .order_by(desc(CandidateExperience.start_date))\
            .all()
    
    def create_for_candidate(self, db: Session, *, obj_in: WorkExperienceCreate) -> CandidateExperience:
        """Create work experience record for candidate"""
        db_obj = CandidateExperience(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_current_position(self, db: Session, *, candidate_id: UUID) -> Optional[CandidateExperience]:
        """Get current work position for candidate"""
        return db.query(CandidateExperience)\
            .filter(
                and_(
                    CandidateExperience.candidate_id == candidate_id,
                    CandidateExperience.current == True
                )
            )\
            .first()
    
    def calculate_total_experience(self, db: Session, *, candidate_id: UUID) -> int:
        """Calculate total years of experience for candidate"""
        experiences = self.get_by_candidate(db, candidate_id=candidate_id)
        
        # Simple calculation - you might want to handle overlapping periods
        from datetime import date
        total_months = 0
        
        for exp in experiences:
            if exp.start_date:
                end_date = exp.end_date if exp.end_date else date.today()
                months = (end_date.year - exp.start_date.year) * 12 + (end_date.month - exp.start_date.month)
                total_months += months
        
        return total_months // 12  # Convert to years


class CRUDCandidateJobPreference(CRUDBase[CandidatePreferences, CandidateJobPreferenceCreate, CandidateJobPreferenceUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> Optional[CandidatePreferences]:
        """Get job preferences for a candidate"""
        return db.query(CandidatePreferences)\
            .filter(CandidatePreferences.candidate_id == candidate_id)\
            .first()
    
    def create_or_update(self, db: Session, *, candidate_id: UUID, obj_in: CandidateJobPreferenceUpdate) -> CandidatePreferences:
        """Create or update job preferences for candidate"""
        existing = self.get_by_candidate(db, candidate_id=candidate_id)
        
        if existing:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            create_data = CandidateJobPreferenceCreate(
                candidate_id=candidate_id,
                **obj_in.model_dump(exclude_unset=True)
            )
            return self.create(db, obj_in=create_data)


class CRUDCandidateNotificationSettings(CRUDBase[CandidateNotificationSettings, CandidateNotificationSettingsCreate, CandidateNotificationSettingsUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> Optional[CandidateNotificationSettings]:
        """Get notification settings for a candidate"""
        return db.query(CandidateNotificationSettings)\
            .filter(CandidateNotificationSettings.candidate_id == candidate_id)\
            .first()
    
    def create_or_update(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID, 
        obj_in: CandidateNotificationSettingsUpdate
    ) -> CandidateNotificationSettings:
        """Create or update notification settings for a candidate"""
        existing = self.get_by_candidate(db, candidate_id=candidate_id)
        
        if existing:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            create_data = CandidateNotificationSettingsCreate(
                candidate_id=candidate_id,
                **obj_in.model_dump(exclude_unset=True)
            )
            return self.create(db, obj_in=create_data)
    
    def update_single_setting(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID, 
        setting_name: str, 
        value: bool
    ) -> Optional[CandidateNotificationSettings]:
        """Update a single notification setting"""
        settings = self.get_by_candidate(db, candidate_id=candidate_id)
        if not settings:
            # Create default settings if they don't exist
            settings = CandidateNotificationSettings(
                candidate_id=candidate_id,
                email_alerts=True,
                job_matches=True,
                application_updates=True
            )
            db.add(settings)
        
        if hasattr(settings, setting_name):
            setattr(settings, setting_name, value)
            db.commit()
            db.refresh(settings)
            return settings
        return None


class CRUDCandidateSkill(CRUDBase[CandidateSkill, CandidateSkillCreate, CandidateSkillUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> List[CandidateSkill]:
        """Get all skills for a candidate"""
        return db.query(CandidateSkill)\
            .options(joinedload(CandidateSkill.skill))\
            .filter(CandidateSkill.candidate_id == candidate_id)\
            .all()
    
    def update_candidate_skills(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID, 
        skill_data: List[Dict[str, Any]]
    ) -> List[CandidateSkill]:
        """Update all skills for a candidate"""
        # Delete existing skills
        db.query(CandidateSkill)\
            .filter(CandidateSkill.candidate_id == candidate_id)\
            .delete()
        
        # Add new skills
        new_skills = []
        for skill_info in skill_data:
            candidate_skill = CandidateSkill(
                candidate_id=candidate_id,
                skill_id=skill_info['skill_id'],
                proficiency_level=skill_info.get('proficiency_level'),
                years_experience=skill_info.get('years_experience')
            )
            db.add(candidate_skill)
            new_skills.append(candidate_skill)
        
        db.commit()
        for skill in new_skills:
            db.refresh(skill)
        
        return new_skills
    
    def get_by_skill(self, db: Session, *, skill_id: UUID, skip: int = 0, limit: int = 100) -> List[CandidateSkill]:
        """Get all candidates with a specific skill"""
        return db.query(CandidateSkill)\
            .options(
                joinedload(CandidateSkill.candidate).joinedload(CandidateProfile.user)
            )\
            .filter(CandidateSkill.skill_id == skill_id)\
            .offset(skip)\
            .limit(limit)\
            .all()


# Create CRUD instances
candidate_profile = CRUDCandidateProfile(CandidateProfile)
education = CRUDEducation(CandidateEducation)
work_experience = CRUDWorkExperience(CandidateExperience)
candidate_job_preference = CRUDCandidateJobPreference(CandidatePreferences)
candidate_notification_settings = CRUDCandidateNotificationSettings(CandidateNotificationSettings)
candidate_skill = CRUDCandidateSkill(CandidateSkill)