# REFACTOR_PLAN.md

**Project**: AI Front Desk (Agent Jones)  
**Date**: November 10, 2025  
**Goal**: Migrate from nested `backend/` structure to production-ready root-level Next.js app with persistent database

---

## Overview

This plan consists of **15 pull requests** that incrementally migrate the codebase to the target architecture. Each PR is:
- **Small** (< 500 lines changed)
- **Testable** (can verify success before moving on)
- **Reversible** (can rollback if issues arise)
- **Non-breaking** (app keeps working after each merge)

**Total Estimated Time**: 2-3 weeks (1-2 PRs per day)  
**Prerequisites**: Access to Vercel account, Anthropic API key rotation

---

## Success Checks Legend

Each step includes verification criteria:
- ✅ **Build**: `npm run build` succeeds
- 🧪 **Test**: Run test command (once tests exist)
- 🌐 **Route**: Endpoint responds correctly
- 👁️ **Visual**: UI renders as expected
- 🔍 **Verify**: Manual check or script validation

---

## Step 1: Audit and Document Current State ✅ (DONE)

**Files**: `CODEMAP.md`, `ARCHITECTURE.md`, `REFACTOR_PLAN.md`, `RISK_LOG.md`

**Actions**:
- [x] Generate CODEMAP.md (entrypoints, routes, data models, env vars)
- [x] Generate ARCHITECTURE.md (current vs. target)
- [x] Generate REFACTOR_PLAN.md (this file)
- [x] Generate RISK_LOG.md (integration risks)

**Success Checks**:
- ✅ All 4 docs exist at repo root
- 👁️ Docs are readable and comprehensive

**Git Commit**:
```bash
git add CODEMAP.md ARCHITECTURE.md REFACTOR_PLAN.md RISK_LOG.md
git commit -m "docs: add strategic refactoring documentation"
```

---

## Step 2: Remove Dead Code

**Goal**: Delete unused files to reduce cognitive load

**Files to DELETE**:
- `backend/lib/claudefrontdesk.ts` (old mock, replaced by conductor.ts)
- `backend/components/CountUp.tsx` (unused)
- `backend/components/Skeleton.tsx` (unused)
- `backend/components/HotkeyHelp.tsx` (unused)
- `backend/app/api/leads/summary/route.ts` (unused, UI calls /api/leads directly)

**Files to UPDATE**:
- None (these files have no imports)

**Success Checks**:
- ✅ `npm run build` passes
- 🔍 `grep -r "claudefrontdesk" backend/` returns no results
- 🔍 `grep -r "CountUp" backend/` returns no results
- 🔍 `grep -r "Skeleton" backend/` returns no results

**Git Commit**:
```bash
git rm backend/lib/claudefrontdesk.ts
git rm backend/components/CountUp.tsx
git rm backend/components/Skeleton.tsx
git rm backend/components/HotkeyHelp.tsx
git rm backend/app/api/leads/summary/route.ts
git commit -m "refactor: remove unused components and dead code"
```

---

## Step 3: Add Test Infrastructure

**Goal**: Set up testing framework before making structural changes

**Files to CREATE**:
- `vitest.config.ts` - Test runner config
- `tests/setup.ts` - Test environment setup
- `tests/unit/lib/leads.test.ts` - Example unit test for leads.ts
- `tests/integration/api/leads.test.ts` - Example API test

**Files to UPDATE**:
- `package.json` - Add test scripts and dependencies

**Package.json Changes**:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^1.0.0",
    "vitest": "^1.0.0"
  }
}
```

**Example Test (tests/unit/lib/leads.test.ts)**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createLead, getLead, listLeads } from '@/lib/leads';

describe('leads module', () => {
  beforeEach(() => {
    // Clear in-memory store before each test
    const store = (globalThis as any).__agentJonesLeadsStore;
    if (store) store.clear();
  });

  it('creates a lead with required fields', () => {
    const lead = createLead({
      name: 'Test User',
      phone: '555-1234',
      channel: 'web',
    });
    
    expect(lead.id).toBeDefined();
    expect(lead.name).toBe('Test User');
    expect(lead.status).toBe('NEW');
  });

  it('retrieves a lead by id', () => {
    const lead = createLead({ name: 'Test', phone: '555', channel: 'web' });
    const retrieved = getLead(lead.id);
    expect(retrieved?.id).toBe(lead.id);
  });
});
```

