from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ReviewRequest(BaseModel):
    language: Literal["python"] = "python"
    code: str = Field(min_length=1, max_length=20000)


class Finding(BaseModel):
    source: Literal["static_analysis", "ai_suggestion"]
    category: str
    severity: Literal["low", "medium", "high"]
    message: str
    explanation: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    suggested_fix: Optional[str] = None
    evidence: list[str] = []
    confidence: Optional[float] = None


class Verification(BaseModel):
    performed: bool = False
    checks: list[str] = []


class ReviewResponse(BaseModel):
    id: Optional[int] = None
    language: str
    summary: str
    score: Optional[int] = None
    score_details: list[str] = []
    findings: list[Finding]
    corrected_code: Optional[str] = None
    verification: Verification


class ReviewSummary(BaseModel):
    id: int
    created_at: datetime
    language: str
    score: Optional[int] = None
    issue_count: int
    summary: str


class ReviewDetail(ReviewResponse):
    created_at: datetime
    code: str
