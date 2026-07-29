'use client';

// Post-payment page. Reads the booking id from the URL, calls the idempotent
// verify endpoint (which confirms payment with Stripe before fulfilling), and
// shows the confirmed details. useSearchParams requires a Suspense boundary.
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyBooking } from '../../lib/api';

function Confirmation() {
  const params = useSearchParams();
  const bookingId = params.get('booking');
  const [state, setState] = useState('verifying'); // verifying | done | error
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!bookingId) { setState('error'); return; }
    (async () => {
      try {
        // Small retry loop: the webhook may fulfil first, or verify does it.
        let b = await verifyBooking(bookingId);
        for (let i = 0; i < 3 && b.status !== 'fulfilled'; i++) {
          await new Promise((r) => setTimeout(r, 1200));
          b = await verifyBooking(bookingId);
        }
        setBooking(b);
        setState('done');
      } catch {
        setState('error');
      }
    })();
  }, [bookingId]);

  if (state === 'verifying') {
    return <div className="card center"><p><span className="spinner" />Confirming your payment…</p></div>;
  }
  if (state === 'error' || !booking) {
    return <div className="card center"><p className="muted">We couldn’t find this booking. <a href="/">Start over</a></p></div>;
  }

  const paid = booking.status === 'paid' || booking.status === 'fulfilled';
  return (
    <div className="card">
      <div className="center" style={{ marginBottom: 18 }}>
        <span className="badge">{paid ? '✓ Payment confirmed' : 'Pending'}</span>
      </div>
      <div className="detail"><span className="k">Name</span><span>{booking.name}</span></div>
      <div className="detail"><span className="k">Email</span><span>{booking.email}</span></div>
      <div className="detail"><span className="k">When</span><span>{new Date(booking.slot_start).toLocaleString()}</span></div>
      {booking.agenda && <div className="detail"><span className="k">Agenda</span><span style={{ maxWidth: 280, textAlign: 'right' }}>{booking.agenda}</span></div>}
      <div className="detail"><span className="k">Calendar event</span><span>{booking.calendar_event_id ? 'Created ✓' : 'Not configured'}</span></div>
      <div className="detail"><span className="k">Confirmation email</span><span>{booking.email_preview_url ? 'Sent ✓' : 'Sent'}</span></div>

      {booking.email_preview_url && (
        <div className="center">
          <a className="link-btn" href={booking.email_preview_url} target="_blank" rel="noreferrer">View the confirmation email →</a>
        </div>
      )}
      <p className="note">
        Fulfilment (calendar invite + email) runs on Stripe’s webhook after payment,
        with an idempotent verify-on-return as a safety net — so this page is accurate
        even if the webhook hasn’t landed yet. The email link above is an Ethereal
        test-inbox preview.
      </p>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="wrap">
      <div className="eyebrow">Venture Builders · Task 1</div>
      <h1 className="page">Booking Confirmation</h1>
      <p className="sub">Thanks for your booking.</p>
      <Suspense fallback={<div className="card center"><p><span className="spinner" />Loading…</p></div>}>
        <Confirmation />
      </Suspense>
    </div>
  );
}
