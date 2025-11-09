import { NextRequest, NextResponse } from "next/server";
import { getLead, addMessageToLead } from "@/lib/leads";
import { generateWelcomeMessageForLead } from "@/lib/conductor";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Load the lead
    const lead = getLead(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Idempotency: if there's already an AI message, return it
    const existingAiMessage = lead.messages.find((m) => m.from === "ai");
    if (existingAiMessage) {
      return NextResponse.json({
        message: existingAiMessage,
        leadId: lead.id,
      });
    }

    // Generate welcome message with Claude
    let welcomeText: string;
    try {
      welcomeText = await generateWelcomeMessageForLead(lead);
    } catch (error) {
      // Fallback to static greeting if Claude fails
      console.error("[Welcome] Failed to generate welcome message, using fallback", error);
      
      const jobDetails = (lead.jobDetails || "").trim();
      welcomeText = jobDetails
        ? `Hi! I'm your AI front desk for Houston's Finest Mobile Detailing. I see you're interested in: "${jobDetails}". I can confirm pricing, check availability, and help you lock in a booking so you don't have to repeat all that.`
        : `Hi! I'm your AI front desk for Houston's Finest Mobile Detailing. You can ask about pricing, availability this week, or help booking a full detail.`;
    }

    // Save the welcome message to the lead
    const updatedLead = addMessageToLead(id, {
      from: "ai",
      body: welcomeText,
    });

    if (!updatedLead) {
      return NextResponse.json(
        { error: "Failed to save welcome message" },
        { status: 500 }
      );
    }

    // Return the newly created message
    const welcomeMessage = updatedLead.messages[updatedLead.messages.length - 1];
    
    return NextResponse.json({
      message: welcomeMessage,
      leadId: lead.id,
    });
  } catch (error) {
    console.error("[Welcome] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
