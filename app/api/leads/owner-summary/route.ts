import { NextResponse } from "next/server";
import { listLeads } from "@/lib/leads";
import { generateOwnerDailySummary, OwnerDailySummaryContext } from "@/lib/conductor";
import type { Lead } from "@/lib/types";

/**
 * GET /api/leads/owner-summary
 * Returns an AI-generated daily summary for the shop owner
 */
export async function GET() {
  try {
    const allLeads = listLeads() as Lead[];

    // Filter leads from last 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentLeads = allLeads.filter((lead) => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= twentyFourHoursAgo;
    });

    // Calculate metrics for the last 24 hours
    const totalCount = recentLeads.length;

    const totalEstimatedRevenue = recentLeads.reduce((sum, lead) => {
      const value = lead.estimatedRevenue;
      if (typeof value === "number" && !Number.isNaN(value)) {
        return sum + value;
      }
      return sum;
    }, 0);

    // Count leads by status
    const byStatus = {
      NEW: 0,
      QUALIFIED: 0,
      BOOKED: 0,
      ESCALATE: 0,
    };

    for (const lead of recentLeads) {
      if (lead.status && byStatus[lead.status] !== undefined) {
        byStatus[lead.status] += 1;
      }
    }

    // Build recent leads with message snippets
    const recentLeadsWithSnippets = recentLeads
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime; // newest first
      })
      .slice(0, 10) // Take up to 10 most recent
      .map((lead) => {
        // Get the most recent message
        const lastMessage = lead.messages.length > 0 
          ? lead.messages[lead.messages.length - 1]
          : null;

        let lastMessageSnippet = "No messages yet.";
        if (lastMessage) {
          const snippet = lastMessage.body.slice(0, 120);
          lastMessageSnippet = snippet.length < lastMessage.body.length 
            ? `${snippet}…` 
            : snippet;
        }

        return {
          id: lead.id,
          name: lead.name,
          status: lead.status,
          estimatedRevenue: lead.estimatedRevenue || 0,
          channel: lead.channel,
          createdAt: lead.createdAt,
          lastMessageSnippet,
        };
      });

    // Build context for Claude
    const ctx: OwnerDailySummaryContext = {
      dateRangeLabel: "Last 24 hours",
      totalCount,
      totalEstimatedRevenue,
      byStatus,
      recentLeads: recentLeadsWithSnippets,
    };

    // Generate the AI summary
    const summaryText = await generateOwnerDailySummary(ctx);

    return NextResponse.json({
      dateRangeLabel: ctx.dateRangeLabel,
      summary: summaryText,
    });
  } catch (error) {
    console.error("[Owner Summary] Failed to generate summary:", error);
    return NextResponse.json(
      { error: "Failed to generate owner summary" },
      { status: 500 }
    );
  }
}
