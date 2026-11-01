from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.practice import router as practice_router
from app.api.profile import router as profile_router
from app.api.reviews import router as reviews_router
from app.core.config import settings
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="CodeReviewCoach-AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(reviews_router)
app.include_router(dashboard_router)
app.include_router(profile_router)
app.include_router(practice_router)
