import { NextResponse } from "next/server";
import { listLeads } from "@/lib/leads";
import type { Lead } from "@/lib/types";

/**
 * GET /api/leads/summary
 * Returns aggregate metrics about all leads in the system
 */
export async function GET() {
  const leads = listLeads() as Lead[];

  const totalCount = leads.length;

  // Sum numeric estimatedRevenue if present
  const totalEstimatedRevenue = leads.reduce((sum, lead) => {
    const value = (lead as any).estimatedRevenue;
    if (typeof value === "number" && !Number.isNaN(value)) {
      return sum + value;
    }
    return sum;
  }, 0);

  // Count leads by status
  const byStatus: Record<string, number> = {
    NEW: 0,
    QUALIFIED: 0,
    BOOKED: 0,
    ESCALATE: 0,
  };

  for (const lead of leads) {
    if (lead.status && byStatus[lead.status] !== undefined) {
      byStatus[lead.status] += 1;
    }
  }

  // Get 5 most recent leads sorted by createdAt desc
  const recentLeads = [...leads]
    .sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);

  return NextResponse.json({
    totalCount,
    totalEstimatedRevenue,
    byStatus,
    recentLeads,
  });
}
