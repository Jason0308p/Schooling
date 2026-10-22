# Schooling — Cross-Agent Project Instructions

This file is the canonical entry point for AI agents working on Schooling. It is intended for Hermes, Codex, Claude Code, OpenCode, and other coding agents.

## Project

- Root: `C:/Users/syf/Desktop/code/Schooling`
- Repository: `Jason0308p/Schooling`, branch `main`
- Production: `https://schooling.jason0308p.workers.dev`
- Architecture: static SPA deployed to Cloudflare Workers; SQL exercises run in the browser with SQLite/sql.js.
- Current verified scope: 10 courses, 90 lessons, 250 exercises.

## Required Reading

Before changing files, read the documents relevant to the task:

- `README.md`: local usage and repository orientation.
- `docs/ARCHITECTURE.md`: layers, data flow, grading, and extension points.
- `docs/CONTENT_GUIDE.md`: required before creating or editing course content.
- `docs/DEPLOY.md`: required before building or deploying.
- `docs/CURRICULUM.md`: curriculum status and course planning.
- `docs/AGENT_CHANGELOG.md`: durable decisions made by previous agents.

Do not rely only on chat history or model memory. Inspect the live files and Git status before acting.

## Architecture Rules

- Dependency direction is `ui -> core -> content`; do not reverse it.
- `src/core/grader.js`, `src/core/markdown.js`, and `content/**` must remain browser-independent JavaScript and must not access `window` or `document`.
- Do not reintroduce or reference the deleted legacy project `n8n_project/SQL_te`.
- Do not use n8n for Schooling unless the user explicitly changes this decision.

## Stable Identifier Rules

Published identifiers are user progress keys and must not be renamed or reused:

- Course IDs
- Unit IDs
- Lesson IDs
- Exercise IDs

New courses must use globally unique prefixes for unit, lesson, and exercise IDs. Existing examples include `ga4-`, `pm-`, `ls-`, `int-`, `xl-`, `gh-`, `ai-`, and `pe-`.

Titles, explanations, and answers may be improved without changing IDs.

## Course Content Rules

### SQL courses

- SQL must execute correctly against the configured SQLite dataset.
- Questions must uniquely determine the expected columns, filtering, grouping, ordering, and tie-breaking behavior.
- Set `ordered: true` only when result order is explicitly required.
- `negatives` must be SQL strings that execute successfully but produce an incorrect result; syntax errors are not useful negatives.
- Do not hard-code dataset result counts or numeric answers into lessons.
- Use ` ```sql run ` blocks for runnable lesson examples.

### Non-SQL courses

- Set `dataset: null`.
- Use MCQ exercises with `type: 'mcq'`.
- Every MCQ must have exactly four options.
- `answer` is a zero-based integer from 0 through 3.
- Include an explanation that teaches why the answer is correct.

### Lesson writing

- Start with why the concept matters in real work, then teach the method, then explain common mistakes.
- Use `TIP`, `WARN`, `BIZ`, `DIALECT`, and `NOTE` callouts where appropriate.
- Prefer concrete, reusable examples over abstract descriptions.

## Validation and Verification

After every change under `content/`, run:

```bash
node tools/validate-content.mjs
```

All checks must pass before the task is considered complete. The validator checks IDs, required fields, lesson files, runnable SQL, answers, alternatives, negatives, and ordering rules.

For UI changes, inspect the actual page in a browser. Opening `index.html` through `file://` is not a valid test. Use the local server described in `README.md` or `docs/DEPLOY.md`.

## Distribution Build

`dist/` is generated deployment output and must be rebuilt completely. Never incrementally copy files into an existing `dist/`, because stale files can produce mixed versions.

The deployment build must include:

- `index.html`
- `_headers`
- `og-image.png`
- `src/`
- `content/`

Read `docs/DEPLOY.md` for the current commands rather than assuming an old command is still correct.

## Git, Deployment, and Safety

- Check `git status` and recent history before modifying the repository.
- Never force-push, rewrite history, delete branches, or run destructive Git operations unless explicitly requested.
- Never commit secrets, API keys, credentials, personal data, or information from unrelated private projects.
- This is a public repository.
- Deployment and Git push are external side effects and require explicit user approval.
- When reporting Git activity, list commits, pushes, and branch actions, and explicitly state whether any force push or history rewrite occurred.
- Preserve `start.bat` as CRLF and ASCII-only.

## Maintaining Shared Agent Knowledge

- `AGENTS.md` is the canonical cross-agent rules file.
- Do not modify `CLAUDE.md` unless the user explicitly requests it; Claude-specific project data remains independently maintained.
- Put detailed domain procedures in the relevant document under `docs/` rather than duplicating them here.
- Record durable decisions or workflow changes in `docs/AGENT_CHANGELOG.md`.
- Do not record temporary task progress, verbose session logs, or speculative ideas as permanent rules.
- When changing a rule, update both the authoritative domain document and any summary in this file that would otherwise become inaccurate.

## Definition of Done

A task is complete only when:

1. Every requested requirement is implemented.
2. Required validation passes.
3. UI behavior is browser-tested when relevant.
4. Generated deployment files are rebuilt when deployment is requested.
5. External effects such as deployment or push are performed only after approval and verified afterward.
6. The response identifies what changed, what was verified, and what remains.