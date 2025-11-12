# CODEMAP.md

**Project**: AI Front Desk (Agent Jones)  
**Generated**: November 10, 2025  
**Purpose**: Complete map of codebase structure, entrypoints, routes, data models, env vars, and scripts

---

## 1. Project Overview

**Tech Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Anthropic Claude API  
**Architecture**: Single Next.js monolith with frontend + backend API routes  
**Current Location**: `backend/` folder (legacy naming from multi-repo history)  
**Deployment Target**: Vercel (inferred from Next.js, no vercel.json yet)

---

## 2. Entrypoints

### Frontend Pages (User-Facing)
- **`backend/app/page.tsx`** - Landing page with links to Demo & Owner dashboard
- **`backend/app/demo/page.tsx`** - Customer flow demo (form → chat → booking)
  - Client component: `backend/app/demo/DemoPageClient.tsx`
- **`backend/app/owner/page.tsx`** - Owner dashboard (leads table, metrics, AI summary)
  - Client component: `backend/app/owner/OwnerPageClient.tsx`

### API Routes (Backend)
- **`backend/app/api/leads/route.ts`**
  - `GET /api/leads` - List all leads
  - `POST /api/leads` - Create new lead from web form
  
- **`backend/app/api/leads/[id]/messages/route.ts`**
  - `POST /api/leads/:id/messages` - Send user message, get AI response
  
- **`backend/app/api/leads/[id]/welcome/route.ts`**
  - `POST /api/leads/:id/welcome` - Generate AI welcome message for new lead
  
- **`backend/app/api/leads/[id]/owner-assist/route.ts`**
  - `POST /api/leads/:id/owner-assist` - Generate AI follow-up suggestion for escalated leads
  
- **`backend/app/api/leads/summary/route.ts`**
  - `GET /api/leads/summary` - Get aggregate metrics (unused in current UI)
  
- **`backend/app/api/leads/owner-summary/route.ts`**
  - `GET /api/leads/owner-summary` - Generate AI daily summary for owner
  
- **`backend/app/api/_env/route.ts`**
  - `GET /api/_env` - Debug endpoint to check env vars (root level)
  
- **`backend/app/api/leads/_env/route.ts`**
  - `GET /api/leads/_env` - Debug endpoint to check env vars (leads scope)

### Root Layout & Providers
- **`backend/app/layout.tsx`** - Root HTML structure, font loading, ThemeProvider
- **`backend/app/providers.tsx`** - Client-side context providers (Toast)

---

## 3. Core Library Modules

### Data Layer (`backend/lib/`)
- **`types.ts`** - TypeScript interfaces & types
  - `Lead`, `LeadMessage`, `LeadStatus`, `LeadChannel`
  - `ActionContract` - AI → backend communication contract
  - `ClaudeActionResponse` (legacy, overlaps with ActionContract)
  - `SlotOption` - Time slot data structure
  
- **`leads.ts`** - In-memory lead storage & CRUD operations
  - `createLead()`, `getLead()`, `updateLead()`, `listLeads()`
  - `addMessageToLead()`, `setLeadStatus()`, `updateLeadFields()`
  - Uses `globalThis.__agentJonesLeadsStore` to survive hot reloads
  
- **`conductor.ts`** - Claude AI orchestration (ACTIVE)
  - `callClaudeForLead()` - Main AI conversation handler
  - `generateWelcomeMessageForLead()` - Initial greeting
  - `generateOwnerDailySummary()` - Daily briefing for owner
  - `generateOwnerFollowupForEscalatedLead()` - Follow-up message drafting
  - Loads prompts from `config/prompt.md` and `config/kb.yaml`
  - Inference fallback: `inferUpdatedLeadFieldsFromReply()` catches booking confirmations
  
- **`claudefrontdesk.ts`** - Old mock implementation (DEAD CODE)
  - Single function: `callClaudeForLead()` returns hardcoded mock
  - **TODO**: Delete this file (replaced by `conductor.ts`)

### Configuration (`backend/config/`)
- **`kb.yaml`** - Knowledge base for AI
  - Business name, service area ZIP codes
  - Services: id, name, price range, duration, description
  - Availability: hours by day of week
  
- **`prompt.md`** - System prompt for Claude AI
  - Conversation flow stages (Greet → Qualify → Offer Slots → Book → FAQ → Escalate)
  - ActionContract JSON schema
  - Rules for status transitions, revenue calculation, phone handling

### UI Components (`backend/components/`)
- **`ui.tsx`** - Core layout components (Header, Card, Button, ModeBanner)
- **`ActionBadge.tsx`** - Visual badge for AI action types
- **`StatusPill.tsx`** - Lead status color-coded pill
- **`CountUp.tsx`** - Animated number counter (unused in current UI)
- **`Skeleton.tsx`** - Loading skeleton placeholders (unused)
- **`Toast.tsx`** - Toast notification system with context provider
- **`ThemeToggle.tsx`** - Dark/light mode switcher
- **`HotkeyHelp.tsx`** - Keyboard shortcut overlay (unused)
- **`config.ts`** - Feature flags
  - `USE_MOCK = true` (currently set, but app uses real API)

