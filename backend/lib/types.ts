export type LeadStatus = "NEW" | "QUALIFIED" | "BOOKED" | "ESCALATE";

export type LeadChannel = "web" | "sms" | "whatsapp" | "instagram";

export interface LeadMessage {
  id: string;
  from: "user" | "ai";
  body: string;
  createdAt: string; // ISO timestamp
}

export interface Lead {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
  serviceRequested?: string;
  jobDetails?: string;
  location?: string;
  preferredTimeWindow?: string;
  chosenSlot?: string;
  status: LeadStatus;
  estimatedRevenue?: number;
  messages: LeadMessage[];
  meta?: Record<string, unknown>;
}

export interface SlotOption {
  id: string;
  label: string; // e.g. "Tomorrow, 3–5pm"
  start: string; // ISO start
  end: string;   // ISO end
}

export type ClaudeActionType =
  | "offer_slots"
  | "confirm_booking"
  | "collect_missing_info"
  | "answer_faq"
  | "escalate";

export interface ClaudeActionResponse {
  reply: string;
  action: ClaudeActionType;
  need?: string;
  slotOptions?: SlotOption[];
  chosenSlotId?: string;
  escalate?: boolean;
  updatedLeadFields?: Partial<Lead>;
}
