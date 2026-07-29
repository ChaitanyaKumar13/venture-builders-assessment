'use client';

// Booking form. On submit we create a pending booking + Stripe Checkout Session
// on the backend, then hand off to Stripe's hosted checkout (we never touch cards).
import { useState } from 'react';
import { startCheckout } from '../lib/api';

// Default the preferred slot to the next round hour, formatted for datetime-local.
function defaultSlot() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BookingPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', agenda: '', slot: defaultSlot() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError('');
    if (!form.name.trim() || !form.email.trim()) return setError('Name and email are required.');
    setLoading(true);
    try {
      const { checkoutUrl } = await startCheckout({
        name: form.name, email: form.email, phone: form.phone,
        agenda: form.agenda, slotStart: new Date(form.slot).toISOString(),
      });
      window.location.href = checkoutUrl; // hand off to Stripe
    } catch (e) {
      setError(e.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <div className="eyebrow">Venture Builders · Task 1</div>
      <h1 className="page">Book a Consulting Session</h1>
      <p className="sub">Pick a time and pay securely — you’ll get a calendar invite and a confirmation email once payment succeeds.</p>

      <div className="card">
        {error && <div className="err">{error}</div>}
        <label>Name *</label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Chaitanya Kumar" />
        <div className="row">
          <div><label>Email *</label><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div><label>Phone</label><input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        </div>
        <label>Preferred time</label>
        <input type="datetime-local" value={form.slot} onChange={(e) => set('slot', e.target.value)} />
        <label>Meeting agenda</label>
        <textarea value={form.agenda} onChange={(e) => set('agenda', e.target.value)} placeholder="What would you like to discuss?" />
        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? <><span className="spinner" />Redirecting to payment…</> : 'Continue to payment →'}
        </button>
        <div className="price">Secure checkout via Stripe (test mode)</div>
      </div>
    </div>
  );
}
