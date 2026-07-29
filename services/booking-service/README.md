# Consulting Service Booking

Book a consulting session: fill a form → pay via **Stripe** → on successful
payment, a **Google Calendar** event is created and a **confirmation email** is
sent. Built as a self-contained microservice.

> Task 1 of the assessment. Runs independently via a single `docker compose up`.

## Flow

```
Form ─► POST /checkout ─► Stripe Checkout ─► payment ─► Stripe webhook
                                                              │
                                                    fulfillBooking() (idempotent)
                                                       ├─ Google Calendar event
                                                       └─ confirmation email
```

## Key design decisions (graded for reasoning)

- **Fulfilment happens on the Stripe webhook, not the browser redirect.** Trusting
  the success redirect is the classic payment bug — anyone could hit the success
  URL without paying. The webhook (`checkout.session.completed`) is the source of
  truth. A **verify-on-return** endpoint acts as an idempotent safety net so the
  demo also works without the Stripe CLI running locally.
- **Idempotent fulfilment.** `fulfillBooking()` guards on booking status, so
  duplicate webhook deliveries or a webhook + verify race can never create two
  calendar events or two emails. (Unit-tested.)
- **Graceful degradation.** Side effects are best-effort: payment already
  succeeded, so a calendar/email hiccup is logged but never fails the booking.
  If Google credentials aren't set, booking + email still work.
- **No card data touches this service** — Stripe Checkout is hosted.

## Fastest way to evaluate (for reviewers)

Only a **free Stripe test key** is required. Calendar is optional; email needs
zero setup (Ethereal auto-creates a test inbox and returns a preview link).

```bash
cd services/booking-service
cp .env.example .env
# in .env set your Stripe TEST secret key:
#   STRIPE_SECRET_KEY=sk_test_...   (from https://dashboard.stripe.com/test/apikeys)
docker compose up --build
```

- Frontend: http://localhost:3002
- Backend health: http://localhost:4003/health

Fill the form → **Continue to payment** → on Stripe's test checkout use card
`4242 4242 4242 4242`, any future expiry, any CVC → you're redirected to the
confirmation page, which shows the payment as confirmed and links to the
Ethereal preview of the confirmation email.

### Optional: real webhook delivery (Stripe CLI)

```bash
stripe login
stripe listen --forward-to localhost:4003/api/webhooks/stripe
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET in .env, then restart
```

### Optional: Google Calendar

1. Create a Google Cloud project, enable the **Calendar API**.
2. Create a **service account**, generate a JSON key.
3. In Google Calendar, share a calendar with the service account email
   ("Make changes to events"), and copy that calendar's ID.
4. Put `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` (with `\n` for newlines) and
   `GOOGLE_CALENDAR_ID` in `.env`.

## API

| Method | Endpoint                        | Description                                   |
|--------|---------------------------------|-----------------------------------------------|
| POST   | `/api/bookings/checkout`        | Create pending booking + Stripe Checkout URL  |
| POST   | `/api/bookings/:id/verify`      | Idempotent verify-on-return fulfilment        |
| GET    | `/api/bookings/:id`             | Booking status + details                      |
| POST   | `/api/webhooks/stripe`          | Stripe webhook (primary fulfilment path)      |

## Ports

3002 (frontend) / 4003 (backend) — chosen so all three services run side by side
(AI Assistant 3000/4001, Resume Builder 3001/4002, Booking 3002/4003).

## Notes

- Required booking fields per brief: name, email, phone, agenda. A preferred
  **time slot** is also collected because a calendar event needs start/end.
- Secrets live only in `.env` (git-ignored); `.env.example` ships placeholders.
- Use Stripe **test mode** only — never real keys or real cards.
