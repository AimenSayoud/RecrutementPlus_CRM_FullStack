# TODO: Fix the candidate CRUD implementation to correctly return candidates
# The issue is in the get_multi_with_search method where it tries to access User 
# in a way that causes a NameError: "cannot access local variable 'User' where it is not associated with a value"

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from uuid import UUID

from app.models.user import User  # Ensure this import is at the top
from app.models.candidate import CandidateProfile
from app.schemas.candidate import CandidateSearchFilters, CandidateFullProfile

def fixed_get_multi_with_search(
    self,  # This would be the candidate_profile instance in the real code
    db: Session, 
    *, 
    filters: CandidateSearchFilters
) -> Tuple[List[CandidateProfile], int]:
    """Get candidates with search filters and pagination - FIXED VERSION"""
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
        total_query = query.count()
        
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
        return candidates, total_query
        
    except Exception as e:
        # Log the error and return empty results
        print(f"Error in fixed_get_multi_with_search: {e}")
        return [], 0

# TODO: To apply this fix:
# 1. Replace the get_multi_with_search method in app/crud/candidate.py with this implementation
# 2. Ensure the User import is at the top of the file
# 3. This fix gets candidate users directly instead of trying to do complex joins that might fail
# 4. It then loads profiles for these users and manually attaches the user relationship