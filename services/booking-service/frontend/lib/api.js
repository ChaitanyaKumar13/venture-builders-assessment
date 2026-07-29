const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003';

export async function startCheckout(form) {
  const r = await fetch(`${API}/api/bookings/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'Could not start checkout');
  return r.json();
}

export async function verifyBooking(id) {
  const r = await fetch(`${API}/api/bookings/${id}/verify`, { method: 'POST' });
  if (!r.ok) throw new Error('Could not verify booking');
  return r.json();
}
