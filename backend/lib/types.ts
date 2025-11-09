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

/**
 * Action Contract: JSON schema for Conductor → Tool Maker communication
 * The Conductor AI produces this object, and Tool Maker backend executes it.
 */
export type ActionContract = {
  /** The message to send to the user (always required) */
  reply: string;

  /** The backend action to perform */
  action: 'send_message' | 'offer_slots' | 'create_booking' | 'flag_for_review';

  /** Optional parameters for specific actions */
  parameters?: {
    // For 'create_booking' action
    slot?: {
      datetime: string;        // ISO 8601 format
      duration?: number;       // Duration in minutes
    };
    lead?: {
      name: string;
      phone?: string;
      email?: string;
      zip?: string;
    };

    // For 'flag_for_review' action
    reason?: string;
  };
};
