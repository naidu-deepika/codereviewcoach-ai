from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

ALLOWED_LANGUAGES = [
    "Python", "Java", "C", "C++", "JavaScript", "TypeScript", "C#",
    "Go", "Rust", "PHP", "Kotlin", "Swift", "Ruby", "SQL",
]


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    experience_level: Literal["beginner", "intermediate", "advanced"]
    languages: list[str] = Field(default_factory=list, max_length=len(ALLOWED_LANGUAGES))

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name must not be empty")
        return value

    @field_validator("languages")
    @classmethod
    def check_languages(cls, value: list[str]) -> list[str]:
        for lang in value:
            if lang not in ALLOWED_LANGUAGES:
                raise ValueError(f"Unknown language: {lang}")
        # remove duplicates, keep the standard order
        return [lang for lang in ALLOWED_LANGUAGES if lang in value]


class ProfileOut(BaseModel):
    name: str
    email: str
    experience_level: str
    languages: list[str]
    total_reviews: int
    member_since: datetime
