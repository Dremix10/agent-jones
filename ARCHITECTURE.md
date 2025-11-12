# ARCHITECTURE.md

**Project**: AI Front Desk (Agent Jones)  
**Date**: November 10, 2025  
**Purpose**: Current vs. target architecture, rationale, and migration strategy

---

## Current Architecture

### System Overview
**Pattern**: Monolithic Next.js 15 App Router application  
**Location**: Nested in `backend/` directory (legacy naming)  
**Frontend**: React Server Components + Client Components (demo, owner dashboard)  
**Backend**: Next.js API Routes (REST-style JSON endpoints)  
**AI**: Anthropic Claude Sonnet 4.5 (direct SDK integration)  
**Storage**: In-memory Map stored on `globalThis` (volatile, dev-only)  

### Request Flow
```
1. User visits /demo
   ↓
2. Fills form → POST /api/leads (creates lead)
   ↓
3. Chat interface → POST /api/leads/:id/messages
   ↓
4. Backend calls conductor.callClaudeForLead()
   ↓
5. Claude API returns ActionContract JSON
   ↓
6. Backend updates lead status/fields
   ↓
7. Backend stores AI reply as message
   ↓
8. Frontend displays updated conversation
```

### Deployment Context
- **Dev**: `npm run dev` on localhost:3000
- **Prod (intended)**: Vercel with serverless functions
- **No database**: Data resets on every deploy/restart
- **No auth**: Public endpoints (acceptable for MVP)

---

## Current State Assessment

### ✅ Strengths
1. **Unified codebase** - Frontend & backend in one repo, single deploy
2. **Type-safe** - Shared TypeScript types between API & UI
3. **Modern stack** - Next.js 15 App Router, React Server Components
4. **Fast iteration** - No build step for API routes, hot reload works
5. **Clean AI integration** - Well-structured prompt engineering, error handling
6. **Professional UI** - Dark mode, responsive, toast notifications, keyboard shortcuts

### ❌ Weaknesses
1. **No persistence** - In-memory storage is a showstopper for production
2. **Nested structure** - `backend/` folder creates confusion (leftover from multi-repo experiment)
3. **No database schema** - No migrations, no query layer
4. **No testing** - Zero test coverage (unit, integration, E2E)
5. **Missing integrations** - Calendar API, SMS, email confirmations not hooked up
6. **Dead code** - Unused components and old mock implementations

---

## Target Architecture

### High-Level Design
**Pattern**: Single Next.js application with API routes (same as current)  
**Key Change**: Add persistent database layer + flatten directory structure  
**Why**: Vercel + Next.js is the right choice for this use case:
- Small team, fast iteration
- Serverless scales to zero (cost-efficient)
- Built-in API routes eliminate backend boilerplate
- Edge functions for low latency globally
- Simple deployment (git push → auto-deploy)

### Target Directory Structure
```
agent-jones/                     # Root = Next.js app
├── app/                         # Frontend pages & API routes
│   ├── api/
│   │   └── leads/
│   ├── demo/
│   ├── owner/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/                  # React components
├── lib/                         # Business logic
│   ├── db.ts                    # NEW: Database client
│   ├── types.ts
│   ├── leads.ts                 # UPDATED: Use db.ts instead of Map
│   └── conductor.ts
├── config/                      # AI prompts & knowledge base
├── db/                          # NEW: Database migrations
│   └── migrations/
├── tests/                       # NEW: Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── env.local (gitignored)
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vercel.json                  # NEW: Deployment config
└── vitest.config.ts             # NEW: Test runner config
```

### Data Layer (NEW)
**Database**: Vercel Postgres (or Supabase, PlanetScale)  
**ORM**: Drizzle ORM or Prisma (lightweight, TypeScript-first)  
**Schema**:
```sql
-- leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  channel TEXT NOT NULL,  -- web, sms, whatsapp, instagram
  service_requested TEXT,
  job_details TEXT,
  location TEXT,
  preferred_time_window TEXT,
  chosen_slot TEXT,
  status TEXT NOT NULL,   -- NEW, QUALIFIED, BOOKED, ESCALATE
  estimated_revenue NUMERIC(10,2),
  meta JSONB
);

-- messages table (1:many with leads)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  from_role TEXT NOT NULL,  -- user, ai
  body TEXT NOT NULL
);

-- indexes for common queries
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_messages_lead_id ON messages(lead_id, created_at);
```