**Success Checks**:
- ✅ `npm run build` passes
- 🧪 `npm test` runs and passes (2 tests)
- 🔍 Coverage report generates

**Git Commit**:
```bash
git add vitest.config.ts tests/ package.json
git commit -m "test: add vitest framework and initial unit tests"
```

---

## Step 4: Add Input Validation (Zod)

**Goal**: Validate API payloads to prevent runtime errors

**Files to CREATE**:
- `lib/schemas.ts` - Zod schemas for API validation

**Files to UPDATE**:
- `package.json` - Add zod dependency
- `app/api/leads/route.ts` - Validate POST body
- `app/api/leads/[id]/messages/route.ts` - Validate POST body

**Package.json Changes**:
```json
{
  "dependencies": {
    "zod": "^3.22.0"
  }
}
```

**New File: lib/schemas.ts**:
```typescript
import { z } from 'zod';

export const CreateLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  email: z.string().email().optional(),
  channel: z.enum(['web', 'sms', 'whatsapp', 'instagram']),
  serviceRequested: z.string().optional(),
  jobDetails: z.string().optional(),
  location: z.string().optional(),
  preferredTimeWindow: z.string().optional(),
});

export const SendMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});
```

**Update: app/api/leads/route.ts**:
```typescript
import { CreateLeadSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Validate input
  const result = CreateLeadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const lead = createLead(result.data);
  return NextResponse.json({ lead }, { status: 201 });
}
```

**Success Checks**:
- ✅ `npm run build` passes
- 🧪 `npm test` passes
- 🌐 `POST /api/leads` with invalid data returns 400
- 🌐 `POST /api/leads` with valid data returns 201

**Git Commit**:
```bash
git add lib/schemas.ts app/api/leads/route.ts app/api/leads/[id]/messages/route.ts package.json
git commit -m "feat: add Zod input validation for API routes"
```

---

## Step 5: Prepare Database Schema

**Goal**: Define schema without connecting yet (safe to merge)

**Files to CREATE**:
- `db/schema.sql` - Postgres DDL
- `db/migrations/001_initial_schema.sql` - Migration file
- `lib/db.ts` - Database client stub (not yet used)

**New File: db/schema.sql**:
```sql
-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('web', 'sms', 'whatsapp', 'instagram')),
  service_requested TEXT,
  job_details TEXT,
  location TEXT,
  preferred_time_window TEXT,
  chosen_slot TEXT,
  status TEXT NOT NULL CHECK (status IN ('NEW', 'QUALIFIED', 'BOOKED', 'ESCALATE')),
  estimated_revenue NUMERIC(10,2),
  meta JSONB
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  from_role TEXT NOT NULL CHECK (from_role IN ('user', 'ai')),
  body TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_messages_lead_id ON messages(lead_id, created_at);
```

**New File: lib/db.ts** (stub):
```typescript
// Database client - not yet connected
// Will be implemented in Step 7

export type DbLead = {
  id: string;
  created_at: Date;
  name: string;
  phone: string;
  email: string | null;
  channel: string;
  service_requested: string | null;
  job_details: string | null;
  location: string | null;
  preferred_time_window: string | null;
  chosen_slot: string | null;
  status: string;
  estimated_revenue: number | null;
  meta: any | null;
};

export type DbMessage = {
  id: string;
  lead_id: string;
  created_at: Date;
  from_role: string;
  body: string;
};

// Stub functions (to be implemented)
export async function dbCreateLead(data: any): Promise<DbLead> {
  throw new Error('Database not yet connected');
}

export async function dbGetLead(id: string): Promise<DbLead | null> {
  throw new Error('Database not yet connected');
}
```

