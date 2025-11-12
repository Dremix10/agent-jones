# Context

**Product**: AI Front Desk for car detailers (owner-operated, 1–10 people)

**Goal**: Reply <60s → qualify → offer 2–3 slots → book → email summaries

**Guardrails**:
- No exact prices (ranges only from kb.yaml)
- Escalate when unsure/out-of-area
- Email-first approach
- ICS fallback for calendar bookings

**Offer**: €/$300/mo after day 15; cancel anytime; 7-day sprint setup

---

## Customer Journey

1. **Lead captures** (web form, SMS, WhatsApp, Instagram DM)
2. **AI qualifies** (service type, vehicle, location, time preference)
3. **Offer 2-3 slots** (based on availability from kb.yaml)
4. **Book & confirm** (status → BOOKED, send email with ICS attachment)
5. **Owner dashboard** (metrics, chat history, AI-generated summaries)

## Tech Stack

- **Frontend**: Next.js 15 App Router, React, Tailwind CSS
- **Backend**: Next.js API routes (serverless)
- **AI**: Anthropic Claude Sonnet 4.5
- **Database**: Vercel Postgres (or similar)
- **Email**: Resend API or SMTP fallback
- **Deploy**: Vercel

## Current State (Post-Flatten)

- ✅ Directory structure flattened to root
- ✅ AI conversation flow working
- ✅ Owner dashboard functional
- ❌ Database layer (in-memory only)
- ❌ Email/ICS bookings (not hooked up)
- ❌ Calendar integration (not hooked up)
