# Claude Sonnet 4.5 in VS Code Agent Mode – Agent Jones Playbook

This playbook assumes:

- You’re using **Claude Sonnet 4.5** as the model behind VS Code Agent Mode / Claude Code.
- The repo (“Agent Jones”) is a **Next.js + TypeScript** web app with API routes and a backend agent layer (for example, `backend/lib/conductor.ts`).
- Tooling (lint/tests/dev server) is defined in `package.json`.

---

## 1. What Claude can do here (and what it can’t)

### Capabilities

- **Large-context agentic coding.** Sonnet 4.5 can read and reason over large portions of the repo at once and generate substantial diffs.
- **Great fit for Next.js work.** It works well with Next.js conventions (file-based routing, API routes, React components, and TypeScript types).
- **VS Code Agent Mode.** The Claude Code VS Code extension + Agent Mode gives you:
  - A dedicated sidebar panel for chatting with Claude.
  - Multi-step “agentic” behavior: it can read files, propose edits, and run tasks/commands.
  - A diff view so you can review and accept/reject changes file by file.
- **Looping on tasks.** For non-trivial tasks, Agent Mode can iteratively:
  - Read more context.
  - Refine its plan.
  - Update diffs.
  - Re-run tests until things pass (with your confirmation).

### Limits / gotchas

- **File read/write scope.** Claude only sees what it’s given or what it opens via tools. Large files may be read in chunks; it might need several tool calls to see everything.
- **No magical checkpoints in VS Code.** You have git and branches; there is no built‑in “time travel” for the agent. Treat branches + small PRs as your checkpoints.
- **It can drift.** Long conversations drift off-topic or lose early nuance. Start a fresh conversation for each feature/bug/migration phase.
- **It’s not a replacement for reviews.** Treat Claude like a strong junior engineer: great at implementation, but you still own the design, security, and final review.

---

## 2. Default workflow for any non-trivial task

Use this loop for every feature, bugfix, refactor, or migration step.

### 2.1 Repo-codemap first (once per repo / major area)

1. Ask Claude in Agent Mode to:
   - Read (without pasting content): `README.md`, `ALWAYS_READ_FIRST.md`, any `CLAUDE*.md`, `package.json`, `next.config.*`, `tsconfig.json`.
   - Skim structure under: `app/**` or `pages/**`, `app/api/**` or `pages/api/**`, `backend/**`, `lib/**`, `tests/**` / `__tests__/**`.
2. Have it create or update `docs/REPO_CODEMAP.md` with:
   - High-level architecture (frontend, backend/agent, API routes).
   - Key directories and what they’re responsible for.
   - Where the core agent/conductor logic lives.
   - How to run dev, build, lint, and tests (from `package.json` scripts).
   - Known env vars (names only, not values).
3. Explicitly say: **“Don’t edit any non-doc files; only write docs/REPO_CODEMAP.md.”**

This codemap becomes the shared mental model for all later tasks.

---

### 2.2 The “Plan → Small Diff → Test” loop

For each concrete change:

1. **Understand & plan**
   - Ask Claude to:
     - Read the most relevant files (implementation + tests + types).
     - Summarize current behavior and data flow.
     - Propose a short plan of attack (1–6 steps).
   - Edit the plan if needed before it writes code.

2. **PR-sized implementation**
   - Keep each run scoped to one **PR-sized change**:
     - One feature slice, one bugfix, one refactor step, or one migration phase.
     - No repo‑wide renames or unrelated cleanup.
   - Ask for a **diff-only** response (or rely on the VS Code diff UI) so you can review each change in place.

3. **Test-before-change where possible**
   - For behavior changes, prefer:
     1. Add or update tests to reflect desired behavior.
     2. Run tests and confirm they fail.
     3. Change implementation until tests pass.
   - At minimum, Claude should:
     - Run `npm run lint` / `npm run typecheck`.
     - Run `npm test` or the repo’s relevant test scripts.
     - Paste or summarize terminal output.

4. **Summarize for PR**
   - End with a structured summary:
     - `## Summary` – what changed and why.
     - `## Diff` – unified diffs or a pointer to the Agent Mode diff.
     - `## Tests` – commands run + results and any manual QA steps.

---

## 3. Context & memory: ALWAYS_READ_FIRST + CLAUDE.md

Claude Code supports repo-specific memory via `CLAUDE.md` files plus imports.

For Agent Jones:

- Add an `ALWAYS_READ_FIRST.md` at the repo root with:
  - Code style and linting conventions.
  - Folder layout overview for frontend, backend, and API routes.
  - Env var naming rules (`NEXT_PUBLIC_*` vs server-only).
  - “Never do this” rules (no secrets, no destructive commands).
- Create a `CLAUDE.md` at the repo root (or under `.claude/`) and import it:

  ```md
  See @ALWAYS_READ_FIRST.md for repo rules and workflows.
  ```

- Teach Claude to always consult these before making changes.
- When conventions change (new scripts, new agent modules), update these files so future sessions start with the right assumptions.

---

## 4. Handling long-running / large tasks

When a task spans many files or several hours:

- **Chunk the work.**
  - Split into phases: e.g. `step-1-schema`, `step-2-api`, `step-3-ui`.
  - Use one branch and PR per phase.
- **Use Markdown checklists as “manual checkpoints”.**
  - Ask Claude to create `docs/{{TASK}}_CHECKLIST.md` with subtasks.
  - Have it tick them off as it edits files and runs tests.
- **Reset context regularly.**
  - One conversation per feature/bug/phase.
  - Start each new conversation with:
    - The goal.
    - A link or excerpt from `REPO_CODEMAP.md` and the relevant checklist.
    - Any constraints (e.g. “don’t touch payment code”).

Git branches + checklists = your reliable checkpoints; don’t rely on a single huge chat history.

---

## 5. Secrets, env vars, and external services

- **Never fabricate or commit secrets.**
  - Only reference env vars (e.g. `process.env.MY_VAR`).
  - Use `.env.example` with placeholders like `AGENTJONES_API_KEY=YOUR_KEY_HERE`.
- **Ask for names, not values.**
  - Claude may ask: “Which env var name should I use for the {{service}} API key?”
  - It should never ask you to paste real secret values into the chat.
- **Respect Next.js env rules.**
  - Don’t leak server-only env vars to the client.
  - Only expose values via `NEXT_PUBLIC_*` when truly safe.

---

## 6. Output formatting for easy PRs

For code-changing tasks, ask Claude to format answers like this:

```md
## Summary
- One–three bullets describing the change and why it was made.

## Diff
```diff
--- a/path/to/file.ts
+++ b/path/to/file.ts
@@ -1,3 +1,7 @@
+// New behavior comment
+export async function ...
```
```md

## Tests
- [x] npm run lint
- [x] npm test
- [ ] Manual QA: {{steps or “TODO”}}
```

This makes it trivial to copy into a PR description and check that everything ran.

---

## 7. Key patterns to remember

- **Repo-codemap first** – understand structure before editing.
- **Small-step PRs** – one coherent change per branch.
- **Diff-only responses** – reviewable, localized edits.
- **Schema-first for LLM I/O and APIs** – types and validation before behavior.
- **Test-before-change** – tests capture intent, then code implements it.

---

## External sources

- Claude Code & VS Code integration: https://code.claude.com/docs/en/ide-integrations
- Claude Code memory (CLAUDE.md, imports): https://code.claude.com/docs/en/memory
- Anthropic engineering blog on Claude Code best practices: https://www.anthropic.com/news/claude-code
- Claude models overview (Sonnet 4.5): https://docs.anthropic.com/en/docs
