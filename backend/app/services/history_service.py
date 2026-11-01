from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Review, User
from app.schemas.review import ReviewDetail, ReviewResponse, ReviewSummary


def save_review(db: Session, user: User, code: str, result: ReviewResponse) -> Optional[int]:
    """Save a completed review. Syntax-error results have no score and are not saved."""
    if result.score is None:
        return None
    record = Review(
        user_id=user.id,
        language=result.language,
        code=code,
        summary=result.summary,
        score=result.score,
        score_details=result.score_details,
        findings=[f.model_dump() for f in result.findings],
        issue_count=len(result.findings),
        corrected_code=result.corrected_code,
        verification=result.verification.model_dump(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record.id


def list_reviews(db: Session, user: User, limit: int = 100) -> list[ReviewSummary]:
    rows = db.scalars(
        select(Review)
        .where(Review.user_id == user.id)
        .order_by(Review.created_at.desc(), Review.id.desc())
        .limit(limit)
    ).all()
    return [
        ReviewSummary(
            id=r.id,
            created_at=r.created_at,
            language=r.language,
            score=r.score,
            issue_count=r.issue_count,
            summary=r.summary,
        )
        for r in rows
    ]


def get_review(db: Session, user: User, review_id: int) -> Optional[ReviewDetail]:
    """Only returns the review if it belongs to this user."""
    r = db.scalar(select(Review).where(Review.id == review_id, Review.user_id == user.id))
    if r is None:
        return None
    return ReviewDetail(
        id=r.id,
        created_at=r.created_at,
        code=r.code,
        language=r.language,
        summary=r.summary,
        score=r.score,
        score_details=r.score_details or [],
        findings=r.findings or [],
        corrected_code=r.corrected_code,
        verification=r.verification or {},
    )


def delete_review(db: Session, user: User, review_id: int) -> bool:
    """Delete a review only if it belongs to this user."""
    r = db.scalar(select(Review).where(Review.id == review_id, Review.user_id == user.id))
    if r is None:
        return False
    db.delete(r)
    db.commit()
    return True
