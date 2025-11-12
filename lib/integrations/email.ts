/**
 * Email integration with Resend/SMTP fallback.
 * Sends booking confirmations with ICS attachments.
 */

import type { Lead } from '@/lib/types';

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

interface BookingDetails {
  date: string;
  time: string;
  location: string;
  service: string;
  price?: string;
  duration?: string;
}

/**
 * Send email using Resend or SMTP fallback.
 */
async function sendEmail(params: SendEmailParams): Promise<void> {
  const from = process.env.EMAIL_FROM || 'bookings@agent-jones.com';
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    // Use Resend API
    await sendViaResend({ ...params, from }, resendKey);
  } else {
    // Fallback to SMTP
    await sendViaSMTP({ ...params, from });
  }
}

/**
 * Send email via Resend API.
 */
async function sendViaResend(
  params: SendEmailParams & { from: string },
  apiKey: string
): Promise<void> {
  const attachments = params.attachments?.map((att) => ({
    filename: att.filename,
    content: typeof att.content === 'string' 
      ? Buffer.from(att.content).toString('base64')
      : att.content.toString('base64'),
  }));

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${error}`);
  }
}

/**
 * Send email via SMTP (nodemailer-style, but using native fetch/other).
 * For production, you'd use nodemailer. For now, log and simulate.
 */
async function sendViaSMTP(
  params: SendEmailParams & { from: string }
): Promise<void> {
  // NOTE: In production, use nodemailer with SMTP_* env vars.
  // For this pilot, we'll just log (requires nodemailer dependency).
  
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('[EMAIL] No RESEND_API_KEY or SMTP config found. Email simulation:');
    console.log('[EMAIL] To:', params.to);
    console.log('[EMAIL] Subject:', params.subject);
    console.log('[EMAIL] Body (text):', params.text.substring(0, 200));
    console.log('[EMAIL] Attachments:', params.attachments?.map(a => a.filename).join(', '));
    return;
  }

  // TODO: Implement nodemailer integration when nodemailer is added
  throw new Error('SMTP transport requires nodemailer dependency. Use RESEND_API_KEY for now.');
}

/**
 * Send booking confirmation email to the owner/operator.
 */
export async function sendOwnerSummary(args: {
  lead: Lead;
  booking: BookingDetails;
  transcript?: string;
  icsContent: string;
}): Promise<void> {
  const { lead, booking, transcript, icsContent } = args;

  // Generate Google Maps link if we have a location
  const mapsLink = booking.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`
    : null;

  const subject = `🚗 New Booking: ${lead.name || lead.phone} - ${booking.service}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .label { font-weight: 600; color: #6b7280; }
    .value { color: #111827; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .transcript { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #4b5563; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">New Booking Confirmed! 🎉</h1>
    </div>
    <div class="content">
      <h2>Customer Details</h2>
      <div class="booking-details">
        <div class="detail-row">
          <span class="label">Name:</span>
          <span class="value">${escapeHtml(lead.name || 'Not provided')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Phone:</span>
          <span class="value">${escapeHtml(lead.phone)}</span>
        </div>
        ${lead.email ? `
        <div class="detail-row">
          <span class="label">Email:</span>
          <span class="value">${escapeHtml(lead.email)}</span>
        </div>
        ` : ''}
      </div>

      <h2>Booking Details</h2>
      <div class="booking-details">
        <div class="detail-row">
          <span class="label">Service:</span>
          <span class="value">${escapeHtml(booking.service)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date:</span>
          <span class="value">${escapeHtml(booking.date)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time:</span>
          <span class="value">${escapeHtml(booking.time)}</span>
        </div>
        ${booking.duration ? `
        <div class="detail-row">
          <span class="label">Duration:</span>
          <span class="value">${escapeHtml(booking.duration)}</span>
        </div>
        ` : ''}
        ${booking.price ? `
        <div class="detail-row">
          <span class="label">Price:</span>
          <span class="value">${escapeHtml(booking.price)}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="label">Location:</span>
          <span class="value">${escapeHtml(booking.location)}</span>
        </div>
      </div>

      ${mapsLink ? `
      <a href="${mapsLink}" class="button" target="_blank">📍 View on Google Maps</a>
      ` : ''}

      ${transcript ? `
      <h3>Conversation Transcript</h3>
      <div class="transcript">${escapeHtml(transcript)}</div>
      ` : ''}

      <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        📅 Calendar invite attached. Add to your calendar to get reminders.
      </p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
New Booking Confirmed!

Customer: ${lead.name || 'Not provided'} (${lead.phone})
${lead.email ? `Email: ${lead.email}` : ''}

Service: ${booking.service}
Date: ${booking.date}
Time: ${booking.time}
${booking.duration ? `Duration: ${booking.duration}` : ''}
${booking.price ? `Price: ${booking.price}` : ''}
Location: ${booking.location}

${mapsLink ? `Google Maps: ${mapsLink}` : ''}

${transcript ? `\nConversation:\n${transcript}` : ''}

Calendar invite attached.
`;

  const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_FROM;
  if (!ownerEmail) {
    console.warn('[EMAIL] No OWNER_EMAIL configured. Skipping owner notification.');
    return;
  }

  await sendEmail({
    to: ownerEmail,
    subject,
    html,
    text,
    attachments: [
      {
        filename: 'booking.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      },
    ],
  });

  console.log(`[EMAIL] Owner summary sent to ${ownerEmail}`);
}

/**
 * Send booking confirmation email to the customer.
 */
export async function sendCustomerConfirm(args: {
  lead: Lead;
  booking: BookingDetails;
  icsContent: string;
}): Promise<void> {
  const { lead, booking, icsContent } = args;

  if (!lead.email) {
    console.log('[EMAIL] Customer has no email. Skipping customer confirmation.');
    return;
  }

  // Generate Google Maps link
  const mapsLink = booking.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`
    : null;

  const subject = `Booking Confirmed: ${booking.service} - ${booking.date}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .booking-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .detail-row { margin: 12px 0; }
    .label { font-weight: 600; color: #6b7280; display: block; margin-bottom: 4px; }
    .value { color: #111827; font-size: 16px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Booking Confirmed!</h1>
      <p style="margin: 10px 0 0 0;">We're looking forward to serving you</p>
    </div>
    <div class="content">
      <div class="booking-card">
        <h2 style="margin-top: 0; color: #10b981;">Your Booking Details</h2>
        
        <div class="detail-row">
          <span class="label">Service</span>
          <span class="value">${escapeHtml(booking.service)}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">Date</span>
          <span class="value">${escapeHtml(booking.date)}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">Time</span>
          <span class="value">${escapeHtml(booking.time)}</span>
        </div>
        
        ${booking.duration ? `
        <div class="detail-row">
          <span class="label">Duration</span>
          <span class="value">${escapeHtml(booking.duration)}</span>
        </div>
        ` : ''}
        
        ${booking.price ? `
        <div class="detail-row">
          <span class="label">Price</span>
          <span class="value">${escapeHtml(booking.price)}</span>
        </div>
        ` : ''}
        
        <div class="detail-row">
          <span class="label">Location</span>
          <span class="value">${escapeHtml(booking.location)}</span>
        </div>
      </div>

      ${mapsLink ? `
      <div style="text-align: center;">
        <a href="${mapsLink}" class="button" target="_blank">📍 View Location on Map</a>
      </div>
      ` : ''}

      <div class="footer">
        <p>📅 <strong>Calendar invite attached</strong> - Add to your calendar for reminders</p>
        <p>Questions? Reply to this email or call us.</p>
        <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
          Thank you for choosing our service!
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const text = `
Booking Confirmed!

Hello ${lead.name || 'there'},

Your booking has been confirmed. Here are the details:

Service: ${booking.service}
Date: ${booking.date}
Time: ${booking.time}
${booking.duration ? `Duration: ${booking.duration}` : ''}
${booking.price ? `Price: ${booking.price}` : ''}
Location: ${booking.location}

${mapsLink ? `View location: ${mapsLink}` : ''}

A calendar invite is attached. Add it to your calendar to get reminders.

Questions? Reply to this email or call us.

Thank you for choosing our service!
`;

  await sendEmail({
    to: lead.email,
    subject,
    html,
    text,
    attachments: [
      {
        filename: 'booking.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      },
    ],
  });

  console.log(`[EMAIL] Customer confirmation sent to ${lead.email}`);
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
