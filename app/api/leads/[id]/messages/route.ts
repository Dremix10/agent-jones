import { NextRequest, NextResponse } from "next/server";
import { addMessageToLead, getLead, updateLeadFields } from "@/lib/leads";
import { callClaudeForLead } from "@/lib/conductor";
import type { Lead } from "@/lib/types";
import { createICS } from "@/lib/integrations/ics";
import { sendOwnerSummary, sendCustomerConfirm } from "@/lib/integrations/email";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userMessage: string = body.message ?? "";

    const lead = getLead(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updatedLead = addMessageToLead(id, {
      from: "user",
      body: userMessage,
    });

    if (!updatedLead) {
      return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
    }

    const action = await callClaudeForLead(updatedLead);

    // Debug log to see what Claude actually returns
    console.log("[AI ActionContract]", JSON.stringify(action, null, 2));

    // Merge any updated lead fields from the AI response before adding the AI reply
    let leadForAiReply = updatedLead;
    if (action && action.updatedLeadFields) {
      const merged = updateLeadFields(id, action.updatedLeadFields);
      if (merged) {
        leadForAiReply = merged;
      }
    }

    // Add AI reply message to the (potentially updated) lead
    const finalLead = addMessageToLead(id, {
      from: "ai",
      body: action.reply,
    });

    // If booking was confirmed, send email confirmations
    if (finalLead?.status === "BOOKED" && action.action === "create_booking") {
      try {
        await sendBookingConfirmations(finalLead);
      } catch (emailError) {
        console.error("[Messages API] Failed to send booking emails:", emailError);
        // Don't fail the request if email fails - booking is still confirmed
      }
    }

    return NextResponse.json({
      lead: finalLead,
      action,
    });
  } catch (error) {
    console.error("[Messages API] Error processing message:", error);
    console.error("[Messages API] Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Send booking confirmation emails when a lead becomes BOOKED.
 */
async function sendBookingConfirmations(lead: Lead): Promise<void> {
  if (lead.status !== "BOOKED") {
    return;
  }

  // Extract booking details
  const service = lead.serviceRequested || "Car Detailing Service";
  const chosenSlot = lead.chosenSlot || "TBD";
  const location = lead.location || "Customer location";
  const price = lead.estimatedRevenue ? `$${lead.estimatedRevenue}` : undefined;

  // Parse the chosen slot to create ICS times
  // For now, use a simple heuristic: if we have a slot, create an event 2 hours from now
  // In production, parse chosenSlot properly or use structured slot data
  const now = new Date();
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  startTime.setHours(14, 0, 0, 0); // 2pm default
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  // Generate ICS content
  const icsContent = createICS({
    title: `${service} - ${lead.name || lead.phone}`,
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    location,
    description: `Service: ${service}\nCustomer: ${lead.name || lead.phone}\nPhone: ${lead.phone}\n${lead.email ? `Email: ${lead.email}\n` : ''}${lead.jobDetails ? `Details: ${lead.jobDetails}` : ''}`,
    attendees: [
      ...(lead.email ? [{ name: lead.name, email: lead.email }] : []),
    ],
  });

  // Build booking details for email
  const booking = {
    date: startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    location,
    service,
    price,
    duration: '2 hours',
  };

  // Get conversation transcript
  const transcript = lead.messages
    .map((m) => `${m.from === 'user' ? 'Customer' : 'AI'}: ${m.body}`)
    .join('\n\n');

  // Send emails
  await Promise.all([
    sendOwnerSummary({ lead, booking, transcript, icsContent }),
    sendCustomerConfirm({ lead, booking, icsContent }),
  ]);

  console.log(`[BOOKING] Confirmation emails sent for lead ${lead.id}`);
}
