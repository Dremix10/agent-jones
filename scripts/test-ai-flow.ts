#!/usr/bin/env node

/**
 * Smoke test for AI Front Desk API flow
 * Tests: POST /api/leads → POST /api/leads/{id}/messages
 */

const BASE_URL = "http://localhost:3000";

interface Lead {
  id: string;
  name: string;
  phone: string;
  jobDetails?: string;
  channel: string;
  status: string;
  messages: Array<{ id: string; from: string; body: string; createdAt: string }>;
}

interface CreateLeadResponse {
  lead: Lead;
}

interface MessageResponse {
  lead: Lead;
  action: {
    reply: string;
    action: string;
    [key: string]: any;
  };
}

async function testAIFlow() {
  console.log("🧪 Starting AI Front Desk Smoke Test...\n");

  try {
    // Step 1: Create a new lead
    console.log("📝 Step 1: Creating a new lead...");
    const createLeadRes = await fetch(`${BASE_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        phone: "555-1234",
        jobDetails: "Full interior + exterior detail for a Prius this weekend",
        channel: "web",
      }),
    });

    if (!createLeadRes.ok) {
      throw new Error(`Failed to create lead: ${createLeadRes.status} ${createLeadRes.statusText}`);
    }

    const createLeadData: CreateLeadResponse = await createLeadRes.json();
    console.log("\n✅ Create lead response:");
    console.log(JSON.stringify(createLeadData, null, 2));

    const leadId = createLeadData.lead.id;
    console.log(`\n📌 Lead ID: ${leadId}\n`);

    // Step 2: Send a message to trigger AI response
    console.log("💬 Step 2: Sending message to AI...");
    const messageRes = await fetch(`${BASE_URL}/api/leads/${leadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hey, how much for a full interior & exterior detail this weekend?",
      }),
    });

    if (!messageRes.ok) {
      throw new Error(`Failed to send message: ${messageRes.status} ${messageRes.statusText}`);
    }

    const messageData: MessageResponse = await messageRes.json();
    console.log("\n✅ AI message response:");
    console.log(JSON.stringify(messageData, null, 2));

    // Analyze response
    console.log("\n\n📊 Test Results:");
    console.log("─────────────────────────────────────");
    console.log(`Lead created: ✅ (ID: ${leadId})`);
    console.log(`AI response received: ✅`);
    console.log(`Action type: ${messageData.action.action}`);
    console.log(`Reply preview: "${messageData.action.reply.substring(0, 80)}..."`);

    // Check if dev fallback or real AI
    const isDevMode = messageData.action.reply.startsWith("Dev mode:");
    if (isDevMode) {
      console.log("\n⚠️  Mode: DEV FALLBACK (no ANTHROPIC_API_KEY set)");
      console.log("   Set ANTHROPIC_API_KEY in .env.local to use real Claude AI");
    } else {
      console.log("\n🤖 Mode: REAL CLAUDE AI");
      console.log("   ANTHROPIC_API_KEY is configured and working");
    }

    console.log("\n✅ All tests passed!\n");
  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testAIFlow();
