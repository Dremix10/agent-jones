import { ClaudeActionResponse, Lead } from "./types";

export async function callClaudeForLead(
  lead: Lead,
  latestUserMessage: string,
): Promise<ClaudeActionResponse> {
  // TODO: Wire up actual Claude API call.
  // For now, return a simple mock so the frontend can integrate.

  return {
    reply: `Thanks ${lead.name}, I got your message: "${latestUserMessage}". A human will follow up shortly.`,
    action: "answer_faq",
  };
}