### Integration Layer (FUTURE)
**Calendar**: Google Calendar API or Calendly webhooks  
**SMS**: Twilio API for outbound confirmations  
**Email**: Resend or SendGrid for booking confirmations  
**Analytics**: PostHog or Vercel Analytics for funnel tracking  

**Dependency Injection Pattern**:
```typescript
// lib/integrations/calendar.ts
export interface CalendarProvider {
  createEvent(params: BookingParams): Promise<EventId>;
}

// lib/integrations/google-calendar.ts
export class GoogleCalendar implements CalendarProvider {
  async createEvent(params: BookingParams) { /* ... */ }
}

// Usage in API route
const calendar = new GoogleCalendar(process.env.GOOGLE_CALENDAR_API_KEY);
await calendar.createEvent({ ... });
```

---

## Why This Target Architecture?

### Rationale for Single Next.js App
1. **Team size**: Small team (1-3 devs) benefits from unified codebase
2. **Shared types**: API contracts in TypeScript prevent frontend/backend drift
3. **Deployment simplicity**: One repo, one deploy, one environment config
4. **Cost efficiency**: Vercel serverless scales to zero (no idle server costs)
5. **Developer experience**: Hot reload, fast builds, integrated dev server

### Why NOT Microservices?
- **Premature scaling**: No evidence of needing independent service scaling
- **Complexity overhead**: API versioning, inter-service auth, distributed tracing
- **Team size**: Would slow down a small team with coordination overhead
- **Data model**: Leads & messages are tightly coupled (poor boundary for splitting)

### Why NOT Separate Frontend Repo?
- **API contract drift**: Type mismatches between frontend expectations & backend reality
- **Coordination overhead**: Two PRs for every feature (frontend + backend)
- **Deployment complexity**: Coordinating releases, managing CORS, handling version skew
- **Team size**: Not enough devs to justify separate repos

### Database Choice: Vercel Postgres
**Pros**:
- Native Vercel integration (zero config)
- Connection pooling built-in
- Scales automatically
- Postgres SQL (standard, powerful)
- Free tier for MVP

**Alternatives Considered**:
- **Supabase**: Good choice if needing auth, realtime, or storage later
- **PlanetScale**: Excellent for scaling, but overkill for MVP
- **MongoDB Atlas**: Wrong fit (relational data model is natural here)

---

## Migration Risks & Mitigations

### Risk 1: Data Loss During DB Migration
**Problem**: Current in-memory leads are lost on every restart  
**Mitigation**:
- Export `globalThis` store to JSON file before adding DB
- Use JSON as seed data for initial migration
- Run dual-write mode (write to both Map + DB) during transition
- Verify data consistency before removing in-memory layer

### Risk 2: API Route Breaking Changes
**Problem**: Adding DB queries could change response schemas  
**Mitigation**:
- Write integration tests BEFORE refactoring
- Use Zod schemas to validate API responses during migration
- Deploy behind feature flag (e.g., `USE_DATABASE=false` env var)
- Monitor error rates in Vercel logs

### Risk 3: Anthropic API Rate Limits
**Problem**: Claude API has rate limits (tier-dependent)  
**Mitigation**:
- Add exponential backoff + retry logic in `conductor.ts`
- Cache AI responses for duplicate messages (e.g., "Hello" → greeting)
- Monitor API usage in Anthropic dashboard
- Implement queueing for high-traffic spikes (BullMQ or Vercel Queue)

### Risk 4: Environment Variable Leakage
**Problem**: `.env.local` contains real API key (may be in git history)  
**Mitigation**:
- Rotate `ANTHROPIC_API_KEY` immediately after refactor
- Add `.env.local` to `.gitignore` (already done)
- Use Vercel Secrets for production (encrypted at rest)
- Audit git history: `git log -p -- .env.local`

