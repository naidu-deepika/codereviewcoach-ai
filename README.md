# CodeReviewCoach-AI

An AI code-review tutor for programming students. Paste Python code, get beginner-friendly feedback,
a corrected version, a score you can check, and a history of your progress.

> **Scope of this release:** Python only. Java, C and other languages are shown in the editor as
> "coming soon" and cannot be selected. Your code is sent to Google Gemini for the AI part of each review.

## What it does

- **Verified checks:** real rules read your code with Python's `ast` module, with exact line numbers.
  The code is never executed. Rules: bare `except`, mutable default argument, `eval()`/`exec()`, `== None`.
- **AI suggestions:** Gemini adds more feedback. These are always labelled *AI suggestion* and kept apart
  from verified checks. Line numbers from the AI are validated, and duplicates of verified checks are dropped.
- **Syntax errors:** reported directly, with no AI call and no score.
- **Score out of 100:** 100 minus penalties (verified: high 15, medium 8, low 3; AI: high 8, medium 4, low 1),
  never below 0. The breakdown is shown with every score. It is an estimate, not proof the code is correct.
- **Recheck:** the corrected code is run through the same verified checks (resolved / still present / new).
- **Accounts:** sign up and sign in, passwords hashed with scrypt, login tokens signed with `SECRET_KEY`.
- **History, dashboard, progress:** every review made while signed in is saved; all numbers come from saved reviews.
- **Profile:** edit name, experience level and preferred languages (a preference only).
- **Practice:** hand-written exercises matched to your most common mistakes (not graded, no code is run).
- **Markdown report** download for any review.

## Requirements

Python 3.10+, Node.js 20+ (22 LTS recommended), and a free Gemini API key from Google AI Studio.

## First-time setup

```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env      # then open .env and fill in GEMINI_API_KEY and SECRET_KEY

# Frontend
cd ..\frontend
npm install
```

Create `SECRET_KEY` with: `python -c "import secrets; print(secrets.token_hex(32))"`.
If the Gemini model name stops working, change `GEMINI_MODEL` in `.env` (models get retired).

## Run

Terminal 1:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8001
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Open http://localhost:5173. API docs: http://127.0.0.1:8001/docs.
The database file `backend/codereviewcoach.db` is created automatically on first start.

## Tests

```powershell
cd backend
python -m pytest -q
```

The tests use a temporary database and a fake AI, so they never touch your real data or call Gemini.
They cover health, sign-up and login, wrong passwords, review saving, history, user isolation,
dashboard and progress numbers, profile, delete, and practice.

## API

| Method and path | Needs login | Purpose |
|---|---|---|
| `GET /api/v1/health` | no | Health check |
| `POST /api/v1/auth/register`, `/login` | no | Create account / sign in |
| `GET /api/v1/auth/me` | yes | Current user |
| `POST /api/v1/reviews` | optional | Review code (saved only when signed in) |
| `GET /api/v1/reviews`, `/reviews/{id}` | yes | Your history |
| `DELETE /api/v1/reviews/{id}` | yes | Delete one of your reviews |
| `GET /api/v1/dashboard`, `/progress` | yes | Statistics from your saved reviews |
| `GET`/`PUT /api/v1/profile` | yes | View / update your profile |
| `GET /api/v1/practice` | yes | Exercises matched to your mistakes |

## Security notes

- The Gemini key lives only in `backend/.env`, which Git ignores. Never put keys in `frontend`.
- Submitted code is treated as data: it is never executed, it is wrapped in tags in the prompt, and
  look-alike tags are stripped. Requests are limited to 20,000 characters and have timeouts.
- Each user can only read, list or delete their own reviews.
- Error messages shown to users never include stack traces.

## Not built yet

RAG (ChromaDB), other AI providers (Hugging Face, Grok), Java and C analyzers, changing email or password,
password reset, rate limiting, and deployment (PostgreSQL, hosting).

## Project layout

```text
backend/app/   api (routes), ai (Gemini + prompt), analysis (static rules), services (review, score,
               history, stats, practice), db (SQLAlchemy models), schemas, core (config, security)
backend/tests/ automated tests
frontend/src/  pages, components, layouts, services (API client), context (auth), utils
```
