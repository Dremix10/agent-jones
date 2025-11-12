# Agent Jones – Claude Review Checklist

When Claude proposes a change in this repo (via VS Code Agent Mode / Claude Code), it should implicitly pass this checklist before you hit “accept”.

You can also paste this at the top of a session to remind it.

---

## 1. Context loaded

- [ ] I’ve read `ALWAYS_READ_FIRST.md` and any project `CLAUDE*.md` files.
- [ ] I understand the high-level architecture for the area I’m changing (from `docs/REPO_CODEMAP.md` or equivalent).
- [ ] I’ve opened and skimmed all directly affected files (implementation + tests + types).
- [ ] I’ve searched for usages of any function/component/endpoint I’m modifying and considered impacts.

---

## 2. Scope & plan

- [ ] I’ve written a short plan for this task and had it confirmed or adjusted.
- [ ] The plan fits in a PR-sized change (one feature, bugfix, or migration phase).
- [ ] I am not mixing unrelated refactors, formatting, or renames into this change.

---

## 3. Implementation quality

- [ ] Code follows existing patterns (folder structure, naming, React/Next.js conventions, agent orchestration style).
- [ ] For any API or LLM I/O change:
  - [ ] TypeScript types and/or validation schemas are updated first.
  - [ ] All callsites compile and typecheck against the new contract.
- [ ] Error handling and logging are reasonable for new code paths.
- [ ] No dead code, unused imports, or obvious duplication has been introduced.

---

## 4. Env vars, secrets, and safety

- [ ] I only reference env vars by name; no real secret values appear in code or logs.
- [ ] New env vars (names only) are documented in `ALWAYS_READ_FIRST.md` or relevant docs.
- [ ] No destructive or high-risk terminal commands (e.g., `rm -rf`, force pushes) are being run by the agent.
- [ ] Any external API integration uses existing patterns (client wrappers, retry/error handling) rather than ad-hoc fetches sprinkled everywhere.

---

## 5. Tests, linting, and typechecking

- [ ] Tests exist for the behavior I’ve changed (new tests added where coverage was missing).
- [ ] I’ve updated snapshots or fixtures intentionally (not by accident).
- [ ] I’ve run relevant commands (e.g., `npm run lint`, `npm run test`, `npm run typecheck`, or repo-specific equivalents).
- [ ] My response clearly states:
  - [ ] Which commands were run.
  - [ ] Whether they passed or failed.
  - [ ] What failures mean and how to address them (if any remain).

---

## 6. Output & PR readiness

- [ ] I’ve returned a structured response with:
  - [ ] `## Summary` describing the change and rationale in plain language.
  - [ ] `## Diff` containing unified diffs per file (or relying on Agent Mode diffs while still summarizing the key edits).
  - [ ] `## Tests` listing commands and results.
  - [ ] Optional `## Manual QA` with steps a human can follow.
- [ ] The diff is small enough to review in one sitting and clearly tied to the stated goal.
- [ ] There are no surprise behavior changes beyond what the summary describes.

If any box would be unchecked, Claude should revise the plan or implementation before you consider merging.

---

## External sources

- Claude Code workflow guidance: https://code.claude.com/docs
- AI-assisted review best practices: https://graphite.dev/guides/ai-code-review
