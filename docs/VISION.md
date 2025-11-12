# Vision (Post-Hackathon)

**North Star**: Reliable answer in <60s → qualify → offer 2–3 slots → book → notify

**Pilot-ready in days**; email + ICS fallback first; later add Google Calendar + SMS

---

## Target Architecture

**Repo Structure**:
```
agent-jones/
├── app/              # Next.js App Router (pages + API routes)
├── lib/              # Business logic & utilities
├── components/       # React components
├── configs/          # AI prompts & knowledge base
├── db/               # Database migrations (future)
├── tests/            # Unit, integration, E2E tests (future)
│   └── e2e/
├── .env.example
├── package.json
├── tsconfig.json
└── vercel.json
```

**Why This Structure**:
- Root = Next.js app (Vercel-native)
- `configs/` not `config/` (standard plural convention)
- `db/` for schema + migrations (when added)
- `tests/e2e/` for Playwright/Cypress (when added)

---

## MVP Acceptance Criteria

✅ **Performance**:
- First AI reply: <10s
- End-to-end booking flow: <90s
- API latency p95: <2s

✅ **Functionality**:
- Lead creation from web form
- AI qualifies and offers slots
- Booking confirmation sent via email
- ICS attachment included
- Owner dashboard shows `Booked=1` with revenue

✅ **Guardrails**:
- No exact pricing (ranges only)
- Escalate for out-of-area requests
- Graceful degradation if AI fails

---

## Phases

### Phase 1: MVP (Current Sprint)
- [x] Flatten directory structure
- [ ] Add database layer (Vercel Postgres)
- [ ] Email + ICS booking confirmations (Resend API)
- [ ] Basic test suite (Vitest)
- [ ] Deploy to Vercel

### Phase 2: Production-Ready
- [ ] Google Calendar integration
- [ ] SMS notifications (Twilio)
- [ ] Error monitoring (Sentry)
- [ ] E2E tests (Playwright)
- [ ] Rate limiting & auth

### Phase 3: Scale
- [ ] Multi-tenant support
- [ ] Webhook integrations
- [ ] Advanced scheduling (recurring, events)
- [ ] Analytics dashboard

---

## Design Principles

1. **PR-sized changes only** - Small, reversible commits
2. **Schema-first** - Update TypeScript types before behavior
3. **Graceful degradation** - System works even if external APIs fail
4. **Email-first** - Don't block on calendar/SMS integrations
5. **Validate LLM JSON** - Always use Zod schemas + retry logic

---

## Success Metrics (First 30 Days)

- **Booking conversion**: >40% (form submit → booked)
- **AI accuracy**: <5% escalation rate
- **Customer satisfaction**: >4.5/5 (post-booking survey)
- **Owner time saved**: >10 hours/week
- **System uptime**: >99.5%
