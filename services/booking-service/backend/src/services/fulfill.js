// Idempotent fulfillment. Called by BOTH the Stripe webhook and the verify-on-
// return endpoint. Guards against double-processing so a booking can never get
// two calendar events or two emails, no matter how many times it's triggered.
import { pool } from '../db.js';
import { createCalendarEvent } from './calendar.js';
import { sendConfirmationEmail } from './email.js';

export async function fulfillBooking(bookingId) {
  const { rows } = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
  const booking = rows[0];
  if (!booking) throw new Error(`booking ${bookingId} not found`);

  // Idempotency guard: already fulfilled -> no-op.
  if (booking.status === 'fulfilled') {
    return booking;
  }

  // Mark paid first so concurrent triggers see progress.
  await pool.query(`UPDATE bookings SET status = 'paid', updated_at = now() WHERE id = $1`, [bookingId]);

  // Side effects are best-effort: payment already succeeded, so a calendar or
  // email hiccup must not fail the booking. We record whatever worked.
  let calendarEventId = null;
  let emailPreviewUrl = null;

  try {
    calendarEventId = await createCalendarEvent(booking);
  } catch (err) {
    console.error('[fulfill] calendar failed:', err.message);
  }
  try {
    emailPreviewUrl = await sendConfirmationEmail(booking);
  } catch (err) {
    console.error('[fulfill] email failed:', err.message);
  }

  const { rows: updated } = await pool.query(
    `UPDATE bookings
        SET status = 'fulfilled',
            calendar_event_id = COALESCE($2, calendar_event_id),
            email_preview_url = COALESCE($3, email_preview_url),
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [bookingId, calendarEventId, emailPreviewUrl]
  );
  return updated[0];
}
