import Anthropic from '@anthropic-ai/sdk';
import { ActionContract, Lead } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Conductor Function: Analyzes chat history and returns an ActionContract
 *
 * This function sends the lead's chat history to Claude AI, which analyzes
 * the conversation and decides what action to take next.
 *
 * @param lead - The lead object containing chat history and details
 * @returns ActionContract - The structured action for the Tool Maker backend
 */
export async function callClaudeForLead(lead: Lead): Promise<ActionContract> {
  // Initialize Anthropic client
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });

  // Read system prompt and knowledge base
  const systemPrompt = loadSystemPrompt();
  const knowledgeBase = loadKnowledgeBase();

  // Format the conversation history for Claude
  const messages = formatMessages(lead);

  try {
    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: `${systemPrompt}\n\n## Knowledge Base\n\`\`\`yaml\n${knowledgeBase}\n\`\`\``,
      messages,
      temperature: 0.7,
    });

    // Extract the response text
    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse the JSON response into ActionContract
    const actionContract = parseActionContract(responseText);

    return actionContract;
  } catch (error) {
    console.error('Error calling Claude API:', error);

    // Return a fallback response
    return {
      reply: "I'm having trouble processing your request right now. Let me have someone from our team reach out to you shortly.",
      action: 'flag_for_review',
      parameters: {
        reason: `AI error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    };
  }
}

/**
 * Load the system prompt from config/prompt.md
 */
function loadSystemPrompt(): string {
  const promptPath = path.join(process.cwd(), 'config', 'prompt.md');
  return fs.readFileSync(promptPath, 'utf-8');
}

/**
 * Load the knowledge base from config/kb.yaml
 */
function loadKnowledgeBase(): string {
  const kbPath = path.join(process.cwd(), 'config', 'kb.yaml');
  return fs.readFileSync(kbPath, 'utf-8');
}

/**
 * Format lead messages into Claude's message format
 */
function formatMessages(lead: Lead): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history
  for (const msg of lead.messages) {
    messages.push({
      role: msg.from === 'user' ? 'user' : 'assistant',
      content: msg.body,
    });
  }

  // If the last message is from the AI, we need to add a user continuation prompt
  // This shouldn't normally happen, but let's handle it
  if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
    messages.push({
      role: 'user',
      content: '(Continue the conversation)',
    });
  }

  // If there are no messages yet, start with a greeting prompt
  if (messages.length === 0) {
    messages.push({
      role: 'user',
      content: `New lead just came in. Their name is ${lead.name}${lead.phone ? ` and their phone is ${lead.phone}` : ''}. Greet them and start the qualification process.`,
    });
  }

  return messages;
}

/**
 * Parse Claude's response into an ActionContract
 * Claude should return JSON, but we'll extract it if it's wrapped in markdown
 */
function parseActionContract(responseText: string): ActionContract {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;

    // Parse the JSON
    const parsed = JSON.parse(jsonText.trim());

    // Validate required fields
    if (!parsed.reply || typeof parsed.reply !== 'string') {
      throw new Error('Missing or invalid "reply" field');
    }

    if (!parsed.action || typeof parsed.action !== 'string') {
      throw new Error('Missing or invalid "action" field');
    }

    // Validate action type
    const validActions = ['send_message', 'offer_slots', 'create_booking', 'flag_for_review'];
    if (!validActions.includes(parsed.action)) {
      throw new Error(`Invalid action type: ${parsed.action}`);
    }

    return parsed as ActionContract;
  } catch (error) {
    console.error('Failed to parse ActionContract:', error);
    console.error('Response text:', responseText);

    // Return a safe fallback
    return {
      reply: responseText || "I'm processing your request. One moment please.",
      action: 'send_message',
    };
  }
}