### Styles
- **`backend/app/globals.css`** - Global CSS, Tailwind directives, dark mode vars

---

## 4. Configuration Files

### Build & Dev
- **`backend/package.json`** - Dependencies & scripts
  - Scripts: `dev`, `build`, `start`, `lint`
  - Key deps: `@anthropic-ai/sdk`, `next`, `react`, `js-yaml`, `clsx`
  - Dev deps: `typescript`, `tailwindcss`, `tsx`, `eslint`
  
- **`backend/tsconfig.json`** - TypeScript config
  - Target: ES2017, strict mode enabled
  - Path alias: `@/*` → `./` (relative to backend/)
  
- **`backend/next.config.ts`** - Next.js config (empty, uses defaults)
- **`backend/tailwind.config.ts`** - Tailwind CSS config (not read in this scan)
- **`backend/postcss.config.mjs`** - PostCSS config (not read in this scan)
- **`backend/.eslintrc.json`** - ESLint config (not read in this scan)

### Environment Variables
- **`backend/.env.example`** - Template for env vars
  - `ANTHROPIC_API_KEY` - Claude API key (with example key)
  
- **`.env.local`** (root) - Actual env file with real API key
  - `ANTHROPIC_API_KEY=sk-ant-api03-...` (exposed in example, should rotate)

### Version Control
- **`.gitignore`** - Standard Next.js ignores (node_modules, .next, .env.local, etc.)
- **`.gitattributes`** - Git line-ending config

---

## 5. Scripts & Testing

### Manual Test Scripts
- **`backend/scripts/test-ai-flow.ts`** - Smoke test for API
  - Creates lead → sends message → validates AI response
  - Run with: `npx tsx backend/scripts/test-ai-flow.ts` (requires server running)
  
- **`backend/scripts/manual-test.sh`** - Shell script (not read, likely curl tests)
- **`backend/scripts/quick-test.sh`** - Shell script (not read, likely curl tests)

### Test Coverage
- **NO AUTOMATED TESTS** - No Jest, Vitest, Playwright, or Cypress configs found
- **TODO**: Add test suite (unit tests for lib/, integration tests for API routes, E2E for flows)

---

## 6. Data Models

### Primary Entities

#### Lead
```typescript
{
  id: string;                    // UUID
  createdAt: string;             // ISO timestamp
  name: string;
  phone: string;
  email?: string;
  channel: "web" | "sms" | "whatsapp" | "instagram";
  serviceRequested?: string;     // e.g., "Full Detail"
  jobDetails?: string;           // Free-form description from form
  location?: string;             // ZIP code or area
  preferredTimeWindow?: string;  // e.g., "this weekend"
  chosenSlot?: string;           // e.g., "Tomorrow at 2pm"
  status: "NEW" | "QUALIFIED" | "BOOKED" | "ESCALATE";
  estimatedRevenue?: number;     // Dollar amount (e.g., 150)
  messages: LeadMessage[];
  meta?: Record<string, unknown>;
}
```

#### LeadMessage
```typescript
{
  id: string;                    // UUID
  from: "user" | "ai";
  body: string;                  // Message text
  createdAt: string;             // ISO timestamp
}
```

#### ActionContract (AI → Backend Communication)
```typescript
{
  reply: string;                 // Message to send to user
  action: "send_message" | "offer_slots" | "create_booking" | "flag_for_review";
  parameters?: {
    slot?: { datetime: string; duration?: number; };
    lead?: { name: string; phone?: string; email?: string; zip?: string; };
    reason?: string;             // For flag_for_review
  };
  updatedLeadFields?: Partial<Lead>;  // Fields to merge into lead
}
```

#### SlotOption (Time Slot)
```typescript
{
  id: string;
  label: string;                 // Human-readable: "Tomorrow, 3–5pm"
  start: string;                 // ISO 8601 datetime
  end: string;                   // ISO 8601 datetime
}
```

---

## 7. Data Persistence

### Current State: In-Memory Storage
- **Location**: `backend/lib/leads.ts`
- **Storage**: `globalThis.__agentJonesLeadsStore` (Map<string, Lead>)
- **Lifetime**: Survives hot reloads in dev, cleared on server restart
- **Implications**:
  - ✅ Fast, zero config
  - ❌ Data loss on deploy/restart
  - ❌ No multi-instance support (Vercel edge functions)

### Missing: Database Layer
- **TODO**: Add persistent storage (Vercel Postgres, Supabase, or PlanetScale)
- **Schema needed**: `leads` table, `messages` table (1:many)
- **Migration path**: Export `globalThis` store → seed DB → swap `lib/leads.ts` implementation

---

## 8. External Integrations

### Active Integrations
1. **Anthropic Claude API** (`@anthropic-ai/sdk`)
   - Model: `claude-sonnet-4-5-20250929`
   - Used for: conversation handling, welcome messages, daily summaries, follow-up drafting
   - Auth: `ANTHROPIC_API_KEY` env var
   - Error handling: Fallback to generic messages on API failure

