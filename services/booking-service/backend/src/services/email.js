// Confirmation email via Nodemailer. Default transport "ethereal" creates a free
// throwaway inbox at runtime and returns a preview URL — zero setup for reviewers.
import nodemailer from 'nodemailer';

let _transport = null;
async function getTransport() {
  if (_transport) return _transport;
  const mode = (process.env.EMAIL_TRANSPORT || 'ethereal').toLowerCase();

  if (mode === 'ethereal') {
    const testAccount = await nodemailer.createTestAccount();
    _transport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[email] using Ethereal test inbox');
  } else if (mode === 'gmail') {
    _transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  } else {
    throw new Error(`Unknown EMAIL_TRANSPORT: ${mode}`);
  }
  return _transport;
}

export async function sendConfirmationEmail(booking) {
  const transport = await getTransport();
  const when = new Date(booking.slot_start).toLocaleString();
  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || 'Consulting Booking <bookings@example.com>',
    to: booking.email,
    subject: 'Your consulting session is confirmed',
    text:
      `Hi ${booking.name},\n\nYour consulting session is confirmed for ${when}.\n` +
      `Agenda: ${booking.agenda || '(none)'}\n\nThank you!`,
    html:
      `<h2>Booking confirmed ✅</h2><p>Hi ${escapeHtml(booking.name)},</p>` +
      `<p>Your consulting session is confirmed for <strong>${escapeHtml(when)}</strong>.</p>` +
      `<p><strong>Agenda:</strong> ${escapeHtml(booking.agenda || '(none)')}</p>` +
      `<p>Thank you!</p>`,
  });
  // For Ethereal, this URL lets anyone view the sent message in a browser.
  const preview = nodemailer.getTestMessageUrl(info) || null;
  if (preview) console.log('[email] preview URL:', preview);
  return preview;
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
