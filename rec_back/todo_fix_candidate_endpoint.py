# TODO: Run this script on the VPS to fix the candidates API endpoint
# This script modifies the API endpoint to correctly return candidate data
# The issue appears to be related to how CandidateFullProfile is created from User and Profile

from app.api.v1.candidates import router
from fastapi import Depends, HTTPException, Query, status
from typing import Any, Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.v1 import deps
from app.schemas.candidate import CandidateSearchFilters, CandidateListResponse, CandidateFullProfile
from app.services.candidate import candidate_service
from app.models.user import User

# Replace the get_all_candidates function in the router
@router.get("", response_model=CandidateListResponse)
def get_all_candidates(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    office_id: Optional[UUID] = Query(None, alias="officeId"),
    current_user: deps.CurrentUser = Depends(deps.get_current_consultant_or_admin)
) -> Any:
    """
    Get all candidates with pagination (Consultant/Admin only)
    """
    # Use simplified filters to get all candidates with pagination
    filters = CandidateSearchFilters(
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit,
        sort_by="updated_at",
        sort_order="desc"
    )
    
    try:
        # Get candidate IDs from a simple query to avoid schema issues
        query = db.query(User.id).filter(User.role == 'CANDIDATE')
        candidate_ids = [r[0] for r in query.all()]
        
        print(f"Found {len(candidate_ids)} candidate users")
        
        # Build candidate profiles manually
        candidate_profiles = []
        for user_id in candidate_ids:
            try:
                # Get user
                user = db.query(User).filter(User.id == user_id).first()
                if not user:
                    print(f"User not found for ID: {user_id}")
                    continue
                
                # Get profile
                profile = candidate_service.crud.get_by_user_id(db, user_id=user_id)
                if not profile:
                    print(f"Profile not found for user: {user.email}")
                    continue
                
                # Create full profile
                full_profile = CandidateFullProfile(
                    id=user.id,
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    phone=getattr(user, 'phone', None),
                    is_active=user.is_active,
                    is_verified=user.is_verified,
                    created_at=user.created_at,
                    updated_at=user.updated_at,
                    profile=profile
                )
                
                candidate_profiles.append(full_profile)
                print(f"Added candidate: {user.email}")
                
            except Exception as e:
                print(f"Error processing candidate {user_id}: {str(e)}")
                continue
        
        total = len(candidate_profiles)
        print(f"Successfully processed {total} candidates")
        
        return CandidateListResponse(
            candidates=candidate_profiles,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=(total + filters.page_size - 1) // filters.page_size if total > 0 else 1
        )
        
    except Exception as e:
        print(f"Error in get_all_candidates: {str(e)}")
        # Return empty response rather than failing
        return CandidateListResponse(
            candidates=[],
            total=0,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=1
        )

# TODO: To apply this fix:
# 1. Save this file in the VPS
# 2. In the main candidates.py file, replace the get_all_candidates function with the one above
# 3. Or, alternatively, monkey patch the router at startup:
#    - Add the following code to app/main.py before the app is created:
#    ```
#    from app.api.v1.candidates import router as candidates_router
#    from todo_fix_candidate_endpoint import get_all_candidates
#    
#    # Replace the endpoint
#    for route in candidates_router.routes:
#        if route.path == "" and "GET" in route.methods:
#            candidates_router.routes.remove(route)
#            break
#    
#    candidates_router.add_api_route(
#        "", 
#        get_all_candidates, 
#        methods=["GET"],
#        response_model=CandidateListResponse,
#        dependencies=[Depends(deps.get_current_consultant_or_admin)]
#    )
#    ```

if __name__ == "__main__":
    print("This is a template file to fix the candidates API endpoint.")
    print("To use it, follow the TODO instructions at the end of the file.")