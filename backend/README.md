# AI Front Desk — Backend

**Judge Mode Demo Path:**
1. `/` → Click "Start Customer Flow"
2. `/demo` → Run scenario (use hotkey `1`/`2`/`3`), chat, book job
3. Click "View in Dashboard" after booking
4. `/owner` → Drawer auto-opens with lead details, view summary metrics

**Hotkeys (Judge Mode):**
- `1` / `2` / `3` — Pre-fill scenario 1/2/3
- `Enter` — Start chat (when on form)
- `S` — Select first available slot
- `O` — Navigate to `/owner`

**Mock Toggle:**
Edit `backend/components/config.ts`:
```ts
export const USE_MOCK = true; // or false for live API
```

**Run Locally:**
```bash
cd backend
npm install
npm run dev
# Server prints port (usually http://localhost:3000)
```

**Ownership Contract:**
- **Person A** (Backend/AI): `backend/app/api/**`, `backend/lib/claudefrontdesk.ts`
- **Person B** (Frontend/UI): `backend/app/**` (pages), `backend/components/**`
- **Person C** (Integration): `backend/lib/leads.ts`, `backend/config/kb.yaml`

**Tech Stack:**
Next.js 15 App Router, TypeScript, Tailwind CSS. In-memory mock data (no external DB).
