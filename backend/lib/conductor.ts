import Anthropic from '@anthropic-ai/sdk';
import { ActionContract, Lead } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Conductor Function: Analyzes chat history and returns an ActionContract
 *
 * This function sends the lead's chat history to Claude AI, which analyzes
 * the conversation and decides what action to take next.
 *
 * @param lead - The lead object containing chat history and details
 * @returns ActionContract - The structured action for the Tool Maker backend
 */
export async function callClaudeForLead(lead: Lead): Promise<ActionContract> {
  // Initialize Anthropic client
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });

  // Read system prompt and knowledge base
  const systemPrompt = loadSystemPrompt();
  const knowledgeBase = loadKnowledgeBase();
  
  // Add explicit rules about using already-known lead information
  const enhancedSystemPrompt = `${systemPrompt}

## Critical Rules About Lead Information

The user messages will include a "CURRENT LEAD INFORMATION" section showing everything we already know about the customer from the web form and previous messages.

**BEFORE asking the customer for ANY information, you MUST:**
1. Check the "CURRENT LEAD INFORMATION" section first
2. If the information is already present and non-empty (like name, phone, email, service type, location, etc.), DO NOT ask for it again
3. Silently reuse that information in your responses and actions
4. Only ask for information that is truly missing or clearly incomplete

**Examples:**
- If name and phone are already in the lead info, DO NOT say "What's your name and phone number?" when confirming a booking
- If service type is already known, DO NOT ask "What service are you interested in?"
- If location/ZIP is already provided, DO NOT ask "What's your ZIP code?"

**Exception:** You MAY re-confirm critical information if:
- The customer seems uncertain or changes their mind
- The information appears ambiguous or potentially incorrect
- You need to verify before creating a final booking

Remember: The customer already filled out a form with their basic info. Don't waste their time asking again.

## ActionContract Output Format

You MUST respond with valid JSON matching this TypeScript schema:

\`\`\`typescript
type ActionContract = {
  reply: string;                    // Your message to the customer
  action: 'send_message'            // Continue conversation
        | 'offer_slots'              // Present specific time options
        | 'create_booking'           // Confirm a booking
        | 'flag_for_review';         // Escalate to human
  parameters?: {
    slot?: { datetime: string; duration?: number; };
    lead?: { name: string; phone?: string; email?: string; zip?: string; };
    reason?: string;
  };
  updatedLeadFields?: {              // IMPORTANT: Use this to update lead status and details
    status?: 'NEW' | 'QUALIFIED' | 'BOOKED' | 'ESCALATE';
    serviceRequested?: string;       // e.g., "Full Detail", "Exterior Wash"
    location?: string;               // ZIP code or area
    estimatedRevenue?: number;       // Single numeric value (not a range)
    chosenSlot?: string;             // Chosen time description
    preferredTimeWindow?: string;    // General preference if not yet booked
  };
};
\`\`\`

## Rules for updatedLeadFields

**CRITICAL: You MUST populate updatedLeadFields to track conversation progress!**

### Status Transitions:
- **"NEW"** → Initial contact, no info gathered yet
- **"QUALIFIED"** → Have service type, vehicle type, and location; ready to offer slots
- **"BOOKED"** → Customer confirmed a specific date/time; booking is complete
- **"ESCALATE"** → Complex request, angry customer, or outside scope

### When to Update Status:

1. **Set status = "QUALIFIED" when:**
   - You have collected: service type, vehicle type, and ZIP code
   - Customer is in your service area
   - You are about to offer specific time slots
   - Example updatedLeadFields: { status: "QUALIFIED", serviceRequested: "Full Detail", location: "77005" }

2. **Set status = "BOOKED" when:**
   - Customer explicitly picks or confirms a specific time (e.g., "2pm works", "tomorrow at 3")
   - You are confirming the booking in your reply
   - ALWAYS include estimatedRevenue (calculate from kb.yaml price range midpoint)
   - Example updatedLeadFields: { status: "BOOKED", chosenSlot: "Tomorrow at 2pm", estimatedRevenue: 150, serviceRequested: "Full Detail" }

3. **Set status = "ESCALATE" when:**
   - Customer is angry or frustrated
   - Request is complex or outside standard services
   - You cannot help within normal parameters

### Estimated Revenue Rules:
- When status = "BOOKED", ALWAYS set estimatedRevenue
- Use the MIDPOINT of the price range from kb.yaml for the service + vehicle combination
- Example: If "Full Detail" for SUV is $120-180, use 150
- This is a single number, not a range

### Service Requested:
- Set this when you identify what service the customer wants
- Use exact names from kb.yaml: "Exterior Wash", "Full Detail", "Interior Only"
- Set it even before booking (helps with qualification)

### Chosen Slot:
- Set this when status = "BOOKED"
- Use a clear description: "Tomorrow at 2pm", "Friday, Nov 10 at 3pm"
- This should match what you told the customer in your reply

**Remember:** Your reply and updatedLeadFields must be CONSISTENT. If you say "You're all set for tomorrow at 2pm ($150)", then updatedLeadFields must have status="BOOKED", chosenSlot="Tomorrow at 2pm", estimatedRevenue=150.

## Booking Confirmation Language

When you are clearly confirming a booking with phrases like:
- "You're all set for tomorrow at 2pm"
- "Perfect! You're booked for Friday at 3pm"
- "Your appointment is confirmed"

You MUST:
1. Set action = "create_booking"
2. Set updatedLeadFields.status = "BOOKED"
3. Set updatedLeadFields.serviceRequested to the specific service (e.g., "Full Detail", "Exterior Wash", "Interior Detail")
4. Set updatedLeadFields.estimatedRevenue to a numeric midpoint from the kb.yaml price range
5. Set updatedLeadFields.chosenSlot to match the time you mentioned

This ensures the owner dashboard correctly shows bookings and revenue.`;

  // Format the conversation history for Claude
  const messages = formatMessages(lead);

  try {
    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: `${enhancedSystemPrompt}\n\n## Knowledge Base\n\`\`\`yaml\n${knowledgeBase}\n\`\`\``,
      messages,
      temperature: 0.7,
    });

    // Extract the response text
    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse the JSON response into ActionContract (with fallback inference)
    const actionContract = parseActionContract(responseText, lead);

    return actionContract;
  } catch (error) {
    console.error('Error calling Claude API:', error);

    // Return a fallback response
    return {
      reply: "I'm having trouble processing your request right now. Let me have someone from our team reach out to you shortly.",
      action: 'flag_for_review',
      parameters: {
        reason: `AI error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    };
  }
}

/**
 * Load the system prompt from config/prompt.md
 */
function loadSystemPrompt(): string {
  const promptPath = path.join(process.cwd(), 'config', 'prompt.md');
  return fs.readFileSync(promptPath, 'utf-8');
}

/**
 * Load the knowledge base from config/kb.yaml
 */
function loadKnowledgeBase(): string {
  const kbPath = path.join(process.cwd(), 'config', 'kb.yaml');
  return fs.readFileSync(kbPath, 'utf-8');
}

/**
 * Format lead messages into Claude's message format
 * Includes full lead context so AI knows what info we already have
 */
function formatMessages(lead: Lead): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = [];

  // Build lead context showing all known information
  const leadContext = buildLeadContext(lead);

  // Add conversation history
  // We'll prepend the lead context to the LAST user message so Claude always sees current state
  for (let i = 0; i < lead.messages.length; i++) {
    const msg = lead.messages[i];
    const isLastMessage = i === lead.messages.length - 1;
    
    // Prepend lead context to the last user message (most recent state)
    if (msg.from === 'user' && isLastMessage) {
      messages.push({
        role: 'user',
        content: `${leadContext}\n\nCustomer says: ${msg.body}`,
      });
    } else {
      messages.push({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.body,
      });
    }
  }

  // If the last message is from the AI, we need to add a user continuation prompt
  // This shouldn't normally happen, but let's handle it
  if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
    messages.push({
      role: 'user',
      content: `${leadContext}\n\n(Continue the conversation)`,
    });
  }

  // If there are no messages yet, start with a greeting prompt
  if (messages.length === 0) {
    messages.push({
      role: 'user',
      content: `${leadContext}\n\nNew lead just came in from the web form. Greet them warmly and start the qualification process based on what we already know.`,
    });
  }

  return messages;
}

/**
 * Build a clear context block showing what we already know about the lead
 * This helps Claude avoid asking for information we already have
 */
function buildLeadContext(lead: Lead): string {
  const lines = [
    '=== CURRENT LEAD INFORMATION (Already Collected) ===',
    'This is everything we ALREADY know about this customer from the web form and prior conversation.',
    'DO NOT ask for any information that is already present and non-empty below.',
    '',
    `Lead ID: ${lead.id}`,
    `Name: ${lead.name || '(not provided)'}`,
    `Phone: ${lead.phone || '(not provided)'}`,
    `Email: ${lead.email || '(not provided)'}`,
    `Channel: ${lead.channel}`,
    `Status: ${lead.status}`,
  ];

  if (lead.serviceRequested) {
    lines.push(`Service Requested: ${lead.serviceRequested}`);
  }
  if (lead.jobDetails) {
    lines.push(`Job Details: ${lead.jobDetails}`);
  }
  if (lead.location) {
    lines.push(`Location/ZIP: ${lead.location}`);
  }
  if (lead.preferredTimeWindow) {
    lines.push(`Preferred Time: ${lead.preferredTimeWindow}`);
  }
  if (lead.chosenSlot) {
    lines.push(`Chosen Slot: ${lead.chosenSlot}`);
  }
  if (lead.estimatedRevenue) {
    lines.push(`Estimated Revenue: $${lead.estimatedRevenue}`);
  }

  lines.push('');
  lines.push('IMPORTANT: Before asking the customer for ANY information (name, phone, email, service type, vehicle, ZIP, etc.),');
  lines.push('FIRST check if it is already listed above. If it is present and looks valid, DO NOT ask for it again.');
  lines.push('Only ask for information that is truly missing or incomplete.');
  lines.push('');
  lines.push('STATE HINTS FOR YOU (the AI):');
  lines.push('- If you have proposed exact time options and the customer clearly picks one (e.g., "2pm works", "tomorrow at 3"),');
  lines.push('  treat that as a booking confirmation and set status = "BOOKED" in updatedLeadFields.');
  lines.push('- Always calculate estimatedRevenue as the midpoint of the price range from kb.yaml when booking.');
  lines.push('- Set status = "QUALIFIED" once you have service type, vehicle type, and valid ZIP code.');
  lines.push('===================================================');
  lines.push('');

  return lines.join('\n');
}

/**
 * Infer updatedLeadFields from the AI's reply text as a fallback
 * This is a pragmatic hackathon-grade heuristic to catch cases where Claude
 * forgets to populate updatedLeadFields but clearly indicates a booking.
 */
function inferUpdatedLeadFieldsFromReply(lead: Lead, reply: string): Partial<Lead> | null {
  const text = reply.toLowerCase();
  const updates: Partial<Lead> = {};

  // If the assistant is clearly confirming a booking
  if (
    text.includes("you're all set") ||
    text.includes("you are all set") ||
    text.includes("perfect! you're") ||
    (text.includes("confirmed") && (text.includes("appointment") || text.includes("booking")))
  ) {
    updates.status = "BOOKED";
  }

  // Infer service from either the reply or existing jobDetails
  const source = ((lead.jobDetails || "") + " " + text).toLowerCase();

  if (source.includes("full") && source.includes("detail")) {
    updates.serviceRequested = "Full Detail";
    
    // Full detail: $120-180 → midpoint $150
    // Adjust based on vehicle type if mentioned
    if (source.includes("suv") || source.includes("truck") || source.includes("van")) {
      updates.estimatedRevenue = 165; // Higher end for larger vehicles
    } else {
      updates.estimatedRevenue = 150; // Standard sedan/coupe
    }
  } else if (source.includes("interior") && source.includes("detail")) {
    updates.serviceRequested = "Interior Detail";
    updates.estimatedRevenue = 130; // Interior only: $100-150 midpoint
  } else if (source.includes("exterior") && (source.includes("detail") || source.includes("wash"))) {
    updates.serviceRequested = "Exterior Wash";
    updates.estimatedRevenue = 55; // Basic wash: $40-70 midpoint
  }

  // Try to extract chosen slot from common patterns
  if (updates.status === "BOOKED") {
    // Look for time patterns like "tomorrow at 2pm", "friday at 3pm", "nov 10 at 3:00"
    const slotMatch = text.match(
      /(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|[a-z]+\s+\d{1,2})\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
    );
    if (slotMatch && !updates.chosenSlot) {
      // Capitalize first letter for cleaner display
      const day = slotMatch[1].charAt(0).toUpperCase() + slotMatch[1].slice(1);
      const time = slotMatch[2];
      updates.chosenSlot = `${day} at ${time}`;
    }
  }

  // If we didn't infer anything meaningful, return null
  if (Object.keys(updates).length === 0) {
    return null;
  }

  return updates;
}

/**
 * Parse Claude's response into an ActionContract
 * Claude should return JSON, but we'll extract it if it's wrapped in markdown
 */
function parseActionContract(responseText: string, lead: Lead): ActionContract {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;

    // Parse the JSON
    const parsed = JSON.parse(jsonText.trim()) as ActionContract;

    // Validate required fields
    if (!parsed.reply || typeof parsed.reply !== 'string') {
      throw new Error('Missing or invalid "reply" field');
    }

    if (!parsed.action || typeof parsed.action !== 'string') {
      throw new Error('Missing or invalid "action" field');
    }

    // Validate action type
    const validActions = ['send_message', 'offer_slots', 'create_booking', 'flag_for_review'];
    if (!validActions.includes(parsed.action)) {
      throw new Error(`Invalid action type: ${parsed.action}`);
    }

    // FALLBACK: If Claude didn't set updatedLeadFields, try to infer from the reply text
    if (!parsed.updatedLeadFields || Object.keys(parsed.updatedLeadFields).length === 0) {
      const inferred = inferUpdatedLeadFieldsFromReply(lead, parsed.reply);
      if (inferred) {
        console.log('[Conductor] Inferred updatedLeadFields from reply text:', inferred);
        parsed.updatedLeadFields = {
          ...(parsed.updatedLeadFields ?? {}),
          ...inferred,
        };
      }
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse ActionContract:', error);
    console.error('Response text:', responseText);

    // Return a safe fallback
    return {
      reply: responseText || "I'm processing your request. One moment please.",
      action: 'send_message',
    };
  }
}

/**
 * Generate a personalized welcome message for a new lead
 * 
 * This function creates the first AI message when a customer submits the form.
 * It uses Claude to generate a friendly, contextual greeting that acknowledges
 * what the customer wants and asks ONE clear next question.
 * 
 * @param lead - The newly created lead with form data
 * @returns Promise<string> - The welcome message text
 */
export async function generateWelcomeMessageForLead(lead: Lead): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });

  const jobDetails = (lead.jobDetails || '').trim();
  const name = (lead.name || '').trim();

  const systemPrompt = `
You are the AI front desk for Houston's Finest Mobile Detailing.

A new customer just submitted the website form. You can see their name and what they say they need done.

Your job is to send the very FIRST message in the conversation. Goals:

- Be friendly, concise, and confident.
- Acknowledge what they want using natural language (don't just echo the form verbatim).
- Do NOT ask for their name or phone again.
- Ask exactly ONE clear next question that moves them closer to booking (e.g., confirm ZIP code, preferred day/time, or vehicle type).
- Keep the entire reply under 2 short sentences.

Return ONLY the message text. No JSON, no markdown.
`.trim();

  const userPrompt = `
New lead details from the form:
- Name: ${name || 'Unknown'}
- Job details: ${jobDetails || 'Not specified'}
- Channel: ${lead.channel || 'web'}

Write the first message you would send to this customer, following the system instructions.
`.trim();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.8,
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : '';

    if (!responseText) {
      throw new Error('Claude returned empty response for welcome message');
    }

    return responseText;
  } catch (error) {
    console.error('[Welcome] Error calling Claude API:', error);
    throw error; // Re-throw so the route can handle fallback
  }
}

/**
 * Context for generating an owner daily summary
 */
export interface OwnerDailySummaryContext {
  dateRangeLabel: string; // e.g. "Today", "Last 24 hours"
  totalCount: number;
  totalEstimatedRevenue: number;
  byStatus: {
    NEW: number;
    QUALIFIED: number;
    BOOKED: number;
    ESCALATE: number;
  };
  recentLeads: Array<{
    id: string;
    name: string;
    status: Lead["status"];
    estimatedRevenue: number;
    channel: Lead["channel"];
    createdAt: string;
    lastMessageSnippet: string;
  }>;
}

/**
 * Generate an AI-written daily summary for the shop owner
 * 
 * This function uses Claude to create a short, skimmable briefing about
 * the day's leads, bookings, and revenue.
 * 
 * @param ctx - Context with lead metrics and recent activity
 * @returns Promise<string> - Markdown-formatted summary text
 */
export async function generateOwnerDailySummary(
  ctx: OwnerDailySummaryContext
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = `
You are writing a brief daily summary for the owner of Houston's Finest Mobile Detailing.

Your summary should be:
- Short and skimmable (1 paragraph + 3-6 bullets max)
- Focused on actionable insights
- Written in a friendly but professional tone

Highlight:
- Total leads received
- Booked jobs and estimated revenue
- Any escalated or new leads needing follow-up
- 1-3 interesting patterns or insights (e.g., common questions, peak times, service trends)

Output format: Plain Markdown with headings and bullets. NO JSON.
`.trim();

  const leadsDetails = ctx.recentLeads
    .map((lead) => {
      const revenue = lead.estimatedRevenue > 0 ? `$${lead.estimatedRevenue}` : 'TBD';
      return `- ${lead.name} (${lead.status}, ${revenue}, via ${lead.channel}): "${lead.lastMessageSnippet}"`;
    })
    .join('\n');

  const userPrompt = `
Generate a daily summary for ${ctx.dateRangeLabel}.

## Metrics:
- Total leads: ${ctx.totalCount}
- Estimated revenue: $${ctx.totalEstimatedRevenue}
- Status breakdown:
  - NEW: ${ctx.byStatus.NEW}
  - QUALIFIED: ${ctx.byStatus.QUALIFIED}
  - BOOKED: ${ctx.byStatus.BOOKED}
  - ESCALATE: ${ctx.byStatus.ESCALATE}

## Recent leads:
${leadsDetails || '(No leads yet)'}

Write a concise daily summary following the system instructions.
`.trim();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : '';

    if (!responseText) {
      throw new Error('Claude returned empty response for owner summary');
    }

    return responseText;
  } catch (error) {
    console.error('[Owner Summary] Error calling Claude API:', error);
    throw error; // Re-throw so the route can handle fallback
  }
}

/**
 * Generate an AI-written follow-up suggestion for an escalated lead
 * 
 * This function helps the shop owner handle escalated situations by providing
 * a friendly, human follow-up message or phone script they can use.
 * 
 * @param lead - The escalated lead with conversation history
 * @returns Promise<string> - Follow-up message suggestion
 */
export async function generateOwnerFollowupForEscalatedLead(lead: Lead): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });

  const firstName = (lead.name || 'there').split(' ')[0];
  const serviceInfo = lead.serviceRequested || lead.jobDetails || 'car detailing';
  const locationInfo = lead.location || 'your area';

  // Build a simple transcript of recent messages (last 8)
  const recentMessages = (lead.messages || []).slice(-8);
  const transcript = recentMessages.length > 0
    ? recentMessages
        .map((msg) => {
          const speaker = msg.from === 'user' ? 'customer' : 'ai';
          return `${speaker}: ${msg.body}`;
        })
        .join('\n')
    : '(No conversation yet)';

  const systemPrompt = `
You are an operations assistant for Houston's Finest Mobile Detailing, a small mobile car detailing business in Houston.

The AI front desk had a conversation with a customer that has been marked ESCALATE. This means the owner should personally follow up. Common reasons: pricing concerns, angry tone, scheduling conflict, out-of-service area, special request, or confusion.

Your job: Write a short, friendly follow-up message that the owner can send via SMS or use as a phone script.

Requirements:
- Use the customer's first name if available
- Be warm, empathetic, and human—not robotic
- Address the main concern you can infer from the conversation
- End with a clear next step (e.g., "Can I call you at [time]?" or "Does [alternative] work instead?")
- Keep it under 120 words
- Return plain text only (no markdown, no JSON, no salutation like "Subject:" or "To:")

The owner will copy-paste this directly, so make it ready to send.
`.trim();

  const userPrompt = `
Business: Houston's Finest Mobile Detailing
Lead info:
- Customer name: ${lead.name || 'Unknown'}
- Phone: ${lead.phone || 'Not provided'}
- Service requested: ${serviceInfo}
- Location: ${locationInfo}
- Status: ${lead.status}

Recent conversation:
${transcript}

Write a follow-up message the owner can send to this customer.
`.trim();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : '';

    if (!responseText) {
      throw new Error('Claude returned empty response for owner assist');
    }

    return responseText;
  } catch (error) {
    console.error('[OwnerAssist] Claude error:', error);
    // Return a safe fallback
    return `Hi ${firstName}, this is the owner from Houston's Finest Mobile Detailing. I saw your conversation with our assistant and wanted to personally follow up. When is a good time to call you today?`;
  }
}
