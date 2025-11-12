# Claude Code Prompt Templates – Agent Jones

Usage:

- Replace `{{placeholders}}` before sending.
- In VS Code Agent Mode, prefer including relevant files via the file picker / `@file.ts` rather than pasting large code blocks.
- Use these as **starting points**, then iterate with Claude.

---

## 1. Map the repo (REPO_CODEMAP)

```text
You are Claude Sonnet 4.5 working in VS Code Agent Mode inside the "Agent Jones" Next.js + TypeScript repo.

Task: Build or update a concise repo codemap.

Please:
1. Read these at minimum (only by path, do NOT paste contents back):
   - README.md
   - ALWAYS_READ_FIRST.md (if present)
   - Any CLAUDE*.md files
   - package.json
   - next.config.* and tsconfig.json
   - app/** or pages/**
   - app/api/** or pages/api/**
   - backend/** and lib/**
   - tests/** or __tests__/**

2. Create or update docs/REPO_CODEMAP.md with:
   - High-level architecture for Agent Jones (frontend, backend/agent, APIs).
   - Key directories and what they’re responsible for.
   - Where the main agent/conductor logic lives.
   - How to run dev, build, lint, and tests (based on package.json).
   - Known env vars (names only, no secret values).

3. Do NOT edit any non-doc code in this step.

Reply with:
- SUMMARY: 3–5 bullets about the architecture.
- FILES_READ: brief list of key files/dirs.
- NEXT_STEPS: what you’d investigate next for deeper work.
```

---

## 2. Refactor safely (small-step PR)

```text
Goal: Refactor {{area_of_code}} in the Agent Jones repo without changing behavior.

Inputs:
- Primary files: {{primary_file_paths}}
- Related files / types: {{related_file_paths_or_patterns}}

Instructions:
1. Read the relevant files and summarize:
   - Current responsibilities and data flow.
   - How this code is used by the rest of the app.

2. Propose a short plan for the refactor covering:
   - Target structure (functions/components/modules).
   - Risk areas and how you’ll test them.

3. After I approve the plan, implement the refactor as a PR-sized change:
   - Keep behavior identical.
   - Keep diffs as small and localized as possible.
   - Reuse existing helpers/patterns from the repo.

4. Format your response as:
   - SUMMARY: what changed conceptually.
   - DIFF: unified diffs for changed files only.
   - TESTS: exact commands to run (and expected outcomes).

5. Run appropriate commands (for example):
   - npm run lint
   - npm run test
   - npm run typecheck
   Summarize failures instead of hiding them.

6. If any change affects API responses or LLM I/O types:
   - Update the relevant TypeScript/Zod schemas FIRST (schema-first approach).
   - Ensure all callsites compile/typecheck.
```

---

## 3. Write or extend tests (TDD-friendly)

```text
Goal: Create or extend automated tests for {{feature_or_module}} in Agent Jones.

Context:
- Implementation files: {{impl_file_paths}}
- Existing tests (if any): {{test_file_paths}}
- Test framework: {{jest/vitest/playwright/etc_if_known}}

Instructions:
1. Read the implementation + existing tests and summarize:
   - Current behavior and edge cases.
   - Gaps in test coverage.

2. Propose a test plan:
   - List of new test cases, including edge cases and failure modes.
   - Any fixtures or mocks that should be introduced.

3. Implement ONLY the tests first:
   - Add or update tests in appropriate files.
   - Do NOT change production code yet unless obviously broken (and only if I approve).

4. Run tests (e.g. `npm test` or repo-specific scripts) and paste or summarize the output.
   - Confirm that new tests fail if the behavior isn’t implemented yet.

5. Format your response as:
   - SUMMARY: what’s now covered by tests.
   - DIFF: changes to test files only.
   - TESTS: commands run + pass/fail summary.
```

---

## 4. Add a new feature (frontend + API)

