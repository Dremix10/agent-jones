// Mock API for demo purposes

export type ApiReply = {
  reply: string;
  action: "ask" | "offer_slots" | "confirm_booking" | "escalate" | "none";
  slotOptions?: { start: string; end: string }[];
  booking?: { title: string; start: string; end: string; icsUrl?: string };
  lead?: { status: "NEW" | "QUALIFIED" | "BOOKED" | "ESCALATE"; estimatedRevenue?: number };
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  zip: string;
  service: string;
  vehicleType: string;
  timeWindow: string;
  status: "NEW" | "QUALIFIED" | "BOOKED" | "ESCALATE";
  estimatedRevenue: number;
  createdAt: string;
  bookingStart?: string;
  bookingEnd?: string;
};

// Track message count per lead for simulation
const leadMessageCounts = new Map<string, number>();

export async function createLead(body: {
  name: string;
  phone: string;
  zip: string;
  service: string;
  vehicleType: string;
  timeWindow: string;
  firstMessage: string;
}): Promise<{ id: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  leadMessageCounts.set(id, 0);

  return { id };
}

export async function sendMessage(
  id: string,
  { text }: { text: string }
): Promise<ApiReply> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const messageCount = (leadMessageCounts.get(id) || 0) + 1;
  leadMessageCounts.set(id, messageCount);

  // Flow: 1st = ask, 2nd = offer_slots, 3rd = confirm_booking

  if (messageCount === 1) {
    // First interaction - ask for confirmation
    return {
      reply: "Thanks for reaching out! Just to confirm, can you verify your ZIP code and preferred time window?",
      action: "ask",
      lead: {
        status: "NEW",
        estimatedRevenue: 0
      }
    };
  }

  if (messageCount === 2) {
    // Second interaction - offer slots
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const slot1Start = new Date(tomorrow);
    slot1Start.setHours(9, 0, 0, 0);
    const slot1End = new Date(slot1Start);
    slot1End.setHours(11, 30, 0, 0);

    const slot2Start = new Date(tomorrow);
    slot2Start.setHours(13, 0, 0, 0);
    const slot2End = new Date(slot2Start);
    slot2End.setHours(15, 30, 0, 0);

    return {
      reply: "Perfect! I have two available time slots for you. Which one works better?",
      action: "offer_slots",
      slotOptions: [
        {
          start: slot1Start.toISOString(),
          end: slot1End.toISOString()
        },
        {
          start: slot2Start.toISOString(),
          end: slot2End.toISOString()
        }
      ],
      lead: {
        status: "QUALIFIED",
        estimatedRevenue: 150
      }
    };
  }

  if (messageCount === 3) {
    // Third interaction - confirm booking
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const bookingStart = new Date(tomorrow);
    bookingStart.setHours(9, 0, 0, 0);
    const bookingEnd = new Date(bookingStart);
    bookingEnd.setHours(11, 30, 0, 0);

    return {
      reply: "Excellent! Your appointment is confirmed. I've created a calendar event for you. See you then!",
      action: "confirm_booking",
      booking: {
        title: "Car Wash Appointment",
        start: bookingStart.toISOString(),
        end: bookingEnd.toISOString(),
        icsUrl: "/event.ics"
      },
      lead: {
        status: "BOOKED",
        estimatedRevenue: 150
      }
    };
  }

  // Default response for additional messages
  return {
    reply: "Thanks! Is there anything else I can help you with?",
    action: "none",
    lead: {
      status: "BOOKED",
      estimatedRevenue: 150
    }
  };
}

export function downloadIcs(booking: { title: string; start: string; end: string }): Blob {
  const startDate = new Date(booking.start);
  const endDate = new Date(booking.end);

  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Agent Jones//Car Wash Booking//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${formatIcsDate(startDate)}
DTEND:${formatIcsDate(endDate)}
DTSTAMP:${formatIcsDate(new Date())}
UID:${Date.now()}@agentjones.demo
SUMMARY:${booking.title}
DESCRIPTION:Your car wash appointment
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  return new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
}

// Mock leads storage
const mockLeads: Lead[] = [];

// Initialize with seed data
function initializeMockLeads() {
  if (mockLeads.length === 0) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const bookingStart = new Date(tomorrow);
    bookingStart.setHours(9, 0, 0, 0);
    const bookingEnd = new Date(bookingStart);
    bookingEnd.setHours(11, 30, 0, 0);

    mockLeads.push({
      id: 'lead_001',
      name: 'Sarah Johnson',
      phone: '713-555-0199',
      zip: '77005',
      service: 'Full detail',
      vehicleType: 'Tesla Model 3',
      timeWindow: 'Friday morning',
      status: 'BOOKED',
      estimatedRevenue: 250,
      createdAt: twoDaysAgo.toISOString(),
      bookingStart: bookingStart.toISOString(),
      bookingEnd: bookingEnd.toISOString()
    });

    mockLeads.push({
      id: 'lead_002',
      name: 'Mike Chen',
      phone: '832-555-0145',
      zip: '77019',
      service: 'Exterior wash',
      vehicleType: 'Honda Civic',
      timeWindow: 'this weekend',
      status: 'NEW',
      estimatedRevenue: 0,
      createdAt: yesterday.toISOString()
    });

    mockLeads.push({
      id: 'lead_003',
      name: 'Jessica Martinez',
      phone: '346-555-0188',
      zip: '77006',
      service: 'Full detail',
      vehicleType: 'SUV',
      timeWindow: 'next Tuesday',
      status: 'QUALIFIED',
      estimatedRevenue: 200,
      createdAt: now.toISOString()
    });
  }
}

export async function getLeads(): Promise<Lead[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));

  initializeMockLeads();

  // Return newest first
  return [...mockLeads].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getDailySummary(): Promise<{ text: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  initializeMockLeads();

  const booked = mockLeads.filter(l => l.status === 'BOOKED').length;
  const qualified = mockLeads.filter(l => l.status === 'QUALIFIED').length;
  const revenue = mockLeads
    .filter(l => l.status === 'BOOKED')
    .reduce((sum, l) => sum + l.estimatedRevenue, 0);

  const text = `Good morning! Here's your daily snapshot: You have ${booked} confirmed booking${booked !== 1 ? 's' : ''} generating $${revenue} in revenue, plus ${qualified} qualified lead${qualified !== 1 ? 's' : ''} in the pipeline. Your AI agent handled all initial conversations autonomously, saving you hours of back-and-forth. Today's focus: follow up with qualified leads to convert them into bookings. The system is running smoothly with no escalations needed.`;

  return { text };
}
