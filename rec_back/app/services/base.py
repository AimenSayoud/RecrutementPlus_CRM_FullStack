from typing import TypeVar, Generic, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
import logging

from app.crud.base import CRUDBase
from app.models.base import BaseModel


ModelType = TypeVar("ModelType", bound=BaseModel)
CRUDType = TypeVar("CRUDType", bound=CRUDBase)

logger = logging.getLogger(__name__)


class BaseService(Generic[ModelType, CRUDType]):
    """
    Base service class with common functionality for all services.
    Provides standard CRUD operations and can be extended with business logic.
    """
    
    def __init__(self, crud: CRUDType):
        """
        Initialize service with CRUD instance
        
        Args:
            crud: CRUD instance for database operations
        """
        self.crud = crud
    
    def get(self, db: Session, *, id: UUID) -> Optional[ModelType]:
        """
        Get a single record by ID
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            Record if found, None otherwise
        """
        logger.debug(f"Getting {self.crud.model.__name__} with id: {id}")
        return self.crud.get(db, id=id)
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ModelType]:
        """
        Get multiple records with pagination
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of records
        """
        logger.debug(f"Getting multiple {self.crud.model.__name__} records")
        return self.crud.get_multi(db, skip=skip, limit=limit)
    
    def create(self, db: Session, *, obj_in: Any) -> ModelType:
        """
        Create a new record
        
        Args:
            db: Database session
            obj_in: Input data for creation
            
        Returns:
            Created record
        """
        logger.info(f"Creating new {self.crud.model.__name__}")
        return self.crud.create(db, obj_in=obj_in)
    
    def update(
        self, 
        db: Session, 
        *, 
        id: UUID, 
        obj_in: Any
    ) -> Optional[ModelType]:
        """
        Update an existing record
        
        Args:
            db: Database session
            id: Record ID
            obj_in: Input data for update
            
        Returns:
            Updated record if found, None otherwise
        """
        logger.info(f"Updating {self.crud.model.__name__} with id: {id}")
        db_obj = self.crud.get(db, id=id)
        if not db_obj:
            logger.warning(f"{self.crud.model.__name__} with id {id} not found")
            return None
        return self.crud.update(db, db_obj=db_obj, obj_in=obj_in)
    
    def delete(self, db: Session, *, id: UUID) -> Optional[ModelType]:
        """
        Delete a record
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            Deleted record if found, None otherwise
        """
        logger.info(f"Deleting {self.crud.model.__name__} with id: {id}")
        db_obj = self.crud.get(db, id=id)
        if not db_obj:
            logger.warning(f"{self.crud.model.__name__} with id {id} not found")
            return None
        return self.crud.remove(db, id=id)
    
    def exists(self, db: Session, *, id: UUID) -> bool:
        """
        Check if a record exists
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            True if record exists, False otherwise
        """
        return self.crud.exists(db, id=id)
    
    def count(self, db: Session) -> int:
        """
        Count total records
        
        Args:
            db: Database session
            
        Returns:
            Total number of records
        """
        return self.crud.count(db)
    
    def log_action(
        self, 
        action: str, 
        user_id: Optional[UUID] = None, 
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Log a service action for auditing
        
        Args:
            action: Action performed
            user_id: User who performed the action
            details: Additional details about the action
        """
        log_message = f"Action: {action}"
        if user_id:
            log_message += f", User: {user_id}"
        if details:
            log_message += f", Details: {details}"
        logger.info(log_message)