# Agent Decision Changelog

This file records durable decisions that future human and AI contributors need to understand. It is not a task log. Add an entry only when a decision changes architecture, content conventions, validation, deployment, or agent workflow.

## Entry format

```markdown
## YYYY-MM-DD — Decision title

- Decision: What is now required or prohibited.
- Reason: Why the rule exists.
- Affected areas: Files or workflows that must follow it.
```

## 2026-10-28 — CI-only GitHub Actions

- Decision: GitHub Actions runs validation only (syntax check, content validator, untracked `dist/`) on push/PR to `main`. It must not deploy. Any future auto-deploy requires GitHub Actions Secrets and explicit user approval.
- Reason: Cloudflare Workers hosts the site; Actions only guards quality before release and avoids unreviewed code going live.
- Affected areas: `.github/workflows/quality-checks.yml`, `docs/CI.md`, `docs/DEPLOY.md`.

## 2026-10-28 — Lazy-load the SQL engine

- Decision: The home page, Dashboard, and non-SQL courses must not load sql.js or initialize SQLite. Load `sql-wasm.js`, its WASM file, and the dataset snapshot only when a SQL course or SQL-specific feature is opened.
- Reason: Most visitors should not pay the SQL engine startup cost before choosing a course, and non-SQL courses do not require SQLite.
- Affected areas: `index.html`, `src/main.js`, `src/core/sqlEngine.js`, SQL course routes, playground, and data views.

## 2026-10-22 — Cross-agent project instructions

- Decision: `AGENTS.md` is the canonical shared project rules entry point for agents that support it. Existing `CLAUDE.md` data remains independently maintained and must not be modified unless the user explicitly requests it.
- Reason: Schooling is maintained through multiple models, agents, Telegram sessions, and local coding tools. A repository-backed source of truth prevents model memory and session history from becoming the only place where rules exist.
- Affected areas: All AI-assisted work in this repository.

## 2026-10-22 — Full `dist/` rebuild before deployment

- Decision: Delete and completely recreate `dist/` before every deployment; never use incremental copying.
- Reason: Incremental copying previously left stale files in the deployment directory and caused production to show a mixture of old and new versions.
- Affected areas: `docs/DEPLOY.md`, deployment commands, Cloudflare Worker releases.

## 2026-10-22 — Globally unique course ID prefixes

- Decision: Every new course must use a unique prefix for unit, lesson, and exercise IDs. Published IDs must never be renamed or reused.
- Reason: Progress is stored by ID, and duplicate or renamed IDs can collide with other courses or erase apparent user progress.
- Affected areas: `content/courses/**`, `content/catalog.js`, `docs/CONTENT_GUIDE.md`.

## 2026-10-22 — Non-SQL course representation

- Decision: Non-SQL courses use `dataset: null` and four-option MCQ exercises with zero-based answers.
- Reason: The platform supports both executable SQL exercises and conceptual learning without creating fake datasets or SQL editors for non-SQL material.
- Affected areas: PRD, Looker Studio, AI workflow, Prompt Engineering, and future non-SQL courses.

## 2026-10-22 — No n8n dependency

- Decision: Schooling does not use n8n unless the user explicitly reverses this decision.
- Reason: The current product is a self-contained static learning platform, and the user requested that the AI courses and content architecture not depend on n8n.
- Affected areas: Architecture proposals, content automation, deployment design.