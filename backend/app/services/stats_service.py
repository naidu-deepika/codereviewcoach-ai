from collections import Counter

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Review, User


def _reviews(db: Session, user: User) -> list[Review]:
    return list(
        db.scalars(
            select(Review).where(Review.user_id == user.id).order_by(Review.created_at, Review.id)
        ).all()
    )


def dashboard_stats(db: Session, user: User) -> dict:
    reviews = _reviews(db, user)
    scores = [r.score for r in reviews if r.score is not None]

    mistakes = Counter()
    for r in reviews:
        for f in r.findings or []:
            mistakes[f.get("message", "Unknown")] += 1

    by_day: dict[str, list[int]] = {}
    for r in reviews:
        by_day.setdefault(r.created_at.date().isoformat(), []).append(r.score)

    return {
        "total_reviews": len(reviews),
        "average_score": round(sum(scores) / len(scores), 1) if scores else 0,
        "total_issues": sum(r.issue_count for r in reviews),
        "common_mistakes": [
            {"message": m, "count": c} for m, c in mistakes.most_common(5)
        ],
        "reviews_over_time": [
            {
                "date": day,
                "count": len(day_scores),
                "average_score": round(sum(s for s in day_scores if s is not None) / len(day_scores), 1),
            }
            for day, day_scores in sorted(by_day.items())
        ],
        "languages": [
            {"language": lang, "count": c}
            for lang, c in Counter(r.language for r in reviews).most_common()
        ],
    }


def progress_stats(db: Session, user: User) -> dict:
    reviews = [r for r in _reviews(db, user) if r.score is not None]
    trend = [
        {"review_id": r.id, "date": r.created_at.isoformat(), "score": r.score} for r in reviews
    ]
    if not reviews:
        return {"score_trend": [], "first_score": None, "latest_score": None,
                "best_score": None, "change": 0}
    first, latest = reviews[0].score, reviews[-1].score
    return {
        "score_trend": trend,
        "first_score": first,
        "latest_score": latest,
        "best_score": max(r.score for r in reviews),
        "change": latest - first,
    }
