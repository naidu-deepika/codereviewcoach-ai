from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.services.practice_service import practice_for

router = APIRouter(prefix="/api/v1/practice", tags=["practice"])


@router.get("")
def get_practice(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return practice_for(db, user)
