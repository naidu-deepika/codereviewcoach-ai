from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Review, User, UserProfile
from app.schemas.profile import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])


def _build(db: Session, user: User) -> ProfileOut:
    profile = db.get(UserProfile, user.id)
    total = db.scalar(select(func.count()).select_from(Review).where(Review.user_id == user.id))
    return ProfileOut(
        name=user.name,
        email=user.email,
        experience_level=profile.experience_level if profile else "beginner",
        languages=profile.languages if profile and profile.languages else [],
        total_reviews=total or 0,
        member_since=user.created_at,
    )


@router.get("", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _build(db, user)


@router.put("", response_model=ProfileOut)
def update_profile(
    body: ProfileUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    user.name = body.name
    profile = db.get(UserProfile, user.id)
    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    profile.experience_level = body.experience_level
    profile.languages = body.languages
    db.commit()
    db.refresh(user)
    return _build(db, user)
