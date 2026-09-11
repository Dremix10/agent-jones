# AI Front Desk

An AI-powered front desk for local service businesses: it qualifies inbound leads through natural conversation, checks availability against a knowledge base, and books the appointment — no dashboard clicking required on the business side. Built as a hackathon project, prototyped against a Houston car-detailing business.

`[FILL — screenshot or short demo GIF: /demo chat flow and /owner dashboard]`

**Live demo:** `[FILL — deployed URL, if any]` · otherwise run locally (below).

## Stack

Next.js 15 (App Router), TypeScript, Tailwind CSS, Anthropic Claude (Sonnet 4.5). In-memory data store — no external database.

## The hard part: getting an LLM to reliably drive a state machine

The core of this is `lib/conductor.ts` — a prompt + parser pair that turns a chat message into a strict `ActionContract`: `{ reply, action, status, parameters }`. `action` is one of `send_message | offer_slots | create_booking | flag_for_review`; `status` walks a lead through `new → qualifying → qualified → slots_offered → booked` (or `needs_review` at any point). The system prompt makes Claude reason in steps — what stage is this conversation in, what information is still missing, what should happen next — before it commits to that JSON shape, and every price or availability claim has to come from a YAML knowledge base rather than the model's own guess. Since LLM output isn't guaranteed to be clean JSON, there's a fallback parser that recovers a usable `ActionContract` even when the model's response doesn't parse on the first try, instead of the conversation just breaking.

## Run locally

```bash
cd backend
npm install
npm run dev
```

Prints the local port (usually `http://localhost:3000`). Toggle `USE_MOCK` in `backend/components/config.ts` to switch between mock responses and live Claude calls (needs `ANTHROPIC_API_KEY`).

**Demo path:** `/` → "Start Customer Flow" → `/demo` (hotkeys `1`/`2`/`3` pre-fill a scenario) → book a slot → "View in Dashboard" → `/owner`.

## Team

Built at a hackathon with collaborators handling backend/AI, frontend/UI, and integration in parallel. `[FILL — credit specifics if you want them named]`
