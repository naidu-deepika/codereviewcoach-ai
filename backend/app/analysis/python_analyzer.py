import ast

from app.schemas.review import Finding

MUTABLE_DEFAULTS = (ast.List, ast.Dict, ast.Set)
DANGEROUS_CALLS = {"eval", "exec"}


def _make_finding(rule, severity, category, message, explanation, node, fix):
    return Finding(
        source="static_analysis",
        category=category,
        severity=severity,
        message=message,
        explanation=explanation,
        line_start=node.lineno,
        line_end=getattr(node, "end_lineno", None) or node.lineno,
        suggested_fix=fix,
        evidence=[f"rule: {rule}"],
    )


def analyze_python(code: str) -> list[Finding]:
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        line = exc.lineno or 1
        return [
            Finding(
                source="static_analysis",
                category="correctness",
                severity="high",
                message="Syntax error",
                explanation=f"Python cannot read this code: {exc.msg}.",
                line_start=line,
                line_end=line,
                suggested_fix="Fix the syntax on this line, then review again.",
                evidence=["rule: syntax-error"],
            )
        ]
    except (ValueError, RecursionError, MemoryError):
        return [
            Finding(
                source="static_analysis",
                category="correctness",
                severity="low",
                message="Code could not be analyzed",
                explanation="The static checks could not read this code, so they were skipped.",
                evidence=["rule: analysis-skipped"],
            )
        ]

    findings = []

    for node in ast.walk(tree):
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            findings.append(
                _make_finding(
                    "bare-except", "medium", "correctness",
                    "Bare except clause",
                    "A bare 'except:' catches every error, even ones you did not expect, "
                    "which hides real bugs.",
                    node,
                    "Catch a specific error, for example 'except ValueError:'.",
                )
            )

        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            defaults = list(node.args.defaults)
            defaults += [d for d in node.args.kw_defaults if d is not None]
            for default in defaults:
                if isinstance(default, MUTABLE_DEFAULTS):
                    findings.append(
                        _make_finding(
                            "mutable-default", "medium", "correctness",
                            "Mutable default argument",
                            "A list, dict or set used as a default value is created once and "
                            "shared by every call, so changes leak between calls.",
                            default,
                            "Use None as the default, then create the list inside the function.",
                        )
                    )

        elif (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id in DANGEROUS_CALLS
        ):
            findings.append(
                _make_finding(
                    "dangerous-call", "high", "security",
                    f"Use of {node.func.id}()",
                    f"{node.func.id}() runs text as code, which is unsafe if the text "
                    "can come from a user.",
                    node,
                    "Avoid it. For simple values, use ast.literal_eval() instead.",
                )
            )

        elif isinstance(node, ast.Compare):
            for op, right in zip(node.ops, node.comparators):
                is_equality = isinstance(op, (ast.Eq, ast.NotEq))
                if is_equality and isinstance(right, ast.Constant) and right.value is None:
                    findings.append(
                        _make_finding(
                            "none-comparison", "low", "style",
                            "Comparison to None with ==",
                            "None should be checked by identity, not by equality.",
                            node,
                            "Use 'is None' or 'is not None'.",
                        )
                    )

    findings.sort(key=lambda f: f.line_start or 0)
    return findings
