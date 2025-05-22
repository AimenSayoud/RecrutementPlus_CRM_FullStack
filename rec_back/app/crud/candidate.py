from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, desc, asc, func
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.candidate import CandidateProfile, Education, WorkExperience, CandidateJobPreference
from app.models.user import User
from app.models.skill import Skill
from app.schemas.candidate import (
    CandidateProfileCreate, CandidateProfileUpdate,
    EducationCreate, EducationUpdate,
    WorkExperienceCreate, WorkExperienceUpdate,
    CandidateJobPreferenceCreate, CandidateJobPreferenceUpdate,
    CandidateSearchFilters
)


class CRUDCandidateProfile(CRUDBase[CandidateProfile, CandidateProfileCreate, CandidateProfileUpdate]):
    def get_by_user_id(self, db: Session, *, user_id: UUID) -> Optional[CandidateProfile]:
        """Get candidate profile by user ID"""
        return db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[CandidateProfile]:
        """Get candidate profile with all related data"""
        return db.query(CandidateProfile)\
            .options(
                joinedload(CandidateProfile.user),
                selectinload(CandidateProfile.education),
                selectinload(CandidateProfile.work_experience),
                joinedload(CandidateProfile.job_preferences)
            )\
            .filter(CandidateProfile.id == id)\
            .first()
    
    def get_multi_with_search(
        self, 
        db: Session, 
        *, 
        filters: CandidateSearchFilters
    ) -> tuple[List[CandidateProfile], int]:
        """Get candidates with search filters and pagination"""
        query = db.query(CandidateProfile)\
            .join(User, CandidateProfile.user_id == User.id)\
            .options(
                joinedload(CandidateProfile.user),
                selectinload(CandidateProfile.education),
                selectinload(CandidateProfile.work_experience)
            )
        
        # Apply filters
        if filters.query:
            search_term = f"%{filters.query}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    CandidateProfile.current_position.ilike(search_term),
                    CandidateProfile.current_company.ilike(search_term),
                    CandidateProfile.summary.ilike(search_term)
                )
            )
        
        if filters.skills:
            # Join with skills and filter by skill names
            from app.models.candidate import candidate_skills
            query = query.join(candidate_skills)\
                .join(Skill, candidate_skills.c.skill_id == Skill.id)\
                .filter(Skill.name.in_(filters.skills))
        
        if filters.experience_min is not None:
            query = query.filter(CandidateProfile.years_of_experience >= filters.experience_min)
        
        if filters.experience_max is not None:
            query = query.filter(CandidateProfile.years_of_experience <= filters.experience_max)
        
        if filters.locations:
            location_filters = [CandidateProfile.city.ilike(f"%{loc}%") for loc in filters.locations]
            query = query.filter(or_(*location_filters))
        
        if filters.remote_only:
            # This would need to be implemented based on job preferences
            pass
        
        # Count total before pagination
        total = query.distinct().count()
        
        # Apply sorting
        if filters.sort_by == "experience":
            order_column = CandidateProfile.years_of_experience
        elif filters.sort_by == "updated_at":
            order_column = CandidateProfile.updated_at
        else:  # default to created_at
            order_column = CandidateProfile.created_at
        
        if filters.sort_order == "asc":
            query = query.order_by(asc(order_column))
        else:
            query = query.order_by(desc(order_column))
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        candidates = query.offset(offset).limit(filters.page_size).all()
        
        return candidates, total
    
    def update_skills(self, db: Session, *, candidate_id: UUID, skill_ids: List[UUID]) -> CandidateProfile:
        """Update candidate skills"""
        candidate = self.get(db, id=candidate_id)
        if not candidate:
            return None
        
        # Clear existing skills
        from app.models.candidate import candidate_skills
        db.execute(
            candidate_skills.delete().where(candidate_skills.c.candidate_id == candidate_id)
        )
        
        # Add new skills
        for skill_id in skill_ids:
            db.execute(
                candidate_skills.insert().values(
                    candidate_id=candidate_id,
                    skill_id=skill_id
                )
            )
        
        db.commit()
        db.refresh(candidate)
        return candidate


class CRUDEducation(CRUDBase[Education, EducationCreate, EducationUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> List[Education]:
        """Get all education records for a candidate"""
        return db.query(Education)\
            .filter(Education.candidate_id == candidate_id)\
            .order_by(desc(Education.start_date))\
            .all()
    
    def create_for_candidate(self, db: Session, *, obj_in: EducationCreate) -> Education:
        """Create education record for candidate"""
        db_obj = Education(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDWorkExperience(CRUDBase[WorkExperience, WorkExperienceCreate, WorkExperienceUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> List[WorkExperience]:
        """Get all work experience records for a candidate"""
        return db.query(WorkExperience)\
            .filter(WorkExperience.candidate_id == candidate_id)\
            .order_by(desc(WorkExperience.start_date))\
            .all()
    
    def create_for_candidate(self, db: Session, *, obj_in: WorkExperienceCreate) -> WorkExperience:
        """Create work experience record for candidate"""
        db_obj = WorkExperience(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_current_position(self, db: Session, *, candidate_id: UUID) -> Optional[WorkExperience]:
        """Get current work position for candidate"""
        return db.query(WorkExperience)\
            .filter(
                and_(
                    WorkExperience.candidate_id == candidate_id,
                    WorkExperience.is_current == True
                )
            )\
            .first()


class CRUDCandidateJobPreference(CRUDBase[CandidateJobPreference, CandidateJobPreferenceCreate, CandidateJobPreferenceUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> Optional[CandidateJobPreference]:
        """Get job preferences for a candidate"""
        return db.query(CandidateJobPreference)\
            .filter(CandidateJobPreference.candidate_id == candidate_id)\
            .first()
    
    def create_or_update(self, db: Session, *, candidate_id: UUID, obj_in: CandidateJobPreferenceUpdate) -> CandidateJobPreference:
        """Create or update job preferences for candidate"""
        existing = self.get_by_candidate(db, candidate_id=candidate_id)
        
        if existing:
            update_data = obj_in.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            create_data = CandidateJobPreferenceCreate(
                candidate_id=candidate_id,
                **obj_in.dict(exclude_unset=True)
            )
            return self.create(db, obj_in=create_data)


# Create CRUD instances
candidate_profile = CRUDCandidateProfile(CandidateProfile)
education = CRUDEducation(Education)
work_experience = CRUDWorkExperience(WorkExperience)
candidate_job_preference = CRUDCandidateJobPreference(CandidateJobPreference)