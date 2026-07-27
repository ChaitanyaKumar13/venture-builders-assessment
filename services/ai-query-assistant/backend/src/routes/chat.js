// The streaming chat endpoint — the core of this service.
// Flow: save user message -> stream LLM tokens to client via SSE ->
//       persist the full assistant reply -> auto-title new sessions.
import { Router } from 'express';
import { pool } from '../db.js';
import { streamChat, activeModel } from '../llm/provider.js';

const router = Router();

const SYSTEM_PROMPT = {
  role: 'system',
  content:
    'You are a concise, helpful AI assistant. Answer clearly and directly. ' +
    'Use markdown when it improves readability.',
};

// POST /api/sessions/:id/stream   body: { content }
router.post('/:id/stream', async (req, res) => {
  const sessionId = req.params.id;
  const content = (req.body?.content || '').trim();

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  // Confirm the session exists before doing any work.
  const sessionRes = await pool.query(`SELECT id, title FROM sessions WHERE id = $1`, [sessionId]);
  if (!sessionRes.rows.length) {
    return res.status(404).json({ error: 'session not found' });
  }

  // 1) Persist the user's message.
  await pool.query(
    `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', $2)`,
    [sessionId, content]
  );

  // 2) Build the model context from the full session history.
  const history = await pool.query(
    `SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId]
  );
  const modelMessages = [SYSTEM_PROMPT, ...history.rows];

  // 3) Open the SSE stream.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering if present
  res.flushHeaders?.();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  send({ model: activeModel() });

  let full = '';
  try {
    for await (const token of streamChat(modelMessages)) {
      full += token;
      send({ token });
    }
  } catch (err) {
    console.error('[chat] stream error:', err.message);
    send({ error: err.message });
    return res.end();
  }

  // 4) Persist the assistant reply.
  await pool.query(
    `INSERT INTO messages (session_id, role, content) VALUES ($1, 'assistant', $2)`,
    [sessionId, full]
  );

  // 5) Auto-title a fresh session from its first user message.
  let title;
  if (sessionRes.rows[0].title === 'New chat') {
    title = content.slice(0, 48) + (content.length > 48 ? '…' : '');
    await pool.query(`UPDATE sessions SET title = $1, updated_at = now() WHERE id = $2`, [
      title,
      sessionId,
    ]);
  } else {
    await pool.query(`UPDATE sessions SET updated_at = now() WHERE id = $1`, [sessionId]);
  }

  send({ done: true, title });
  res.end();
});

export default router;
