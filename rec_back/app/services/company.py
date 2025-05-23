from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
import logging
from datetime import datetime

from app.models.company import Company, EmployerProfile
from app.models.user import User, UserRole
from app.schemas.employer import (
    CompanyCreate, CompanyUpdate, CompanySearchFilters,
    EmployerProfileCreate, EmployerProfileUpdate,
    CompanyContactCreate, CompanyHiringPreferencesUpdate
)
from app.crud import (
    company as company_crud,
    employer_profile as employer_crud,
    company_contact as contact_crud,
    company_hiring_preferences as preferences_crud,
    recruitment_history as history_crud
)
from app.services.base import BaseService

logger = logging.getLogger(__name__)


class CompanyService(BaseService[Company, type(company_crud)]):
    """Service for handling company operations"""
    
    def __init__(self):
        super().__init__(company_crud)
        self.employer_crud = employer_crud
        self.contact_crud = contact_crud
        self.preferences_crud = preferences_crud
        self.history_crud = history_crud
    
    def create_company(
        self,
        db: Session,
        *,
        company_data: CompanyCreate,
        created_by_user_id: UUID
    ) -> Optional[Company]:
        """
        Create a new company
        
        Args:
            db: Database session
            company_data: Company data
            created_by_user_id: User creating the company
            
        Returns:
            Created company
        """
        logger.info(f"Creating company {company_data.name}")
        
        # Check if company name already exists
        existing = self.crud.get_by_name(db, name=company_data.name)
        if existing:
            logger.warning(f"Company with name {company_data.name} already exists")
            return None
        
        # Create company
        company = self.crud.create(db, obj_in=company_data)
        
        # Create employer profile for the creating user
        employer_data = EmployerProfileCreate(
            user_id=created_by_user_id,
            company_id=company.id,
            is_primary_contact=True,
            can_post_jobs=True
        )
        self.employer_crud.create(db, obj_in=employer_data)
        
        logger.info(f"Successfully created company {company.id}")
        return company
    
    def update_company(
        self,
        db: Session,
        *,
        company_id: UUID,
        company_data: CompanyUpdate,
        updated_by_user_id: UUID
    ) -> Optional[Company]:
        """
        Update company information
        
        Args:
            db: Database session
            company_id: Company ID
            company_data: Update data
            updated_by_user_id: User updating the company
            
        Returns:
            Updated company
        """
        logger.info(f"Updating company {company_id}")
        
        # Verify user has permission
        if not self._verify_company_permission(db, user_id=updated_by_user_id, company_id=company_id):
            logger.error(f"User {updated_by_user_id} does not have permission to update company {company_id}")
            return None
        
        return self.crud.update(db, id=company_id, obj_in=company_data)
    
    def add_employer(
        self,
        db: Session,
        *,
        company_id: UUID,
        user_id: UUID,
        employer_data: EmployerProfileCreate,
        added_by_user_id: UUID
    ) -> Optional[EmployerProfile]:
        """
        Add an employer to a company
        
        Args:
            db: Database session
            company_id: Company ID
            user_id: User to add as employer
            employer_data: Employer profile data
            added_by_user_id: User adding the employer
            
        Returns:
            Created employer profile
        """
        logger.info(f"Adding employer {user_id} to company {company_id}")
        
        # Verify permission
        if not self._verify_company_permission(db, user_id=added_by_user_id, company_id=company_id):
            logger.error(f"User {added_by_user_id} does not have permission to add employers to company {company_id}")
            return None
        
        # Verify user exists and has employer role
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.role != UserRole.EMPLOYER:
            logger.error(f"Invalid user {user_id} for employer profile")
            return None
        
        # Check if already an employer for this company
        existing = db.query(EmployerProfile).filter(
            EmployerProfile.user_id == user_id,
            EmployerProfile.company_id == company_id
        ).first()
        
        if existing:
            logger.warning(f"User {user_id} is already an employer for company {company_id}")
            return existing
        
        # Create employer profile
        employer_data.user_id = user_id
        employer_data.company_id = company_id
        
        profile = self.employer_crud.create(db, obj_in=employer_data)
        
        # Update company employee count
        self.crud.update_job_counts(db, company_id=company_id)
        
        return profile
    
    def update_employer_permissions(
        self,
        db: Session,
        *,
        employer_id: UUID,
        can_post_jobs: bool,
        updated_by_user_id: UUID
    ) -> Optional[EmployerProfile]:
        """
        Update employer permissions
        
        Args:
            db: Database session
            employer_id: Employer profile ID
            can_post_jobs: Whether employer can post jobs
            updated_by_user_id: User updating permissions
            
        Returns:
            Updated employer profile
        """
        logger.info(f"Updating permissions for employer {employer_id}")
        
        employer = self.employer_crud.get(db, id=employer_id)
        if not employer:
            return None
        
        # Verify permission
        if not self._verify_company_permission(db, user_id=updated_by_user_id, company_id=employer.company_id):
            logger.error(f"User {updated_by_user_id} does not have permission to update employer permissions")
            return None
        
        return self.employer_crud.update(
            db,
            id=employer_id,
            obj_in={"can_post_jobs": can_post_jobs}
        )
    
    def add_contact(
        self,
        db: Session,
        *,
        company_id: UUID,
        contact_data: CompanyContactCreate,
        added_by_user_id: UUID
    ):
        """
        Add contact to company
        
        Args:
            db: Database session
            company_id: Company ID
            contact_data: Contact data
            added_by_user_id: User adding the contact
            
        Returns:
            Created contact
        """
        logger.info(f"Adding contact to company {company_id}")
        
        # Verify permission
        if not self._verify_company_permission(db, user_id=added_by_user_id, company_id=company_id):
            logger.error(f"User {added_by_user_id} does not have permission to add contacts to company {company_id}")
            return None
        
        contact_data.company_id = company_id
        
        # If setting as primary, unset other primary contacts
        if contact_data.is_primary:
            contact = self.contact_crud.create(db, obj_in=contact_data)
            if contact:
                self.contact_crud.set_primary_contact(db, contact_id=contact.id)
            return contact
        
        return self.contact_crud.create(db, obj_in=contact_data)
    
    def update_hiring_preferences(
        self,
        db: Session,
        *,
        company_id: UUID,
        preferences_data: CompanyHiringPreferencesUpdate,
        updated_by_user_id: UUID
    ):
        """
        Update company hiring preferences
        
        Args:
            db: Database session
            company_id: Company ID
            preferences_data: Preferences data
            updated_by_user_id: User updating preferences
            
        Returns:
            Updated preferences
        """
        logger.info(f"Updating hiring preferences for company {company_id}")
        
        # Verify permission
        if not self._verify_company_permission(db, user_id=updated_by_user_id, company_id=company_id):
            logger.error(f"User {updated_by_user_id} does not have permission to update company preferences")
            return None
        
        return self.preferences_crud.create_or_update(
            db,
            company_id=company_id,
            obj_in=preferences_data
        )
    
    def search_companies(
        self,
        db: Session,
        *,
        filters: CompanySearchFilters
    ) -> tuple[List[Company], int]:
        """
        Search companies with filters
        
        Args:
            db: Database session
            filters: Search filters
            
        Returns:
            Tuple of (companies, total_count)
        """
        logger.info(f"Searching companies with filters: {filters}")
        return self.crud.get_multi_with_search(db, filters=filters)
    
    def get_company_statistics(
        self,
        db: Session,
        *,
        company_id: UUID
    ) -> Dict[str, Any]:
        """
        Get company statistics
        
        Args:
            db: Database session
            company_id: Company ID
            
        Returns:
            Statistics dictionary
        """
        logger.debug(f"Getting statistics for company {company_id}")
        
        stats = self.crud.get_company_stats(db, company_id=company_id)
        
        # Add additional statistics
        avg_time_to_fill = self.history_crud.get_average_time_to_fill(db, company_id=company_id)
        stats["average_time_to_fill"] = avg_time_to_fill
        
        # Get recent hiring trends
        recent_hires = self.history_crud.get_by_company(db, company_id=company_id, limit=10)
        stats["recent_hires"] = len(recent_hires)
        
        return stats
    
    def verify_company(
        self,
        db: Session,
        *,
        company_id: UUID,
        verified_by_user_id: UUID
    ) -> Optional[Company]:
        """
        Verify a company (admin action)
        
        Args:
            db: Database session
            company_id: Company ID
            verified_by_user_id: Admin user verifying
            
        Returns:
            Verified company
        """
        logger.info(f"Verifying company {company_id}")
        
        # Check if user is admin
        user = db.query(User).filter(User.id == verified_by_user_id).first()
        if not user or user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            logger.error(f"User {verified_by_user_id} is not authorized to verify companies")
            return None
        
        company = self.crud.update(db, id=company_id, obj_in={"is_verified": True})
        
        if company:
            self.log_action(
                "company_verified",
                user_id=verified_by_user_id,
                details={"company_id": str(company_id), "company_name": company.name}
            )
        
        return company
    
    def upgrade_to_premium(
        self,
        db: Session,
        *,
        company_id: UUID,
        upgraded_by_user_id: UUID
    ) -> Optional[Company]:
        """
        Upgrade company to premium
        
        Args:
            db: Database session
            company_id: Company ID
            upgraded_by_user_id: User upgrading
            
        Returns:
            Premium company
        """
        logger.info(f"Upgrading company {company_id} to premium")
        
        # Verify permission (company admin or system admin)
        if not self._verify_company_permission(db, user_id=upgraded_by_user_id, company_id=company_id, admin_allowed=True):
            logger.error(f"User {upgraded_by_user_id} is not authorized to upgrade company to premium")
            return None
        
        company = self.crud.update(db, id=company_id, obj_in={"is_premium": True})
        
        if company:
            self.log_action(
                "company_premium_upgrade",
                user_id=upgraded_by_user_id,
                details={"company_id": str(company_id), "company_name": company.name}
            )
        
        return company
    
    def _verify_company_permission(
        self,
        db: Session,
        *,
        user_id: UUID,
        company_id: UUID,
        admin_allowed: bool = True
    ) -> bool:
        """
        Verify if user has permission for company operations
        
        Args:
            db: Database session
            user_id: User ID
            company_id: Company ID
            admin_allowed: Whether admin users are allowed
            
        Returns:
            True if user has permission
        """
        # Check if user is employer for this company
        employer = db.query(EmployerProfile).filter(
            EmployerProfile.user_id == user_id,
            EmployerProfile.company_id == company_id
        ).first()
        
        if employer:
            return True
        
        # Check if user is admin
        if admin_allowed:
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
                return True
        
        return False
    
    def get_company_employers(
        self,
        db: Session,
        *,
        company_id: UUID
    ) -> List[EmployerProfile]:
        """
        Get all employers for a company
        
        Args:
            db: Database session
            company_id: Company ID
            
        Returns:
            List of employer profiles
        """
        return self.employer_crud.get_by_company(db, company_id=company_id)
    
    def remove_employer(
        self,
        db: Session,
        *,
        employer_id: UUID,
        removed_by_user_id: UUID
    ) -> bool:
        """
        Remove employer from company
        
        Args:
            db: Database session
            employer_id: Employer profile ID
            removed_by_user_id: User removing the employer
            
        Returns:
            True if removed successfully
        """
        logger.info(f"Removing employer {employer_id}")
        
        employer = self.employer_crud.get(db, id=employer_id)
        if not employer:
            return False
        
        # Verify permission
        if not self._verify_company_permission(db, user_id=removed_by_user_id, company_id=employer.company_id):
            logger.error(f"User {removed_by_user_id} does not have permission to remove employers")
            return False
        
        # Don't allow removing the last employer
        employer_count = db.query(EmployerProfile).filter(
            EmployerProfile.company_id == employer.company_id
        ).count()
        
        if employer_count <= 1:
            logger.error("Cannot remove the last employer from company")
            return False
        
        self.employer_crud.remove(db, id=employer_id)
        
        # Update company employee count
        self.crud.update_job_counts(db, company_id=employer.company_id)
        
        return True


# Create service instance
company_service = CompanyService()