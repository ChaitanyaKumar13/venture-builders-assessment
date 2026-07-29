// Google Calendar event creation via a service account (JWT auth).
// Degrades gracefully: if creds are absent, returns null so the booking flow
// continues (payment + email still succeed).
import { google } from 'googleapis';

function authClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) return null;
  // Env vars store the key with escaped newlines; restore them.
  key = key.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

export async function createCalendarEvent(booking) {
  const auth = authClient();
  if (!auth) {
    console.warn('[calendar] service account not configured — skipping event creation');
    return null;
  }
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `Consulting Session — ${booking.name}`,
      description: `Agenda: ${booking.agenda || '(none provided)'}\nPhone: ${booking.phone || '-'}`,
      start: { dateTime: new Date(booking.slot_start).toISOString() },
      end: { dateTime: new Date(booking.slot_end).toISOString() },
      attendees: [{ email: booking.email }],
    },
  });
  return data.id;
}
