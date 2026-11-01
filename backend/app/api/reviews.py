from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_optional_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.review import ReviewDetail, ReviewRequest, ReviewResponse, ReviewSummary
from app.services import history_service
from app.services.review_service import ReviewError, review_code

router = APIRouter(prefix="/api/v1/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse)
def create_review(
    request: ReviewRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    try:
        result = review_code(request)
    except ReviewError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # Signed-in users get their review saved. Guests still get the review.
    if user is not None:
        result.id = history_service.save_review(db, user, request.code, result)
    return result


@router.get("", response_model=list[ReviewSummary])
def list_my_reviews(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return history_service.list_reviews(db, user)


@router.get("/{review_id}", response_model=ReviewDetail)
def get_my_review(
    review_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    review = history_service.get_review(db, user, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found.")
    return review


@router.delete("/{review_id}", status_code=204)
def delete_my_review(
    review_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    if not history_service.delete_review(db, user, review_id):
        raise HTTPException(status_code=404, detail="Review not found.")
