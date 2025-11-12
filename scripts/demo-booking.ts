#!/usr/bin/env tsx
/**
 * Demo script to test booking confirmation emails with ICS attachments.
 * Simulates a BOOKED lead and sends test emails.
 * 
 * Usage:
 *   npx tsx scripts/demo-booking.ts
 * 
 * Requirements:
 *   - Set RESEND_API_KEY or SMTP_* in .env.local
 *   - Set EMAIL_FROM and OWNER_EMAIL in .env.local
 */

import { createICS } from '../lib/integrations/ics';
import { sendOwnerSummary, sendCustomerConfirm } from '../lib/integrations/email';
import type { Lead } from '../lib/types';

console.log('🚀 Demo Booking Email Test\n');
console.log('Environment:');
console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM || '(not set)'}`);
console.log(`  OWNER_EMAIL: ${process.env.OWNER_EMAIL || '(not set)'}`);
console.log(`  RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✓ Set' : '✗ Not set'}`);
console.log(`  SMTP_HOST: ${process.env.SMTP_HOST || '(not set)'}`);
console.log();

// Create a dummy booked lead
const dummyLead: Lead = {
  id: 'demo-lead-123',
  createdAt: new Date().toISOString(),
  name: 'John Doe',
  phone: '+1-555-123-4567',
  email: process.env.DEMO_CUSTOMER_EMAIL || 'customer@example.com',
  channel: 'web',
  serviceRequested: 'Full Detail',
  jobDetails: 'Honda Accord sedan, light dirt, no pet hair',
  location: '123 Main St, Houston, TX 77002',
  preferredTimeWindow: 'Tomorrow afternoon',
  chosenSlot: 'Tomorrow at 2pm',
  status: 'BOOKED',
  estimatedRevenue: 150,
  messages: [
    {
      id: 'msg-1',
      from: 'user',
      body: 'Hi, I need a full detail for my Honda Accord',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-2',
      from: 'ai',
      body: 'Great! I can help you with that. A full detail for a sedan is $120-180 and takes about 2-3 hours. When would work best for you?',
      createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-3',
      from: 'user',
      body: 'Tomorrow afternoon if possible',
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
    {
      id: 'msg-4',
      from: 'ai',
      body: "Perfect! You're all set for tomorrow at 2pm. I'll see you at 123 Main St. Total: $150. You'll receive a confirmation email shortly.",
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
  ],
  meta: {
    demo: true,
  },
};

// Create booking details
const booking = {
  date: 'Friday, November 15, 2025',
  time: '2:00 PM',
  location: dummyLead.location!,
  service: dummyLead.serviceRequested!,
  price: `$${dummyLead.estimatedRevenue}`,
  duration: '2-3 hours',
};

// Generate ICS calendar invite
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(14, 0, 0, 0); // 2:00 PM

const endTime = new Date(tomorrow);
endTime.setHours(16, 30, 0, 0); // 4:30 PM (2.5 hours later)

console.log('📅 Generating ICS calendar invite...');
const icsContent = createICS({
  title: `${booking.service} - ${dummyLead.name}`,
  start: tomorrow.toISOString(),
  end: endTime.toISOString(),
  location: booking.location,
  description: `Service: ${booking.service}\nCustomer: ${dummyLead.name}\nPhone: ${dummyLead.phone}\nEmail: ${dummyLead.email}\n\nDetails: ${dummyLead.jobDetails}`,
  attendees: [
    { name: dummyLead.name, email: dummyLead.email! },
  ],
});

console.log('✓ ICS content generated');
console.log(`  Event: ${booking.service} - ${dummyLead.name}`);
console.log(`  When: ${tomorrow.toLocaleString()}`);
console.log();

// Build conversation transcript
const transcript = dummyLead.messages
  .map((m) => `${m.from === 'user' ? 'Customer' : 'AI'}: ${m.body}`)
  .join('\n\n');

// Test email sending
async function runDemo() {
  try {
    console.log('📧 Sending owner summary email...');
    await sendOwnerSummary({
      lead: dummyLead,
      booking,
      transcript,
      icsContent,
    });
    console.log('✓ Owner summary sent (or simulated if no email config)\n');

    console.log('📧 Sending customer confirmation email...');
    await sendCustomerConfirm({
      lead: dummyLead,
      booking,
      icsContent,
    });
    console.log('✓ Customer confirmation sent (or simulated if no email config)\n');

    console.log('✅ Demo completed successfully!');
    console.log();
    console.log('Next steps:');
    console.log('  1. Check your email inbox (if RESEND_API_KEY is set)');
    console.log('  2. Verify calendar invite imports correctly');
    console.log('  3. Check Google Maps link works');
    console.log('  4. Review email formatting (HTML + text versions)');
    console.log();
    console.log('Tips:');
    console.log('  - Set DEMO_CUSTOMER_EMAIL=your@email.com to receive customer email');
    console.log('  - Check Resend dashboard for delivery status');
    console.log('  - Look for [EMAIL] logs in console');
  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.error();
    console.error('Troubleshooting:');
    console.error('  - Verify RESEND_API_KEY is correct');
    console.error('  - Check EMAIL_FROM is a verified sender');
    console.error('  - Ensure OWNER_EMAIL is set');
    console.error('  - Review error message above');
    process.exit(1);
  }
}

runDemo();
