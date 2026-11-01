import json
import logging
import re

from pydantic import ValidationError

from app.ai.gemini_provider import GeminiProvider
from app.ai.prompts import build_review_prompt
from app.analysis.python_analyzer import analyze_python
from app.schemas.review import Finding, ReviewRequest, ReviewResponse, Verification
from app.services.scoring_service import calculate_score

logger = logging.getLogger(__name__)


class ReviewError(Exception):
    pass


def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        raise ReviewError("The AI returned an answer in an unexpected format.")
    if not isinstance(data, dict):
        raise ReviewError("The AI returned an answer in an unexpected format.")
    return data


def _valid_line(value, total_lines: int):
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    if 1 <= value <= total_lines:
        return value
    return None


def _already_found(ai_finding: Finding, static_findings: list[Finding]) -> bool:
    if ai_finding.line_start is None:
        return False
    for s in static_findings:
        if s.line_start is None or s.line_end is None:
            continue
        if ai_finding.line_start <= s.line_end and s.line_start <= ai_finding.line_end:
            return True
    return False


def _recheck(original: list[Finding], corrected_code: str) -> Verification:
    after = analyze_python(corrected_code)
    before_names = [f.message for f in original]
    after_names = [f.message for f in after]

    checks = ["Re-ran the Python static checks on the corrected code."]

    resolved = [n for n in before_names if n not in after_names]
    remaining = [n for n in before_names if n in after_names]
    new = [n for n in after_names if n not in before_names]

    if resolved:
        checks.append("Resolved: " + ", ".join(resolved))
    if remaining:
        checks.append("Still present: " + ", ".join(remaining))
    if new:
        checks.append("New: " + ", ".join(new))
    if not after:
        checks.append("No static findings remain. This does not prove the code is correct.")

    return Verification(performed=True, checks=checks)


def review_code(request: ReviewRequest) -> ReviewResponse:
    static_findings = analyze_python(request.code)

    if any("rule: syntax-error" in f.evidence for f in static_findings):
        return ReviewResponse(
            language=request.language,
            summary="Python could not read your code because of a syntax error. "
            "Fix it and review again.",
            score=None,
            findings=static_findings,
            corrected_code=None,
            verification=Verification(),
        )

    prompt = build_review_prompt(request.code, request.language)

    try:
        raw_answer = GeminiProvider().generate(prompt)
    except Exception as exc:
        logger.exception("Gemini call failed")
        raise ReviewError(
            "The AI service is unavailable right now. Please try again."
        ) from exc

    data = _extract_json(raw_answer)
    total_lines = len(request.code.splitlines())

    ai_findings = []
    for item in data.get("findings") or []:
        if not isinstance(item, dict):
            continue

        start = _valid_line(item.get("line_start"), total_lines)
        end = _valid_line(item.get("line_end"), total_lines)
        if start is None:
            end = None
        elif end is None or end < start:
            end = start

        try:
            ai_findings.append(
                Finding(
                    source="ai_suggestion",
                    category=str(item.get("category") or "general"),
                    severity=item.get("severity"),
                    message=item.get("message"),
                    explanation=item.get("explanation"),
                    line_start=start,
                    line_end=end,
                    suggested_fix=item.get("suggested_fix"),
                )
            )
        except ValidationError:
            logger.warning("Skipped a malformed finding from the AI")

    extra_ai = [f for f in ai_findings if not _already_found(f, static_findings)]

    corrected = data.get("corrected_code")
    if not isinstance(corrected, str) or not corrected.strip():
        corrected = None

    all_findings = static_findings + extra_ai
    score, score_details = calculate_score(all_findings)

    return ReviewResponse(
        language=request.language,
        summary=str(data.get("summary") or "Review complete."),
        score=score,
        score_details=score_details,
        findings=all_findings,
        corrected_code=corrected,
        verification=_recheck(static_findings, corrected) if corrected else Verification(),
    )
