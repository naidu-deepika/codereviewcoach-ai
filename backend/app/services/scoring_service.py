from app.schemas.review import Finding

STATIC_PENALTY = {"high": 15, "medium": 8, "low": 3}
AI_PENALTY = {"high": 8, "medium": 4, "low": 1}


def calculate_score(findings: list[Finding]) -> tuple[int, list[str]]:
    total = 0
    details = []

    groups = (
        ("static_analysis", STATIC_PENALTY, "Verified check"),
        ("ai_suggestion", AI_PENALTY, "AI suggestion"),
    )
    for source, table, label in groups:
        for severity in ("high", "medium", "low"):
            count = sum(
                1 for f in findings if f.source == source and f.severity == severity
            )
            if count:
                penalty = count * table[severity]
                total += penalty
                details.append(f"{label}, {severity}: {count} x {table[severity]} = -{penalty}")

    score = max(0, 100 - total)
    details.append(f"Score = 100 - {total} = {score} (never below 0)")
    return score, details
