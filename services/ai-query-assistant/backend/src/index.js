// AI Query Assistant — Express entrypoint.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import sessionsRouter from './routes/sessions.js';
import chatRouter from './routes/chat.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ai-query-assistant' }));

app.use('/api/sessions', sessionsRouter);
app.use('/api/sessions', chatRouter); // adds POST /api/sessions/:id/stream

// Centralized error handler.
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'internal server error' });
});

const PORT = process.env.PORT || 4001;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('[fatal] could not initialize database:', err.message);
    process.exit(1);
  });