---

## What We Are NOT Changing (Yet)

### Keeping Current
1. **Next.js App Router** - Stays (modern, efficient)
2. **Anthropic Claude** - Stays (working well, good ROI)
3. **Tailwind CSS** - Stays (fast styling, no complaints)
4. **REST-style API routes** - Stays (simple, no need for GraphQL)
5. **In-component state** - Stays (no Redux/Zustand needed for small app)

### Future Considerations (Post-Refactor)
1. **Auth layer** - If expanding to multi-tenant (NextAuth.js or Clerk)
2. **Realtime updates** - If adding live chat (Pusher or Supabase Realtime)
3. **Background jobs** - If adding scheduled summaries (Vercel Cron or Inngest)
4. **Feature flags** - If A/B testing AI prompts (Flagsmith or PostHog)

---

## Success Criteria for Target Architecture

### Must Have (MVP)
- ✅ All leads persist across deploys
- ✅ Database migrations run automatically on deploy
- ✅ API routes use DB instead of in-memory Map
- ✅ No change to frontend code (except import paths)
- ✅ Build & tests pass before merge to main

### Nice to Have (Post-Launch)
- ⭐ Calendar API creates real events on booking
- ⭐ SMS confirmations sent via Twilio
- ⭐ Email summaries sent to owner daily
- ⭐ Error monitoring in Sentry
- ⭐ 80%+ test coverage (unit + integration)

### Metrics to Track
- **API latency**: p95 < 2s (Claude API is slow, set realistic expectations)
- **Error rate**: < 1% (capture with Vercel Analytics)
- **Conversion rate**: Form submit → Booking (measure effectiveness of AI)
- **Token usage**: Track Claude API costs per lead (optimize prompts if high)

---

## Deployment Strategy

### Phase 1: Pre-Deploy (Dev/Staging)
1. Flatten `backend/` to root (see REFACTOR_PLAN.md)
2. Add database schema + migrations
3. Update `lib/leads.ts` to use DB
4. Run smoke tests locally
5. Deploy to Vercel preview environment
6. Validate with test leads

### Phase 2: Production Deploy
1. Set `DATABASE_URL` in Vercel env vars
2. Run migrations: `npm run db:migrate`
3. Deploy main branch to Vercel production
4. Monitor error logs for 24 hours
5. Smoke test: Create lead → chat → book

### Phase 3: Post-Deploy Validation
1. Check Vercel logs for errors
2. Verify database has real data
3. Test lead creation from /demo
4. Test owner dashboard displays leads
5. Confirm AI responses are working

---

## Alternative Architectures Considered (and Rejected)

### Option A: Separate Backend API (FastAPI/Express)
**Why Rejected**:
- Adds deployment complexity (2 services, CORS, API versioning)
- Splits team focus (frontend vs. backend devs)
- Loses type safety (need OpenAPI codegen)
- Overkill for current scale (10-100 leads/day)

### Option B: Firebase/Supabase BaaS
**Why Rejected**:
- Lock-in risk (harder to migrate later)
- Less control over API logic
- Firestore is document DB (relational model fits better)
- Supabase is viable alternative, but Vercel Postgres is simpler

### Option C: Serverless Functions + DynamoDB
**Why Rejected**:
- AWS complexity overkill (IAM, VPC, CloudFormation)
- DynamoDB single-table design is harder to query
- Worse DX than Vercel (longer builds, more config)

---

## Conclusion

**Target**: Single Next.js app with persistent database, flattened to repo root.  
**Why**: Optimal for team size, deployment simplicity, and cost efficiency.  
**Risk**: Database migration requires careful testing, but low overall complexity.  
**Timeline**: 10-15 small PRs over 2-3 weeks (see REFACTOR_PLAN.md).

**Next Step**: Review REFACTOR_PLAN.md for step-by-step execution plan.

---

**End of ARCHITECTURE.md**