**Success Checks**:
- ✅ `npm run build` passes
- 🔍 Files exist but are not imported anywhere yet
- 👁️ Schema looks correct (review DDL)

**Git Commit**:
```bash
git add db/ lib/db.ts
git commit -m "feat: add database schema and migration files (not yet active)"
```

---

## Step 6: Flatten Directory Structure (The Big Move)

**Goal**: Move `backend/*` to root, update all import paths

**Actions**:
1. **Move directories**:
   ```bash
   mv backend/app ./app
   mv backend/components ./components
   mv backend/lib ./lib
   mv backend/config ./config
   mv backend/scripts ./scripts
   mv backend/next.config.ts ./next.config.ts
   mv backend/tsconfig.json ./tsconfig.json
   mv backend/tailwind.config.ts ./tailwind.config.ts
   mv backend/postcss.config.mjs ./postcss.config.mjs
   mv backend/.eslintrc.json ./.eslintrc.json
   mv backend/.env.example ./.env.example
   ```

2. **Update package.json** (merge root + backend):
   ```bash
   # Manually merge dependencies from backend/package.json to root
   rm backend/package.json backend/package-lock.json
   ```

3. **Update tsconfig.json** paths (if needed):
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]  // Already correct
       }
     }
   }
   ```

4. **Delete empty backend/ folder**:
   ```bash
   rm -rf backend/
   ```

**Files to UPDATE** (import path changes):
- None! The `@/*` alias already points to the correct location

**Success Checks**:
- ✅ `npm run build` passes
- 🧪 `npm test` passes
- 🌐 `npm run dev` starts server on localhost:3000
- 👁️ Visit `/demo` - form and chat work
- 👁️ Visit `/owner` - dashboard displays
- 🔍 No `backend/` references in import statements

**Git Commit**:
```bash
git add -A
git commit -m "refactor: flatten directory structure (move backend/ to root)"
```

**⚠️ CRITICAL**: This is the largest change. Test thoroughly before moving to Step 7.

---

## Step 7: Connect Database (Behind Feature Flag)

**Goal**: Add real database, but keep in-memory fallback

**Files to CREATE**:
- `lib/db-client.ts` - Vercel Postgres connection pool

**Files to UPDATE**:
- `package.json` - Add @vercel/postgres
- `.env.example` - Add DATABASE_URL
- `lib/db.ts` - Implement real queries
- `lib/leads.ts` - Add dual-write mode (Map + DB)

**Package.json Changes**:
```json
{
  "dependencies": {
    "@vercel/postgres": "^0.5.0"
  }
}
```

**Update .env.example**:
```bash
ANTHROPIC_API_KEY=your_key_here
DATABASE_URL=postgres://user:pass@host:5432/dbname
USE_DATABASE=false  # Toggle database usage
```

**New File: lib/db-client.ts**:
```typescript
import { sql } from '@vercel/postgres';

export { sql };

export const db = {
  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    const result = await sql.query(query, params);
    return result.rows as T[];
  },
};
```

**Update lib/db.ts** (implement real queries):
```typescript
import { sql } from '@vercel/postgres';
import type { Lead, LeadMessage } from './types';

export async function dbCreateLead(data: Omit<Lead, 'id' | 'createdAt' | 'messages'>): Promise<Lead> {
  const result = await sql`
    INSERT INTO leads (name, phone, email, channel, service_requested, job_details, location, preferred_time_window, status)
    VALUES (${data.name}, ${data.phone}, ${data.email || null}, ${data.channel}, 
            ${data.serviceRequested || null}, ${data.jobDetails || null}, 
            ${data.location || null}, ${data.preferredTimeWindow || null}, 'NEW')
    RETURNING *
  `;
  
  const row = result.rows[0];
  return {
    id: row.id,
    createdAt: row.created_at.toISOString(),
    name: row.name,
    phone: row.phone,
    email: row.email,
    channel: row.channel,
    serviceRequested: row.service_requested,
    jobDetails: row.job_details,
    location: row.location,
    preferredTimeWindow: row.preferred_time_window,
    chosenSlot: row.chosen_slot,
    status: row.status,
    estimatedRevenue: row.estimated_revenue,
    messages: [],
    meta: row.meta,
  };
}

export async function dbGetLead(id: string): Promise<Lead | null> {
  const leadResult = await sql`SELECT * FROM leads WHERE id = ${id}`;
  if (leadResult.rows.length === 0) return null;
  
  const row = leadResult.rows[0];
  const messagesResult = await sql`
    SELECT * FROM messages WHERE lead_id = ${id} ORDER BY created_at ASC
  `;
  
  return {
    id: row.id,
    createdAt: row.created_at.toISOString(),
    name: row.name,
    phone: row.phone,
    email: row.email,
    channel: row.channel,
    serviceRequested: row.service_requested,
    jobDetails: row.job_details,
    location: row.location,
    preferredTimeWindow: row.preferred_time_window,
    chosenSlot: row.chosen_slot,
    status: row.status,
    estimatedRevenue: row.estimated_revenue,
    messages: messagesResult.rows.map(m => ({
      id: m.id,
      from: m.from_role as 'user' | 'ai',
      body: m.body,
      createdAt: m.created_at.toISOString(),
    })),
    meta: row.meta,
  };
}

// ... similar for dbListLeads, dbUpdateLead, dbAddMessage
```

**Update lib/leads.ts** (dual-write):
```typescript
import * as db from './db';

const USE_DATABASE = process.env.USE_DATABASE === 'true';

export async function createLead(input: any): Promise<Lead> {
  if (USE_DATABASE) {
    return await db.dbCreateLead(input);
  }
  
  // Fallback to in-memory (existing code)
  const id = randomUUID();
  // ... existing implementation
}
```

**Success Checks**:
- ✅ `npm run build` passes
- 🧪 `npm test` passes
- 🌐 With `USE_DATABASE=false`: App works as before (in-memory)
- 🌐 With `USE_DATABASE=true` + local Postgres: App uses database
- 🔍 Check Postgres: `SELECT * FROM leads;` shows data

**Git Commit**:
```bash
git add lib/db.ts lib/db-client.ts lib/leads.ts package.json .env.example
git commit -m "feat: add database layer with feature flag (USE_DATABASE)"
```

---

## Step 8: Run Database Migration

**Goal**: Initialize schema in Vercel Postgres

**Prerequisites**:
- Vercel project connected to repo
- Vercel Postgres database created
- `DATABASE_URL` set in Vercel environment variables

**Actions**:
1. Create migration script in package.json:
   ```json
   {
     "scripts": {
       "db:migrate": "tsx scripts/migrate.ts"
     }
   }
   ```

2. Create `scripts/migrate.ts`:
   ```typescript
   import { sql } from '@vercel/postgres';
   import * as fs from 'fs';
   import * as path from 'path';

   async function migrate() {
     const schemaPath = path.join(process.cwd(), 'db', 'migrations', '001_initial_schema.sql');
     const schema = fs.readFileSync(schemaPath, 'utf-8');
     
     console.log('Running migration...');
     await sql.query(schema);
     console.log('✅ Migration complete');
   }

   migrate().catch(console.error);
   ```

3. Run migration locally:
   ```bash
   DATABASE_URL="postgres://..." npm run db:migrate
   ```

4. Run migration in Vercel:
   ```bash
   vercel env pull .env.local
   npm run db:migrate
   ```

**Success Checks**:
- 🔍 Local Postgres: Tables exist (`\dt` in psql)
- 🔍 Vercel Postgres: Tables exist (check Vercel dashboard)
- 🌐 `USE_DATABASE=true` works without errors

**Git Commit**:
```bash
git add scripts/migrate.ts package.json
git commit -m "feat: add database migration script"
```

---

## Step 9: Enable Database in Production

**Goal**: Switch from in-memory to database in Vercel

**Actions**:
1. Set Vercel environment variable:
   ```bash
   vercel env add USE_DATABASE production
   # Enter: true
   ```

2. Deploy to Vercel:
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

3. Monitor deployment:
   - Check Vercel logs for errors
   - Test `/demo` flow end-to-end
   - Verify leads persist after redeploy

**Success Checks**:
- 🌐 Production `/demo` creates lead
- 🌐 Production `/owner` displays lead
- 🔍 Check database: Lead exists in Postgres
- 🔍 Redeploy → Lead still exists (persistence confirmed)

**Git Commit**:
```bash
# No code changes, just env var update
# Document in commit message
git commit --allow-empty -m "deploy: enable database in production (USE_DATABASE=true)"
```

---

## Step 10: Remove In-Memory Fallback

**Goal**: Simplify code by removing Map storage

**Files to UPDATE**:
- `lib/leads.ts` - Remove `globalThis.__agentJonesLeadsStore` logic
- `lib/leads.ts` - Remove `USE_DATABASE` check, always use DB

**Before (dual-write)**:
```typescript
export async function createLead(input: any): Promise<Lead> {
  if (USE_DATABASE) {
    return await db.dbCreateLead(input);
  }
  
  // In-memory fallback
  const id = randomUUID();
  const lead = { id, ...input, messages: [], status: 'NEW', createdAt: new Date().toISOString() };
  leads.set(id, lead);
  return lead;
}
```

**After (DB only)**:
```typescript
export async function createLead(input: any): Promise<Lead> {
  return await db.dbCreateLead(input);
}
```

**Success Checks**:
- ✅ `npm run build` passes
- 🧪 `npm test` passes (update tests to use DB)
- 🌐 Deployed to Vercel → works correctly
- 🔍 No `globalThis.__agentJonesLeadsStore` references remain

**Git Commit**:
```bash
git add lib/leads.ts
git commit -m "refactor: remove in-memory storage, use database exclusively"
```

---

## Step 11: Add API Integration Tests

**Goal**: Test API routes against real database

**Files to CREATE**:
- `tests/integration/api/leads.test.ts` - Full CRUD tests
- `tests/integration/api/messages.test.ts` - Message flow tests

**Example Test**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { sql } from '@vercel/postgres';

describe('POST /api/leads', () => {
  beforeEach(async () => {
    // Clear test database
    await sql`DELETE FROM messages`;
    await sql`DELETE FROM leads`;
  });

  it('creates a lead and returns 201', async () => {
    const res = await fetch('http://localhost:3000/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        phone: '555-1234',
        channel: 'web',
      }),
    });
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.lead.id).toBeDefined();
    expect(data.lead.name).toBe('Test User');
  });
});
```

**Success Checks**:
- 🧪 `npm test` passes (integration tests run)
- 🔍 Tests run against local Postgres (not production)
- 📊 Coverage report shows API routes covered

**Git Commit**:
```bash
git add tests/integration/
git commit -m "test: add integration tests for API routes"
```

---

## Step 12: Add vercel.json Deployment Config

**Goal**: Configure Vercel for optimal performance

**Files to CREATE**:
- `vercel.json` - Deployment configuration

**New File: vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

**Success Checks**:
- ✅ `vercel build` succeeds locally
- 🌐 Deploy to Vercel → uses config
- 🔍 Vercel dashboard shows correct region (iad1 = Virginia)
- 🔍 API routes have 30s timeout (for slow Claude API calls)

**Git Commit**:
```bash
git add vercel.json
git commit -m "feat: add Vercel deployment configuration"
```

---

## Step 13: Add Error Monitoring (Sentry)

**Goal**: Capture production errors for debugging

**Files to CREATE**:
- `lib/sentry.ts` - Sentry client setup
- `app/error.tsx` - Error boundary component

**Files to UPDATE**:
- `package.json` - Add @sentry/nextjs
- `next.config.ts` - Add Sentry plugin
- `.env.example` - Add SENTRY_DSN

**Package.json Changes**:
```json
{
  "dependencies": {
    "@sentry/nextjs": "^7.80.0"
  }
}
```

**New File: lib/sentry.ts**:
```typescript
import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% sampling
    beforeSend(event, hint) {
      // Don't send API key errors to Sentry
      if (event.message?.includes('ANTHROPIC_API_KEY')) {
        return null;
      }
      return event;
    },
  });
}
```

**Update next.config.ts**:
```typescript
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig = {};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: 'your-org',
  project: 'agent-jones',
});
```

**Success Checks**:
- ✅ `npm run build` passes
- 🌐 Deploy to Vercel → Sentry captures errors
- 🔍 Trigger test error → appears in Sentry dashboard
- 🔍 API key errors are NOT sent to Sentry (privacy)

**Git Commit**:
```bash
git add lib/sentry.ts app/error.tsx next.config.ts package.json .env.example
git commit -m "feat: add Sentry error monitoring"
```

---

## Step 14: Add Calendar Integration (Google Calendar)

**Goal**: Create real calendar events when status = BOOKED

**Files to CREATE**:
- `lib/integrations/calendar.ts` - Calendar interface
- `lib/integrations/google-calendar.ts` - Google Calendar implementation

**Files to UPDATE**:
- `package.json` - Add googleapis
- `.env.example` - Add Google Calendar credentials
- `app/api/leads/[id]/messages/route.ts` - Call calendar.createEvent()

**Package.json Changes**:
```json
{
  "dependencies": {
    "googleapis": "^128.0.0"
  }
}
```

**New File: lib/integrations/calendar.ts**:
```typescript
export interface CalendarEvent {
  title: string;
  description: string;
  start: string; // ISO datetime
  end: string;
  attendees: Array<{ email: string; name: string; }>;
}

export interface CalendarProvider {
  createEvent(event: CalendarEvent): Promise<string>; // Returns event URL
}
```

**New File: lib/integrations/google-calendar.ts**:
```typescript
import { google } from 'googleapis';
import type { CalendarProvider, CalendarEvent } from './calendar';

export class GoogleCalendar implements CalendarProvider {
  private calendar = google.calendar('v3');

  async createEvent(event: CalendarEvent): Promise<string> {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CALENDAR_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const response = await this.calendar.events.insert({
      auth,
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.start },
        end: { dateTime: event.end },
        attendees: event.attendees,
      },
    });

    return response.data.htmlLink || '';
  }
}
```

**Update app/api/leads/[id]/messages/route.ts**:
```typescript
import { GoogleCalendar } from '@/lib/integrations/google-calendar';

// After AI returns ActionContract
if (action.updatedLeadFields?.status === 'BOOKED' && action.parameters?.slot) {
  const calendar = new GoogleCalendar();
  const eventUrl = await calendar.createEvent({
    title: `${updatedLead.name} - ${updatedLead.serviceRequested || 'Car Detail'}`,
    description: updatedLead.jobDetails || '',
    start: action.parameters.slot.datetime,
    end: new Date(new Date(action.parameters.slot.datetime).getTime() + 3 * 60 * 60 * 1000).toISOString(),
    attendees: [{ email: updatedLead.email || '', name: updatedLead.name }],
  });
  
  console.log('[Calendar] Event created:', eventUrl);
}
```

**Success Checks**:
- ✅ `npm run build` passes
- 🌐 Book a lead in `/demo`
- 🔍 Check Google Calendar → event appears
- 📧 Customer receives email invite (if email provided)

**Git Commit**:
```bash
git add lib/integrations/ app/api/leads/[id]/messages/route.ts package.json .env.example
git commit -m "feat: integrate Google Calendar for bookings"
```

---

## Step 15: Add SMS Notifications (Twilio)

**Goal**: Send SMS confirmations when bookings are made

**Files to CREATE**:
- `lib/integrations/sms.ts` - SMS interface
- `lib/integrations/twilio.ts` - Twilio implementation

**Files to UPDATE**:
- `package.json` - Add twilio
- `.env.example` - Add Twilio credentials
- `app/api/leads/[id]/messages/route.ts` - Call sms.send()

**Package.json Changes**:
```json
{
  "dependencies": {
    "twilio": "^4.19.0"
  }
}
```

**New File: lib/integrations/sms.ts**:
```typescript
export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}
```

**New File: lib/integrations/twilio.ts**:
```typescript
import twilio from 'twilio';
import type { SmsProvider } from './sms';

export class TwilioSms implements SmsProvider {
  private client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  async send(to: string, message: string): Promise<void> {
    await this.client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body: message,
    });
  }
}
```

**Update app/api/leads/[id]/messages/route.ts**:
```typescript
import { TwilioSms } from '@/lib/integrations/twilio';

// After booking confirmation
if (action.updatedLeadFields?.status === 'BOOKED') {
  const sms = new TwilioSms();
  await sms.send(
    updatedLead.phone,
    `🚗 Booking confirmed! ${updatedLead.chosenSlot} for ${updatedLead.serviceRequested}. We'll see you soon!`
  );
}
```

**Success Checks**:
- ✅ `npm run build` passes
- 🌐 Book a lead in `/demo`
- 📱 Check phone → SMS received
- 🔍 Twilio dashboard shows sent message

**Git Commit**:
```bash
git add lib/integrations/ app/api/leads/[id]/messages/route.ts package.json .env.example
git commit -m "feat: add Twilio SMS notifications for bookings"
```

---

## Post-Refactor Checklist

### Validation Steps
- [ ] All 15 PRs merged to main
- [ ] Production deploy successful
- [ ] Database contains real data
- [ ] Test lead flow: form → chat → booking
- [ ] Calendar event created
- [ ] SMS notification sent
- [ ] Error monitoring active (Sentry)
- [ ] No console errors in browser
- [ ] Lighthouse score > 90
- [ ] API latency < 2s (p95)

### Documentation Updates
- [ ] Update README.md with new folder structure
- [ ] Add CONTRIBUTING.md with local setup instructions
- [ ] Document environment variables in .env.example
- [ ] Add API documentation (OpenAPI spec or similar)

### Cleanup Tasks
- [ ] Remove old `backend/` references from docs
- [ ] Archive old package-lock.json (root level)
- [ ] Rotate ANTHROPIC_API_KEY (old one was in git)
- [ ] Set up Vercel Edge Config for feature flags
- [ ] Configure Vercel Cron for daily summaries

---

## Rollback Plan

If any step fails critically:

1. **Revert last commit**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Redeploy previous version**:
   ```bash
   vercel rollback
   ```

3. **Check environment variables**:
   ```bash
   vercel env ls
   # Ensure DATABASE_URL and ANTHROPIC_API_KEY are set
   ```

4. **Emergency fallback** (if database is down):
   ```bash
   vercel env add USE_DATABASE production
   # Enter: false
   vercel --prod
   ```

---

## Timeline Estimate

| Step | Effort | Dependencies | Risk |
|------|--------|--------------|------|
| 1. Docs | 4h | None | Low |
| 2. Dead code | 1h | Step 1 | Low |
| 3. Tests | 3h | Step 2 | Low |
| 4. Validation | 2h | Step 3 | Low |
| 5. DB schema | 2h | Step 3 | Low |
| 6. Flatten | 3h | Step 5 | **High** |
| 7. DB connect | 4h | Step 6 | Medium |
| 8. Migration | 2h | Step 7 | Medium |
| 9. Enable DB | 1h | Step 8 | Medium |
| 10. Remove fallback | 2h | Step 9 | Low |
| 11. API tests | 3h | Step 10 | Low |
| 12. Vercel config | 1h | Step 11 | Low |
| 13. Sentry | 2h | Step 12 | Low |
| 14. Calendar | 4h | Step 13 | Medium |
| 15. SMS | 3h | Step 14 | Low |

**Total**: ~37 hours (~5 days at 8h/day)  
**With testing & bug fixes**: 2-3 weeks

---

**End of REFACTOR_PLAN.md**
