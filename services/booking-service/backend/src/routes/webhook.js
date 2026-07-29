// Stripe webhook — the PRIMARY fulfillment path. Requires the raw request body
// for signature verification (mounted with express.raw in index.js).
import { Router } from 'express';
import { stripe } from '../services/stripe.js';
import { fulfillBooking } from '../services/fulfill.js';

const router = Router();

router.post('/stripe', async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event = req.body;

  // Verify the signature when a webhook secret is configured.
  if (secret) {
    const sig = req.headers['stripe-signature'];
    try {
      event = stripe().webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
      console.error('[webhook] signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // No secret set (local dev without the CLI): parse best-effort.
    try { event = JSON.parse(req.body.toString()); } catch { /* leave as-is */ }
  }

  if (event.type === 'checkout.session.completed') {
    const bookingId = event.data.object?.metadata?.bookingId;
    if (bookingId) {
      try {
        await fulfillBooking(bookingId);
        console.log('[webhook] fulfilled booking', bookingId);
      } catch (err) {
        console.error('[webhook] fulfillment error:', err.message);
        return res.status(500).json({ received: true, error: err.message });
      }
    }
  }
  res.json({ received: true });
});

export default router;
