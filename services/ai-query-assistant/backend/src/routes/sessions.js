// CRUD for chat sessions and their message history.
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// List all sessions, most recently updated first.
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, created_at, updated_at
         FROM sessions
        ORDER BY updated_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Create a new (empty) session.
router.post('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO sessions (title) VALUES ('New chat')
       RETURNING id, title, created_at, updated_at`
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Fetch full message history for a session.
router.get('/:id/messages', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, role, content, created_at
         FROM messages
        WHERE session_id = $1
        ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Rename a session.
router.patch('/:id', async (req, res, next) => {
  try {
    const title = (req.body?.title || '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });
    const { rows } = await pool.query(
      `UPDATE sessions SET title = $1, updated_at = now()
        WHERE id = $2
        RETURNING id, title, created_at, updated_at`,
      [title, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'session not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete a session (messages cascade).
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM sessions WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
