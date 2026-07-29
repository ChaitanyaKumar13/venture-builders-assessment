import { Router } from 'express';
import { pool } from '../db.js';
import { createCheckoutSession, stripe } from '../services/stripe.js';
import { fulfillBooking } from '../services/fulfill.js';

const router = Router();

// Create a pending booking + a Stripe Checkout Session; return the checkout URL.
router.post('/checkout', async (req, res, next) => {
  try {
    const { name, email, phone, agenda, slotStart } = req.body || {};
    if (!name || !email || !slotStart) {
      return res.status(400).json({ error: 'name, email and slotStart are required' });
    }
    const start = new Date(slotStart);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30-min session

    const { rows } = await pool.query(
      `INSERT INTO bookings (name, email, phone, agenda, slot_start, slot_end)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, email, phone || null, agenda || null, start.toISOString(), end.toISOString()]
    );
    const booking = rows[0];

    const session = await createCheckoutSession(booking);
    await pool.query(`UPDATE bookings SET stripe_session_id = $1 WHERE id = $2`, [session.id, booking.id]);

    res.status(201).json({ bookingId: booking.id, checkoutUrl: session.url });
  } catch (err) {
    next(err);
  }
});

// Safety-net fulfillment on return from Stripe (idempotent). Confirms the session
// is actually paid with Stripe before fulfilling — never trusts the redirect alone.
router.post('/:id/verify', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    const booking = rows[0];
    if (!booking) return res.status(404).json({ error: 'booking not found' });

    if (booking.status !== 'fulfilled' && booking.stripe_session_id) {
      const session = await stripe().checkout.sessions.retrieve(booking.stripe_session_id);
      if (session.payment_status === 'paid') {
        await fulfillBooking(booking.id);
      }
    }
    const { rows: fresh } = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    res.json(fresh[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'booking not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
