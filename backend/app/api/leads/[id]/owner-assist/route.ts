import { NextRequest, NextResponse } from "next/server";
import { getLead } from "@/lib/leads";
import { generateOwnerFollowupForEscalatedLead } from "@/lib/conductor";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/leads/[id]/owner-assist
 * 
 * Generates an AI-written follow-up suggestion for the owner to use
 * with an escalated lead. Helps the owner handle tough situations with
 * a personalized, empathetic message they can send via SMS or phone.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Load the lead
    const lead = getLead(id);
    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    console.log(`[OwnerAssist] Generating follow-up suggestion for lead ${id} (status: ${lead.status})`);

    // Generate the follow-up suggestion using Claude
    const suggestion = await generateOwnerFollowupForEscalatedLead(lead);

    return NextResponse.json({
      leadId: lead.id,
      suggestion,
    });
  } catch (error) {
    console.error("[OwnerAssist] Error generating follow-up suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate follow-up suggestion" },
      { status: 500 }
    );
  }
}
