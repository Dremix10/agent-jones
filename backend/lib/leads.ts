import { Lead, LeadMessage, LeadStatus } from "./types";
import { randomUUID } from "crypto";

/**
 * Get the leads store from global scope to survive hot module reloads in dev.
 * In development, Next.js hot reloads modules when files change, which would
 * normally reset the in-memory Map. By storing it on globalThis, we preserve
 * the leads across module reloads as long as the dev server process is alive.
 */
const getLeadsStore = (): Map<string, Lead> => {
  const g = globalThis as any;
  if (!g.__agentJonesLeadsStore) {
    g.__agentJonesLeadsStore = new Map<string, Lead>();
    if (process.env.NODE_ENV !== "production") {
      console.log("[Leads Store] Initialized new global leads store");
    }
  }
  return g.__agentJonesLeadsStore as Map<string, Lead>;
};

const leads = getLeadsStore();

export function createLead(input: {
  name: string;
  phone: string;
  email?: string;
  channel: Lead["channel"];
  serviceRequested?: string;
  jobDetails?: string;
  location?: string;
  preferredTimeWindow?: string;
}): Lead {
  const id = randomUUID();
  const now = new Date().toISOString();

  const lead: Lead = {
    id,
    createdAt: now,
    name: input.name,
    phone: input.phone,
    email: input.email,
    channel: input.channel,
    serviceRequested: input.serviceRequested,
    jobDetails: input.jobDetails,
    location: input.location,
    preferredTimeWindow: input.preferredTimeWindow,
    status: "NEW",
    messages: [],
  };

  leads.set(id, lead);
  return lead;
}

export function listLeads(): Lead[] {
  return Array.from(leads.values()).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  );
}

export function getLead(id: string): Lead | undefined {
  return leads.get(id);
}

export function updateLead(id: string, patch: Partial<Lead>): Lead | undefined {
  const existing = leads.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  leads.set(id, updated);
  return updated;
}

export function addMessageToLead(
  id: string,
  message: Omit<LeadMessage, "id" | "createdAt">,
): Lead | undefined {
  const existing = leads.get(id);
  if (!existing) return undefined;

  const newMessage: LeadMessage = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...message,
  };

  const updated: Lead = {
    ...existing,
    messages: [...existing.messages, newMessage],
  };

  leads.set(id, updated);
  return updated;
}

export function setLeadStatus(id: string, status: LeadStatus): Lead | undefined {
  return updateLead(id, { status });
}
