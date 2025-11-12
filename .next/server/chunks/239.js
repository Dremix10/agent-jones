exports.id=239,exports.ids=[239],exports.modules={4954:(a,b,c)=>{"use strict";c.d(b,{AP:()=>g,DT:()=>h,ni:()=>i,q6:()=>j,tR:()=>f});var d=c(5511);let e=(()=>{let a=globalThis;return a.__agentJonesLeadsStore||(a.__agentJonesLeadsStore=new Map),a.__agentJonesLeadsStore})();function f(a){let b=(0,d.randomUUID)(),c={id:b,createdAt:new Date().toISOString(),name:a.name,phone:a.phone,email:a.email,channel:a.channel,serviceRequested:a.serviceRequested,jobDetails:a.jobDetails,location:a.location,preferredTimeWindow:a.preferredTimeWindow,status:"NEW",messages:[]};return e.set(b,c),c}function g(){return Array.from(e.values()).sort((a,b)=>a.createdAt.localeCompare(b.createdAt))}function h(a){return e.get(a)}function i(a,b){let c=e.get(a);if(!c)return null;let d={...c,...b};return e.set(a,d),d}function j(a,b){let c=e.get(a);if(!c)return;let f={id:(0,d.randomUUID)(),createdAt:new Date().toISOString(),...b},g={...c,messages:[...c.messages,f]};return e.set(a,g),g}},6487:()=>{},6516:(a,b,c)=>{"use strict";c.d(b,{AS:()=>h,S$:()=>i,mO:()=>g,w0:()=>j});var d=c(8391),e=c(9021),f=c(9902);async function g(a){let b=process.env.ANTHROPIC_API_KEY;if(!b)throw Error("ANTHROPIC_API_KEY environment variable is not set");let c=new d.Ay({apiKey:b}),g=function(){let a=f.join(process.cwd(),"configs","prompt.md");return e.readFileSync(a,"utf-8")}(),h=function(){let a=f.join(process.cwd(),"configs","kb.yaml");return e.readFileSync(a,"utf-8")}(),i=`${g}

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

## Phone Number Handling

**CRITICAL: Do not re-ask for phone numbers when we already have them!**

- You always receive the customer's phone number as lead.phone in the "CURRENT LEAD INFORMATION" section when it's available.
- If lead.phone is present and looks valid (not "0000", "test", or too short), **DO NOT ask the customer for their phone number again**.
- Instead, reference it directly in your messages, e.g., "We'll give you a call at 832-555-0202" or "You'll get a confirmation text at this number."
- Only ask for a phone number if it is truly missing from the lead info or clearly invalid/placeholder.

**When escalating:**
- If you already have a valid lead.phone, assume the owner can reach them there.
- DO NOT ask "What's the best number to call?" or similar questions.
- Instead, say something like: "The owner will follow up with you shortly at [phone number]" or "You'll hear from us at the number you provided."

## Service Area & Escalations

**CRITICAL: Do not confirm bookings for customers outside our service area!**

- If the ZIP code or location is clearly **outside our normal Houston service area**, or you tell the customer things like:
  - "a bit outside our main service area"
  - "outside our service area"
  - "let me check with our team/manager if we can accommodate you"
  - "we don't usually go that far"
  - Any indication you need owner approval for their location

- Then you MUST:
  1. **Do NOT confirm a booking** (do not say "you're all set" or give a confirmed appointment)
  2. Set updatedLeadFields.status = "ESCALATE"
  3. Set action = "none"
  4. In your reply, tell the customer that the owner/manager will follow up to confirm if we can make an exception
  5. If lead.phone is already present, reference it (e.g., "We'll call you at [number]"). Only ask for their phone/preferred times if the phone is truly missing.

- Only use status: "BOOKED" when you are **confident we can serve the customer** in our area and you are truly confirming an appointment.

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

**IMPORTANT:** Never use booking confirmation language ("you're all set...", "your appointment is confirmed") if you just told the customer you might need to check if we can accommodate their location. Those cases should be status: "ESCALATE" instead, as described in the Service Area & Escalations section above.

This ensures the owner dashboard correctly shows bookings and revenue.`,j=function(a){let b=[],c=function(a){let b=["=== CURRENT LEAD INFORMATION (Already Collected) ===","This is everything we ALREADY know about this customer from the web form and prior conversation.","DO NOT ask for any information that is already present and non-empty below.","",`Lead ID: ${a.id}`,`Name: ${a.name||"(not provided)"}`,`Phone: ${a.phone||"(not provided)"}`,`Email: ${a.email||"(not provided)"}`,`Channel: ${a.channel}`,`Status: ${a.status}`];return a.serviceRequested&&b.push(`Service Requested: ${a.serviceRequested}`),a.jobDetails&&b.push(`Job Details: ${a.jobDetails}`),a.location&&b.push(`Location/ZIP: ${a.location}`),a.preferredTimeWindow&&b.push(`Preferred Time: ${a.preferredTimeWindow}`),a.chosenSlot&&b.push(`Chosen Slot: ${a.chosenSlot}`),a.estimatedRevenue&&b.push(`Estimated Revenue: $${a.estimatedRevenue}`),b.push(""),b.push("IMPORTANT: Before asking the customer for ANY information (name, phone, email, service type, vehicle, ZIP, etc.),"),b.push("FIRST check if it is already listed above. If it is present and looks valid, DO NOT ask for it again."),b.push("Only ask for information that is truly missing or incomplete."),b.push(""),b.push("STATE HINTS FOR YOU (the AI):"),b.push('- If you have proposed exact time options and the customer clearly picks one (e.g., "2pm works", "tomorrow at 3"),'),b.push('  treat that as a booking confirmation and set status = "BOOKED" in updatedLeadFields.'),b.push("- Always calculate estimatedRevenue as the midpoint of the price range from kb.yaml when booking."),b.push('- Set status = "QUALIFIED" once you have service type, vehicle type, and valid ZIP code.'),b.push("==================================================="),b.push(""),b.join("\n")}(a);for(let d=0;d<a.messages.length;d++){let e=a.messages[d],f=d===a.messages.length-1;"user"===e.from&&f?b.push({role:"user",content:`${c}

Customer says: ${e.body}`}):b.push({role:"user"===e.from?"user":"assistant",content:e.body})}return b.length>0&&"assistant"===b[b.length-1].role&&b.push({role:"user",content:`${c}

(Continue the conversation)`}),0===b.length&&b.push({role:"user",content:`${c}

New lead just came in from the web form. Greet them warmly and start the qualification process based on what we already know.`}),b}(a);try{let b=await c.messages.create({model:"claude-sonnet-4-5-20250929",max_tokens:1024,system:`${i}

## Knowledge Base
\`\`\`yaml
${h}
\`\`\``,messages:j,temperature:.7});var k="text"===b.content[0].type?b.content[0].text:"",l=a;try{let a=k.match(/```(?:json)?\s*([\s\S]*?)\s*```/),b=a?a[1]:k,c=JSON.parse(b.trim());if(!c.reply||"string"!=typeof c.reply)throw Error('Missing or invalid "reply" field');if(!c.action||"string"!=typeof c.action)throw Error('Missing or invalid "action" field');if(!["send_message","offer_slots","create_booking","flag_for_review"].includes(c.action))throw Error(`Invalid action type: ${c.action}`);if(!c.updatedLeadFields||0===Object.keys(c.updatedLeadFields).length){let a=function(a,b){let c=b.toLowerCase(),d={};if(c.includes("outside our main service area")||c.includes("outside our service area")||c.includes("outside your main service area")||c.includes("outside your service area")||c.includes("we don't usually go that far")||c.includes("check with our team")||c.includes("check with my manager")||c.includes("check with the team")||c.includes("check with the manager"))return d.status="ESCALATE",d;(c.includes("you're all set")||c.includes("you are all set")||c.includes("perfect! you're")||c.includes("confirmed")&&(c.includes("appointment")||c.includes("booking")))&&(d.status="BOOKED");let e=((a.jobDetails||"")+" "+c).toLowerCase();if(e.includes("full")&&e.includes("detail")?(d.serviceRequested="Full Detail",e.includes("suv")||e.includes("truck")||e.includes("van")?d.estimatedRevenue=165:d.estimatedRevenue=150):e.includes("interior")&&e.includes("detail")?(d.serviceRequested="Interior Detail",d.estimatedRevenue=130):e.includes("exterior")&&(e.includes("detail")||e.includes("wash"))&&(d.serviceRequested="Exterior Wash",d.estimatedRevenue=55),"BOOKED"===d.status){let a=c.match(/(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|[a-z]+\s+\d{1,2})\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);if(a&&!d.chosenSlot){let b=a[1].charAt(0).toUpperCase()+a[1].slice(1),c=a[2];d.chosenSlot=`${b} at ${c}`}}return 0===Object.keys(d).length?null:d}(l,c.reply);a&&(console.log("[Conductor] Inferred updatedLeadFields from reply text:",a),c.updatedLeadFields={...c.updatedLeadFields??{},...a})}return c}catch(a){return console.error("Failed to parse ActionContract:",a),console.error("Response text:",k),{reply:k||"I'm processing your request. One moment please.",action:"send_message"}}}catch(a){return console.error("Error calling Claude API:",a),{reply:"I'm having trouble processing your request right now. Let me have someone from our team reach out to you shortly.",action:"flag_for_review",parameters:{reason:`AI error: ${a instanceof Error?a.message:"Unknown error"}`}}}}async function h(a){let b=process.env.ANTHROPIC_API_KEY;if(!b)throw Error("ANTHROPIC_API_KEY environment variable is not set");let c=new d.Ay({apiKey:b}),e=(a.jobDetails||"").trim(),f=(a.name||"").trim(),g=`
New lead details from the form:
- Name: ${f||"Unknown"}
- Job details: ${e||"Not specified"}
- Channel: ${a.channel||"web"}

Write the first message you would send to this customer, following the system instructions.
`.trim();try{let a=await c.messages.create({model:"claude-sonnet-4-5-20250929",max_tokens:256,system:`
You are the AI front desk for Houston's Finest Mobile Detailing.

A new customer just submitted the website form. You can see their name and what they say they need done.

Your job is to send the very FIRST message in the conversation. Goals:

- Be friendly, concise, and confident.
- DO NOT just repeat back what they said verbatim (e.g., "I see you're interested in: [exact form text]").
- Instead, naturally acknowledge their request and IMMEDIATELY ask the most important missing piece of information to move forward.
- Do NOT ask for their name or phone (we already have those).
- Identify what's missing: Is it the specific service? Vehicle size? ZIP code? Preferred time/day? Ask for that ONE thing directly.
- Keep it to 2 short sentences: (1) brief greeting that shows you understood, (2) your ONE specific question.

Example good responses:
- "Hi Sarah! I'd love to help with your SUV detail. What area of Houston are you in?"
- "Hey Mike! Full detail sounds great. When works best for you this week?"
- "Hi there! I can definitely help with that. Is this for a sedan, SUV, or truck?"

Return ONLY the message text. No JSON, no markdown.
`.trim(),messages:[{role:"user",content:g}],temperature:.8}),b="text"===a.content[0].type?a.content[0].text.trim():"";if(!b)throw Error("Claude returned empty response for welcome message");return b}catch(a){throw console.error("[Welcome] Error calling Claude API:",a),a}}async function i(a){let b=process.env.ANTHROPIC_API_KEY;if(!b)throw Error("ANTHROPIC_API_KEY environment variable is not set");let c=new d.Ay({apiKey:b}),e=a.recentLeads.map(a=>{let b=a.estimatedRevenue>0?`$${a.estimatedRevenue}`:"TBD";return`- ${a.name} (${a.status}, ${b}, via ${a.channel}): "${a.lastMessageSnippet}"`}).join("\n"),f=`
Generate a daily summary for ${a.dateRangeLabel}.

## Metrics:
- Total leads: ${a.totalCount}
- Estimated revenue: $${a.totalEstimatedRevenue}
- Status breakdown:
  - NEW: ${a.byStatus.NEW}
  - QUALIFIED: ${a.byStatus.QUALIFIED}
  - BOOKED: ${a.byStatus.BOOKED}
  - ESCALATE: ${a.byStatus.ESCALATE}

## Recent leads:
${e||"(No leads yet)"}

Write a concise daily summary following the system instructions.
`.trim();try{let a=await c.messages.create({model:"claude-sonnet-4-5-20250929",max_tokens:512,system:`
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
`.trim(),messages:[{role:"user",content:f}],temperature:.7}),b="text"===a.content[0].type?a.content[0].text.trim():"";if(!b)throw Error("Claude returned empty response for owner summary");return b}catch(a){throw console.error("[Owner Summary] Error calling Claude API:",a),a}}async function j(a){let b=process.env.ANTHROPIC_API_KEY;if(!b)throw Error("ANTHROPIC_API_KEY environment variable is not set");let c=new d.Ay({apiKey:b}),e=(a.name||"there").split(" ")[0],f=a.serviceRequested||a.jobDetails||"car detailing",g=a.location||"your area",h=(a.messages||[]).slice(-8),i=h.length>0?h.map(a=>{let b="user"===a.from?"customer":"ai";return`${b}: ${a.body}`}).join("\n"):"(No conversation yet)",j=`
Business: Houston's Finest Mobile Detailing
Lead info:
- Customer name: ${a.name||"Unknown"}
- Phone: ${a.phone||"Not provided"}
- Service requested: ${f}
- Location: ${g}
- Status: ${a.status}

Recent conversation:
${i}

Write a follow-up message the owner can send to this customer.
`.trim();try{let a=await c.messages.create({model:"claude-sonnet-4-5-20250929",max_tokens:256,system:`
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
`.trim(),messages:[{role:"user",content:j}],temperature:.7}),b="text"===a.content[0].type?a.content[0].text.trim():"";if(!b)throw Error("Claude returned empty response for owner assist");return b}catch(a){return console.error("[OwnerAssist] Claude error:",a),`Hi ${e}, this is the owner from Houston's Finest Mobile Detailing. I saw your conversation with our assistant and wanted to personally follow up. When is a good time to call you today?`}}},8335:()=>{}};