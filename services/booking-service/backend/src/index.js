import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import bookingsRouter from './routes/bookings.js';
import webhookRouter from './routes/webhook.js';

const app = express();
app.use(cors());

// IMPORTANT: the Stripe webhook needs the RAW body for signature verification,
// so it is mounted BEFORE express.json() with a raw body parser.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRouter);

// All other routes use JSON.
app.use(express.json());
app.get('/health', (_req, res) => res.json({ ok: true, service: 'booking-service' }));
app.use('/api/bookings', bookingsRouter);

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'internal server error' });
});

const PORT = process.env.PORT || 4003;
initDb()
  .then(() => app.listen(PORT, () => console.log(`[api] listening on :${PORT}`)))
  .catch((err) => {
    console.error('[fatal] db init failed:', err.message);
    process.exit(1);
  });
