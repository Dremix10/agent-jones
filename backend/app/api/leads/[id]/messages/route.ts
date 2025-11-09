import { NextRequest, NextResponse } from "next/server";
import { addMessageToLead, getLead } from "@/lib/leads";
import { callClaudeForLead } from "@/lib/claudefrontdesk";

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = params;
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

  const action = await callClaudeForLead(updatedLead, userMessage);

  const finalLead = addMessageToLead(id, {
    from: "ai",
    body: action.reply,
  });

  return NextResponse.json({
    lead: finalLead,
    action,
  });
}
