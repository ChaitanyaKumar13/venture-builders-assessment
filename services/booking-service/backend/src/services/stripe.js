// Stripe client + Checkout Session creation (hosted checkout = we never touch
// card data). TEST MODE keys only.
import Stripe from 'stripe';

let _stripe = null;
export function stripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export async function createCheckoutSession(booking) {
  const webUrl = process.env.PUBLIC_WEB_URL || 'http://localhost:3002';
  const amount = parseInt(process.env.CONSULTING_PRICE_CENTS || '5000', 10);
  const currency = process.env.CURRENCY || 'usd';

  return stripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: 'Consulting Session',
            description: `Booking for ${booking.name}`,
          },
        },
      },
    ],
    customer_email: booking.email,
    // The booking id travels with the session so the webhook can match it back.
    client_reference_id: booking.id,
    metadata: { bookingId: booking.id },
    success_url: `${webUrl}/confirmation?booking=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webUrl}/?canceled=1`,
  });
}
