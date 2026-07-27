# AI Query Assistant

A ChatGPT-style assistant with **multiple chat sessions** and **token-by-token
streaming responses**. Built as a self-contained microservice (own database,
own API, own frontend) for the Venture Builders assessment.

> Task 2 of the assessment. Runs independently via a single `docker compose up`.

## Fastest way to evaluate (for reviewers)

The service is provider-agnostic. The **quickest path to a working demo is a
hosted LLM key** (no local model install). Any OpenAI-compatible key works —
[Groq](https://console.groq.com) offers a free one that streams well:

```bash
cd services/ai-query-assistant
cp .env.example .env
```

Then set these four lines in `.env`:

```
LLM_PROVIDER=openai
OPENAI_BASE_URL=https://api.groq.com/openai/v1   # or https://api.openai.com/v1
OPENAI_API_KEY=<your-key>
OPENAI_MODEL=llama-3.1-8b-instant                # or gpt-4o-mini for OpenAI
```

```bash
docker compose up --build
# Frontend: http://localhost:3000   Backend health: http://localhost:4001/health
```

Prefer a fully local, no-key setup? Use Ollama instead — see
[Quick start (Docker)](#quick-start-docker) below. Either way, if the chat shows
a ⚠️, the backend simply can't reach an LLM yet — pick one of the two paths above.

## Features

- ChatGPT-like chat interface (Next.js)
- Multiple persistent chat sessions (create, switch, rename-on-first-message, delete)
- **Streaming responses** over Server-Sent Events (the "plus point")
- Full conversation history sent as context on every turn
- Provider-agnostic LLM layer: **Ollama** (local, default) or any **OpenAI-compatible** API
- Postgres persistence with cascade delete

## Architecture

```
┌────────────┐     HTTP/SSE      ┌────────────┐     SQL      ┌──────────┐
│  Frontend  │ ────────────────► │  Backend   │ ───────────► │ Postgres │
│ Next.js 14 │ ◄──── stream ──── │ Express    │              │          │
└────────────┘                   └─────┬──────┘              └──────────┘
                                       │ streamChat()
                                       ▼
                              ┌──────────────────┐
                              │  LLM provider    │
                              │ Ollama / OpenAI  │
                              └──────────────────┘
```

- `frontend/` — Next.js App Router UI. Consumes the SSE stream with `fetch` +
  `ReadableStream` (works with POST, unlike `EventSource`).
- `backend/` — Express API. `POST /api/sessions/:id/stream` saves the user
  message, streams the model's tokens straight through to the client, then
  persists the assistant reply.
- `backend/src/llm/provider.js` — the only file that knows how to talk to an LLM.
  Swapping providers is an env flag, not a code change.

## Prerequisites

- Docker + Docker Compose, **or** Node.js 20+ and Postgres 14+ for a local run
- An LLM, one of:
  - **Ollama** (recommended, free, local): install from https://ollama.com then
    `ollama pull llama3.2`
  - Any **OpenAI-compatible** API key (OpenAI, Groq, Together, OpenRouter…)

## Quick start (Docker)

```bash
cp .env.example .env      # adjust if needed; defaults use local Ollama
# make sure Ollama is running on the host:  ollama serve  &&  ollama pull llama3.2
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:4001/health

> On Linux, `host.docker.internal` is provided via the `extra_hosts` mapping so
> the backend container can reach the host's Ollama.

### Using a hosted model instead of Ollama

Set these in `.env` before `docker compose up`:

```
LLM_PROVIDER=openai
OPENAI_BASE_URL=https://api.openai.com/v1   # or Groq/Together/OpenRouter base URL
OPENAI_API_KEY=sk-...                        # your key — never commit it
OPENAI_MODEL=gpt-4o-mini
```

## Quick start (local, no Docker)

```bash
# 1) Postgres
createdb aqa

# 2) Backend
cd backend
cp .env.example .env
#   set DATABASE_URL=postgres://<you>@localhost:5432/aqa
#   set OLLAMA_BASE_URL=http://localhost:11434
npm install
npm start                       # http://localhost:4001

# 3) Frontend (new terminal)
cd ../frontend
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4001
npm install
npm run dev                     # http://localhost:3000
```

## API

| Method | Endpoint                         | Description                          |
|--------|----------------------------------|--------------------------------------|
| GET    | `/health`                        | Service health check                 |
| GET    | `/api/sessions`                  | List sessions (newest first)         |
| POST   | `/api/sessions`                  | Create a session                     |
| GET    | `/api/sessions/:id/messages`     | Message history for a session        |
| PATCH  | `/api/sessions/:id`              | Rename a session                     |
| DELETE | `/api/sessions/:id`              | Delete a session (messages cascade)  |
| POST   | `/api/sessions/:id/stream`       | Send a message, stream the reply (SSE)|

**Stream frame format** (`text/event-stream`):

```
data: {"model":"llama3.2"}
data: {"token":"Hel"}
data: {"token":"lo"}
data: {"done":true,"title":"..."}
```

## Design decisions

- **SSE over WebSockets** — responses are one-directional server→client streams;
  SSE is simpler, proxy-friendly, and needs no extra protocol.
- **Provider abstraction** — isolates all LLM specifics behind `streamChat()`,
  so the service isn't locked to one vendor and can run fully offline on Ollama.
- **Schema bootstrapped in code** (`initDb`) with connection retries so the
  service comes up cleanly on first `docker compose up`.
- **History re-sent each turn** — keeps the backend stateless per request; the
  database is the single source of truth for a conversation.

## Notes

- Assistant text renders as plain text with preserved formatting. To add rich
  markdown/code-block rendering, drop `react-markdown` into `ChatWindow.jsx`.
- Secrets live only in `.env` (git-ignored). `.env.example` ships placeholders.
