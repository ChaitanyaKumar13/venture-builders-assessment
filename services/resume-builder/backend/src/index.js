import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import resumesRouter from './routes/resumes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'resume-builder' }));
app.use('/api/resumes', resumesRouter);

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'internal server error' });
});

const PORT = process.env.PORT || 4002;
initDb()
  .then(() => app.listen(PORT, () => console.log(`[api] listening on :${PORT}`)))
  .catch((err) => {
    console.error('[fatal] db init failed:', err.message);
    process.exit(1);
  });
