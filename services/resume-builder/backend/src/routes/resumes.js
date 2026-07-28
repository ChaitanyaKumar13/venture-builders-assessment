import { Router } from 'express';
import { pool } from '../db.js';
import { complete, activeModel } from '../llm/provider.js';
import { buildResumeMessages, parseResumeJson } from '../llm/resumePrompt.js';

const router = Router();

// Generate a polished structured resume from raw form data, then persist it.
router.post('/generate', async (req, res, next) => {
  try {
    const form = req.body || {};
    if (!form.fullName && !form.experience) {
      return res.status(400).json({ error: 'Please provide at least a name and some experience.' });
    }

    const raw = await complete(buildResumeMessages(form), { json: true });

    let data;
    try {
      data = parseResumeJson(raw);
    } catch (e) {
      // Fallback: if the model returned unusable JSON, keep the user's own input
      // so the flow never dead-ends.
      console.warn('[resumes] JSON parse failed, falling back to raw form:', e.message);
      data = form;
    }

    const title = `${data.fullName || 'Untitled'} — ${data.title || 'Resume'}`;
    const { rows } = await pool.query(
      `INSERT INTO resumes (title, data, template) VALUES ($1, $2, 'modern')
       RETURNING id, title, data, template, created_at, updated_at`,
      [title, data]
    );
    res.status(201).json({ ...rows[0], model: activeModel() });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, template, updated_at FROM resumes ORDER BY updated_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM resumes WHERE id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'resume not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// Save edits from the Tiptap editor + chosen template.
router.put('/:id', async (req, res, next) => {
  try {
    const { data, template, title } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE resumes
          SET data = COALESCE($1, data),
              template = COALESCE($2, template),
              title = COALESCE($3, title),
              updated_at = now()
        WHERE id = $4
        RETURNING id, title, data, template, updated_at`,
      [data ?? null, template ?? null, title ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'resume not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM resumes WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
