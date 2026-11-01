from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.services import stats_service

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return stats_service.dashboard_stats(db, user)


@router.get("/progress")
def progress(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return stats_service.progress_stats(db, user)
