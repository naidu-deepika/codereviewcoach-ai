from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    reviews: Mapped[list["Review"]] = relationship(back_populates="owner")


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    language: Mapped[str] = mapped_column(String(20))
    code: Mapped[str] = mapped_column(Text)
    summary: Mapped[str] = mapped_column(Text)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    score_details: Mapped[list] = mapped_column(JSON, default=list)
    findings: Mapped[list] = mapped_column(JSON, default=list)
    issue_count: Mapped[int] = mapped_column(Integer, default=0)
    corrected_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verification: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)

    owner: Mapped[User] = relationship(back_populates="reviews")


class UserProfile(Base):
    """Optional profile settings. Kept in its own table so existing databases
    only need the new table, which create_all adds automatically."""

    __tablename__ = "user_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    experience_level: Mapped[str] = mapped_column(String(20), default="beginner")
    languages: Mapped[list] = mapped_column(JSON, default=list)
