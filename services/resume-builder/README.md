# Resume Builder

An LLM-assisted resume builder: the user fills a short form, the AI turns rough
notes into polished, **ATS-friendly** copy, and the result is editable with a
**Tiptap** rich-text editor and restylable across **multiple templates** — all
as a self-contained microservice.

> Task 3 of the assessment. Runs independently via a single `docker compose up`.

## Flow (as specified in the brief)

```
Form  ─►  Backend LLM  ─►  Structured JSON  ─►  Template engine  ─►  HTML
submit    (polishes)       (content model)      (frontend maps)      preview + export
                                                      ▲
                                              Tiptap editor edits content
```

## Fastest way to evaluate (for reviewers)

Quickest path is a hosted key (no local model). Any OpenAI-compatible key works;
[Groq](https://console.groq.com) has a free one:

```bash
cd services/resume-builder
cp .env.example .env
# in .env set:
#   LLM_PROVIDER=openai
#   OPENAI_BASE_URL=https://api.groq.com/openai/v1
#   OPENAI_API_KEY=<your-key>
#   OPENAI_MODEL=llama-3.1-8b-instant
docker compose up --build
```

- Frontend: http://localhost:3001
- Backend health: http://localhost:4002/health

Prefer local + no key? Install [Ollama](https://ollama.com), `ollama pull llama3.2`,
leave the defaults, and `docker compose up --build`.

## Features → requirements mapping

| Requirement (brief)            | How it's met                                                        |
|--------------------------------|---------------------------------------------------------------------|
| Resume form submission         | `app/page.jsx` — structured fields + free-text notes                |
| LLM-generated content          | `POST /api/resumes/generate` → `llm/provider.js` + `resumePrompt.js`|
| HTML output generation         | `lib/templates.js` renders a full standalone HTML document          |
| Frontend template mapping      | Same content model → 3 template renderers, switch live              |
| ATS-friendly output            | Single-column, semantic headings, plain text — no tables/graphics   |
| Multiple resume templates      | Modern, Classic (ATS), Minimal                                      |
| Tiptap editor                  | `components/RichText.jsx` — summary + each experience's bullets      |
| Postgres (plus point)          | Resumes persisted as JSONB in `resumes` table                       |

## Key design decision

The LLM returns **structured JSON**, not raw HTML. One content model feeds every
template, which is what makes template switching, ATS-clean output, and Tiptap
editing all work off the same source of truth. The template engine
(`lib/templates.js`) turns that model into the exact HTML shown in the live
preview *and* exported — so preview and download can never drift apart.

## API

| Method | Endpoint                     | Description                                  |
|--------|------------------------------|----------------------------------------------|
| POST   | `/api/resumes/generate`      | Raw form → LLM → structured resume (persisted)|
| GET    | `/api/resumes`               | List saved resumes                           |
| GET    | `/api/resumes/:id`           | Fetch one resume                             |
| PUT    | `/api/resumes/:id`           | Save edits + chosen template                 |
| DELETE | `/api/resumes/:id`           | Delete a resume                              |

## Local run (no Docker)

```bash
createdb resume
cd backend && cp .env.example .env   # set DATABASE_URL + OLLAMA_BASE_URL=http://localhost:11434
npm install && npm start             # http://localhost:4002
cd ../frontend && cp .env.example .env.local
npm install && npm run dev           # http://localhost:3001
```

## Notes

- Ports are 3001 (frontend) / 4002 (backend) so this service can run alongside
  the AI Query Assistant (3000 / 4001) without collisions.
- Export options: **Export HTML** (download) and **Print / PDF** (opens the
  rendered resume for the browser's print-to-PDF).
- Secrets live only in `.env` (git-ignored); `.env.example` ships placeholders.