### Missing Integrations (TODOs)
- **Calendar API** (Google Calendar, Calendly, Nylas) - booking confirmation not hooked up
- **SMS API** (Twilio, Plivo) - no outbound SMS, only mock references
- **Email API** (SendGrid, Resend) - no email confirmations
- **CRM** (HubSpot, Salesforce) - no lead export
- **Analytics** (PostHog, Mixpanel) - no event tracking

---

## 9. TODOs & Technical Debt

### High Priority
1. **Delete `lib/claudefrontdesk.ts`** - Dead code, replaced by `conductor.ts`
2. **Add database layer** - Replace in-memory storage with Postgres/Supabase
3. **Hook up calendar API** - Actually create appointments when status = BOOKED
4. **Add SMS/email notifications** - Confirmation messages to customers
5. **Rotate exposed API key** - `.env.local` contains real key in repo (if committed)

### Medium Priority
6. **Add test suite** - Unit tests (lib/), API tests (routes), E2E (Playwright)
7. **Add vercel.json** - Deployment config for production
8. **Remove `backend/` nesting** - Flatten to root (see REFACTOR_PLAN.md)
9. **Add input validation** - Zod schemas for API payloads
10. **Error monitoring** - Sentry or similar for production errors

### Low Priority
11. **Remove unused components** - `CountUp.tsx`, `Skeleton.tsx`, `HotkeyHelp.tsx`
12. **Clean up config.ts** - `USE_MOCK` flag is confusing (app uses real API regardless)
13. **Add rate limiting** - Protect API routes from abuse
14. **Optimize AI token usage** - Truncate long conversations to reduce cost
15. **Add lead filtering** - Owner dashboard needs date range, status filters

---

## 10. Dead Code & Unused Files

### Confirmed Dead Code
- **`backend/lib/claudefrontdesk.ts`** - Single mock function, never called
- **`backend/app/api/leads/summary/route.ts`** - Returns metrics, but UI fetches from `/api/leads` directly
- **`backend/components/CountUp.tsx`** - Imported nowhere
- **`backend/components/Skeleton.tsx`** - Imported nowhere
- **`backend/components/HotkeyHelp.tsx`** - Imported nowhere

### Suspicious Files (Verify Before Deleting)
- **`backend/app/api/_env/route.ts`** - Debug endpoint, may be needed in prod
- **`backend/app/api/leads/_env/route.ts`** - Duplicate debug endpoint
- **`.claude/settings.local.json`** - Claude Desktop config (external tool)

---

## 11. Environment Variables

### Required
- **`ANTHROPIC_API_KEY`** - Claude API key (get from console.anthropic.com)

### Optional (Not Yet Used)
- `DATABASE_URL` - Postgres connection string (when DB is added)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` - For SMS (future)
- `SENDGRID_API_KEY` - For email (future)
- `NEXT_PUBLIC_APP_URL` - For canonical URLs (future)

### Current Setup
- **Dev**: `.env.local` at repo root (Next.js auto-loads from parent dir)
- **Prod**: Set in Vercel dashboard or via `vercel env` CLI

---

## 12. Deployment Scripts

### Current State: No CI/CD Config
- **No GitHub Actions** - No `.github/workflows/`
- **No Vercel config** - No `vercel.json` (uses defaults)
- **No Docker** - No `Dockerfile` or `docker-compose.yml`

### Expected Deployment Flow (Vercel)
1. Connect GitHub repo to Vercel
2. Set `ANTHROPIC_API_KEY` in Vercel env vars
3. Set root directory to `backend/` (or flatten structure first)
4. Deploy main branch → auto-deploy on push

### Build Commands (Manual)
```bash
cd backend
npm install
npm run build      # Next.js production build
npm run start      # Start production server
```

---

## 13. Folder Structure Summary

```
agent-jones/
├── backend/                      # Main Next.js app (should be root)
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── _env/
│   │   │   └── leads/
│   │   │       ├── [id]/
│   │   │       │   ├── messages/
│   │   │       │   ├── owner-assist/
│   │   │       │   └── welcome/
│   │   │       ├── _env/
│   │   │       ├── owner-summary/
│   │   │       └── summary/
│   │   ├── demo/
│   │   ├── owner/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── components/               # React components
│   ├── config/                   # AI prompt & knowledge base
│   ├── lib/                      # Business logic & utilities
│   ├── scripts/                  # Test scripts
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .gitignore
│   ├── next.config.ts
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── .env.local                    # Real env vars (root level)
├── .gitattributes
├── .gitignore
└── package-lock.json             # Root lockfile (orphaned?)
```

**Note**: Root-level `package-lock.json` suggests there was a root-level `package.json` at some point (now deleted or moved to `backend/`). This is a refactoring artifact.

---

## 14. Key Insights for Refactoring

1. **App is production-ready** except for data persistence
2. **No database** - biggest blocker for real deployment
3. **Clean API contract** - `ActionContract` in types.ts is well-designed
4. **AI integration is solid** - conductor.ts has good error handling & fallbacks
5. **Frontend is polished** - Dark mode, toast notifications, hotkeys, responsive
6. **No tests** - risky for production changes
7. **Nested structure** - `backend/` should be flattened to repo root
8. **Dead code exists** - safe to delete 3-4 files immediately

---

**End of CODEMAP.md**
