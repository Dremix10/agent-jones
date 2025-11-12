here’s a tight, copy-paste **one-pager** to turn Agent Jones into a shippable MVP for car detailers and land **3 paid pilots fast**.

# AI Front Desk (Detailers) — MVP Ship Plan

## Goal (2–5 days)

Ship a reliable “answer-in-<60s → qualify → offer 2–3 slots → book → notify” product that an owner can use **today** without training. Record a clean 60-sec demo and start pilots.

---

## Offer (what we’ll sell)

**AI Front Desk Sprint (7 days):** we plug in a web/SMS assistant that replies to new leads in <60s, asks 3–5 basics (ZIP, service, vehicle), proposes times, and **books into their calendar**.
**Pilot terms:** €/$0 setup, **€/$280–300/mo** from day 15 (cancel anytime). **Guarantee:** if we don’t book ≥3 jobs in 14 days, first month free.

---

## Must-Have MVP Features (what we’ll finish now)

1. **Lead capture**

   * Web form (Name, Phone, ZIP/City, Service, Vehicle, Notes) + “missed-call → text back” endpoint.
   * Sources: Web, SMS (Twilio), manual “create lead” for testing.

2. **AI conversation engine (Claude)**

   * System prompt + **JSON schema** (Zod) with strict validation & auto-retry.
   * States: `ASK_AREA → ASK_SERVICE → ASK_VEHICLE → OFFER_SLOTS → CONFIRM → BOOK` (+ `ESCALATE`).
   * Guardrails: **no exact prices** (ranges OK), **no promises**, escalate on uncertainty or out-of-area.

3. **Availability & booking**

   * Per-client `config.yaml`: service area ZIPs, services + durations, daily windows, blackout slots, prep/travel padding.
   * Booking creation: **Google Calendar** (primary). **Fallback:** generate **ICS** + email both parties.

4. **Notifications & owner UX**

   * **Customer**: confirmation SMS/email with slot & summary.
   * **Owner**: instant summary email (contact, service, slot, transcript link) + **6pm daily digest** (leads, booked, est. revenue saved).
   * **Mini dashboard**: Leads table (New/Qualified/Booked/Escalate), search, transcript viewer, metrics chips.

5. **Reliability & ops**

   * PII-aware logging, structured request/response logs, error tracking (Sentry).
   * Healthcheck endpoint + uptime pings.
   * `.env.example`, secrets hygiene, deploy on Vercel + managed DB (Supabase/Planetscale or Prisma+SQLite for v0).

---

## Nice-to-Have (if time permits)

* **SMS A2P** registration guide (for long-term deliverability).
* **After-hours mode** (different greeting + tentative bookings).
* **Review-request SMS** 24h after job (toggle).

---

## Engineering Checklist (issue titles you can paste)

* [ ] **Schema wrapper:** Zod validator + retry with exponential backoff on invalid JSON.
* [ ] **State machine:** pure functions: `nextState(state, userInput, aiJson)`.
* [ ] **Calendar adapter:** Google (OAuth or service account) + ICS fallback.
* [ ] **Comms adapters:** `/sms/inbound`, `/sms/send` (Twilio) + email (Resend/SMTP).
* [ ] **Lead model v1:** `id, createdAt, name, phone, zip, service, vehicle, status, slotStart, slotEnd, source, transcript[]`.
* [ ] **Owner summary email** + **daily digest** (Vercel Cron).
* [ ] **Mini dashboard**: list, filter, open transcript, manual escalate/mark booked.
* [ ] **Redaction & logs**; Sentry + basic analytics (first-reply ms, booking rate).
* [ ] **Config per client** (`/configs/{client}.yaml`) and tenant switch via subdomain/env.

---

## Acceptance Tests (pass before pilots)

* **Speed:** first AI reply under **10s** on 4G.
* **Flow:** submit lead → 2 questions → offer 2–3 slots → confirm → calendar event created → both emails sent, **<90s** total.
* **Edge cases:** out-of-area ZIP (escalate), unsupported service (escalate), overlapping slot (offer alternatives), malformed phone (ask again).
* **Reliability:** 10 consecutive happy-path runs, **0** parsing failures (or caught/retried with success).

---

## Demo Assets (record today)

* 60-sec Loom: submit lead → chat qualifies → pick slot → show Google Calendar event → show owner+customer emails → dashboard shows **Booked=1**.
* One-pager PDF (product, price, guarantee, how to start).
* Landing page: headline, 3 bullets, demo video, **“Start 7-day pilot”** form.

---

## Pilot Playbook (path to first dollars)

1. **Pick 10 targets** (detailers you already DM’d / local contacts).
2. Send demo + one-pager → ask for **ZIPs, services, windows** → plug config → go live same day.
3. Forward missed calls to your number (optional) to **prove recovered leads** quickly.
4. Daily results email at 6pm; ask for a 2-line testimonial by day 7.
5. Convert to **€/$280–300/mo** on day 15 or offboard cleanly.

---

## Timeline (48–72 hours)

* **T0–T8h**: schema wrapper, state machine, calendar adapter, emails; wire Twilio sandbox.
* **T8–T16h**: dashboard & daily digest; logs & Sentry; config per client.
* **T16–T24h**: acceptance tests, polish copy, record demo.
* **T24–T48h**: outreach (20–30 msgs/day), launch 1–2 pilots; iterate prompts/windows.
* **T48–T72h**: launch 3rd pilot; add small asks (review SMS, after-hours).

---

## Risks & Mitigations

* **LLM JSON drift →** strict schema + retry; cache clarified prompts.
* **Calendar auth friction →** ICS fallback + owner email confirmation.
* **SMS deliverability →** keep volume low for pilots; prep A2P docs for later.
* **Owner overwhelm →** no dashboards required; keep emails simple; escalate on rules only.

---

## Pricing (for pilots)

* **Starter:** €/$300/mo, €/$0 setup (pilot), then €/$250 setup later.
* **Plus (after MVP proves out):** €/$450/mo (missed-call capture, review SMS, 2 channels).

Want me to turn this into a branded PDF/HTML one-pager and a ready-to-paste **GitHub Project board** with these issues? I can drop both in one go.
