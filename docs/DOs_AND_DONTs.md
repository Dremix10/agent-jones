# Agent Jones – Claude / VS Code Safety Rules (DOs & DON’Ts)

These rules apply whenever you (or Claude) touch this repo via VS Code Agent Mode / Claude Code.

1. ✅ **DO work on a feature branch per task.** Keep each AI-assisted change branch and PR narrowly scoped.

2. ✅ **DO read `ALWAYS_READ_FIRST.md`, `CLAUDE.md`, and `docs/REPO_CODEMAP.md` before major changes.** Treat them as the project brief, not optional reading.

3. ✅ **DO keep changes PR-sized.** One coherent feature, bugfix, refactor, or migration phase per PR—no “fix 5 things at once” patches.

4. ✅ **DO start with a plan.** For non-trivial work, require Claude to propose a short plan before writing code, and adjust the plan before edits begin.

5. ✅ **DO use schema-first changes for LLM I/O and APIs.** Update TypeScript types and validation schemas first, then adapt callers and implementation.

6. ✅ **DO run tests and lint/typecheck on every significant change.** Have Claude run the appropriate `npm run …` scripts and summarize output in its response.

7. ✅ **DO prefer small, local diffs.** Ask Claude to limit edits to the minimal set of files and lines needed; avoid repo-wide sweeping changes.

8. ✅ **DO log and guard risky behavior.** When touching critical API routes or agent flows, add/keep sensible logging, error handling, and feature flags.

9. ✅ **DO treat AI output like a junior engineer’s PR.** Read it fully, ask for explanations, and push back on unclear or over-complicated designs.

10. ✅ **DO maintain context files.** When new conventions, scripts, or gotchas appear, update `ALWAYS_READ_FIRST.md` and `CLAUDE.md` so future sessions start smarter.

11. ❌ **DON’T invent secrets or env values.** Never commit real secrets; don’t let Claude fabricate them. Use placeholders and `.env.example` instead.

12. ❌ **DON’T bypass safety prompts lightly.** Avoid auto-approving dangerous terminal commands or enabling modes that skip confirmations against this repo.

13. ❌ **DON’T mix unrelated cleanups with functional changes.** If Claude wants to reformat or rename things, split that into a separate, clearly-labeled PR.

14. ❌ **DON’T change public APIs silently.** If you change API routes, response shapes, or exported TS types, ensure all consumers are updated and tests reflect the new contract.

15. ❌ **DON’T rely on one mega-conversation.** Long sessions drift; start a new conversation per feature/bug, with a brief, explicit context summary.

---

## External sources

- General AI coding safety practices: https://graphite.dev/guides
- Claude Code safety notes: https://code.claude.com/docs