```text
Goal: Implement feature "{{feature_summary}}" in Agent Jones.

Inputs:
- User story: {{short_user_story}}
- Scope: {{in_scope}} / {{out_of_scope}}
- Rough UX or API expectations: {{notes_or_links}}

Instructions:
1. Analysis & plan
   - Read the relevant Next.js pages/components, API routes, and backend agent modules.
   - Summarize current behavior and data flow related to this feature.
   - Propose a step-by-step plan touching:
     - Data model / types.
     - API routes (or new routes if needed).
     - Backend agent logic.
     - Frontend UI changes.
     - Tests and telemetry/logging.

2. Schema-first
   - Before coding behavior, define or update TypeScript/Zod schemas for:
     - Request/response payloads.
     - Any LLM I/O contracts involved.
   - Ensure existing callsites continue to typecheck.

3. Implementation
   - Implement the feature in small, reviewable steps.
   - Reuse existing patterns in Agent Jones (API wrappers, hooks, UI primitives).
   - Keep changes behind feature flags or env-controlled switches if uncertainty is high.

4. Validation
   - Add/extend tests (unit + integration where appropriate).
   - Suggest manual QA steps (URLs, expected behavior, edge cases).

5. Response format
   - SUMMARY
   - DIFF (unified diffs, no extra commentary inside the diff)
   - TESTS (commands run + results)
   - MANUAL_QA_STEPS
```

---

## 5. Debug & fix a bug (with logs)

```text
Goal: Debug and fix a bug in Agent Jones.

Bug description:
- Symptom: {{symptom_description}}
- Where it appears (URL / component / API route): {{location}}
- Error output / logs: {{paste_error_snippet_or_point_to_log_file}}

Instructions:
1. Ask any clarification questions you truly need.
2. Read only the most relevant files first and explain:
   - Hypothesis for root cause.
   - Files you need to inspect next.

3. Propose a minimal fix plan, including:
   - Code-level changes.
   - Extra logging or telemetry to confirm the fix in production.
   - Edge cases to cover.

4. Implement the fix as a minimal diff:
   - Avoid large refactors unless required to fix the bug.
   - If refactor is needed, clearly separate “fix” and “cleanup” in the diff.

5. Update or add tests that reproduce the bug and verify the fix.

6. Run tests/lint/typecheck and summarize output.

7. Respond with:
   - ROOT_CAUSE: explanation in 2–3 bullets.
   - SUMMARY: fix description.
   - DIFF
   - TESTS
   - FOLLOW_UP: logging/monitoring/tech-debt you recommend.
```

---

## 6. Migration (library, API, or schema)

```text
Goal: Migrate {{what_is_changing}} to {{target_state}} in Agent Jones.

Scope:
- Affected areas: {{paths_or_modules}}
- Non-goals: {{explicitly_out_of_scope}}

Instructions:
1. Create a migration plan document:
   - Write docs/{{migration_slug}}_PLAN.md that includes:
     - Motivation / risks.
     - Step-by-step phases, each PR-sized.
     - Tests and monitoring per phase.

2. Phase 1: Schemas and types
   - Update TypeScript types and runtime validation (e.g. Zod) to support both old and new shapes when possible.
   - Add comments marking deprecation timelines.

3. Phase 2+: Behavior and wiring
   - For each phase, implement only the planned slice.
   - Keep diffs small and coherent (per directory or per feature).
   - Prefer feature flags or env-based switches for risky behavior changes.

4. Testing
   - For each phase, update tests and run:
     - Lint
     - Typecheck
     - Relevant test suites (unit/integration/E2E).

5. For the current phase, respond with:
   - SUMMARY
   - PLAN_SECTION: which step of the PLAN you’re executing.
   - DIFF
   - TESTS
   - NEXT_PHASE: what to do in the following PR.
```

---

## 7. Generate release notes from changes

```text
Goal: Draft human-readable release notes for a new Agent Jones version.

Inputs:
- Version: {{version_tag}}
- Branch / range: {{git_range_or_branch}}
- Audience: {{internal_devs|end_users|stakeholders}}
- Notable areas: {{features_or_subsystems_to_highlight}}

Instructions:
1. Use git (or provided summaries) to:
   - Group changes into: Features, Improvements, Bug Fixes, Internal/Chore.
   - Identify any breaking changes or migrations.

2. Draft release notes as Markdown, including:
   - Title + version + date (leave date as {{DATE_HERE}} if unknown).
   - Bulleted sections (Features, Fixes, etc.).
   - Any required upgrade/migration steps.

3. Keep language concise and non-marketing; assume a technical audience.

4. Respond with:
   - RELEASE_NOTES.md content only (no diffs).
   - Optional short “tweet-length” summary if helpful.
```

---

## External sources

- Claude Code prompt and workflow guidance: https://code.claude.com/docs
- Anthropic engineering posts on agentic coding: https://www.anthropic.com/news
