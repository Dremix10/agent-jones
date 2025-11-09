import { NextRequest, NextResponse } from "next/server";
import { addMessageToLead, getLead, updateLeadFields } from "@/lib/leads";
import { callClaudeForLead } from "@/lib/conductor";

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
    if (action && (action as any).updatedLeadFields) {
      const merged = updateLeadFields(id, (action as any).updatedLeadFields);
      if (merged) {
        leadForAiReply = merged;
      }
    }

    // Add AI reply message to the (potentially updated) lead
    const finalLead = addMessageToLead(id, {
      from: "ai",
      body: action.reply,
    });

    return NextResponse.json({
      lead: finalLead,
      action,
    });
  } catch (error) {
    console.error("[Messages API] Error processing message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

