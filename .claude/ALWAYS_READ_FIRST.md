# Agent Jones – Always Read First

Authoritative rules for VS Code Agent work on this repo.

- Read this file **first**, then docs/VISION.md and docs/CONTEXT.md.
- If VISION.md conflicts with the current chat plan, **ask me**; default to the chat plan.
- PR-sized changes only; one feature/bug/refactor per PR.
- Schema-first: update TS/Zod types **before** behavior for API/LLM I/O.
- No secrets—use `.env.example` placeholders only.
- Prefer email+ICS booking unless GOOGLE_* envs exist.
- If envs for SMS/Google are missing, **skip** those paths gracefully.
- Validate LLM JSON with Zod; retry up to 2×; log invalid turns.
- Run: `npm run lint`, `npm run typecheck`, relevant tests; summarize results.
- Every response must include: **Summary**, **Diff**, **Tests**, (optional) **Manual QA**.
