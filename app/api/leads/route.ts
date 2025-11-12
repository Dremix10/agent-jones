import { NextRequest, NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/leads";

export async function GET() {
  const leads = listLeads();
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const lead = createLead({
    name: body.name ?? "Unknown",
    phone: body.phone ?? "",
    email: body.email,
    channel: body.channel ?? "web",
    serviceRequested: body.serviceRequested,
    jobDetails: body.jobDetails,
    location: body.location,
    preferredTimeWindow: body.preferredTimeWindow,
  });

  return NextResponse.json({ lead }, { status: 201 });
}
