/**
 * ICS (iCalendar) generation for booking confirmations.
 * Generates .ics files that work with all major calendar apps.
 */

interface ICSAttendee {
  name?: string;
  email: string;
}

interface ICSEvent {
  title: string;
  start: string; // ISO 8601 datetime (e.g., "2025-11-15T10:00:00-06:00")
  end: string; // ISO 8601 datetime
  location?: string;
  description?: string;
  attendees?: ICSAttendee[];
}

/**
 * Create an iCalendar (.ics) file content string.
 * Uses absolute ISO times with timezone offsets.
 */
export function createICS(event: ICSEvent): string {
  const uid = generateUID();
  const dtstamp = formatICSDate(new Date());
  const dtstart = formatICSDate(new Date(event.start));
  const dtend = formatICSDate(new Date(event.end));

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agent Jones//Car Detailing Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICSText(event.title)}`,
  ];

  if (event.location) {
    ics.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  if (event.description) {
    ics.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }

  // Add attendees
  if (event.attendees && event.attendees.length > 0) {
    for (const attendee of event.attendees) {
      const name = attendee.name ? `CN=${escapeICSText(attendee.name)}:` : '';
      ics.push(`ATTENDEE;${name}MAILTO:${attendee.email}`);
    }
  }

  // Status and sequence
  ics.push('STATUS:CONFIRMED');
  ics.push('SEQUENCE:0');
  ics.push('END:VEVENT');
  ics.push('END:VCALENDAR');

  return ics.join('\r\n');
}

/**
 * Format a Date object to ICS datetime format with UTC timezone.
 * Format: YYYYMMDDTHHmmssZ
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a unique identifier for the calendar event.
 */
function generateUID(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}@agent-jones.com`;
}

/**
 * Escape special characters in ICS text fields.
 * Per RFC 5545: escape comma, semicolon, backslash, newline.
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}
