# Venture Builders — Full Stack (AI & Microservices) Assessment

Three independent microservices, each in its own folder under `services/`, each
runnable on its own via `docker compose up`.

| # | Service | Folder | Status |
|---|---------|--------|--------|
| 1 | Consulting Service Booking (Stripe + Google Calendar + email) | `services/booking-service` | in progress |
| 2 | **AI Query Assistant** (streaming, multi-session chat) | `services/ai-query-assistant` | ✅ complete |
| 3 | **Resume Builder** (Next.js + Tiptap + LLM + ATS templates) | `services/resume-builder` | ✅ complete |

## Architecture

Each service is fully self-contained — its own database, API, frontend, Docker
setup, and README — following a microservice-per-capability split. There is no
shared runtime coupling between services; they can be deployed and scaled
independently.

```
services/
├── booking-service/         # Task 1
├── ai-query-assistant/      # Task 2  ← see its README to run
└── resume-builder/          # Task 3
```

## Running a service

Each service has its own README with prerequisites and a one-command start.
Example:

```bash
cd services/ai-query-assistant
cp .env.example .env
docker compose up --build
```

## Engineering conventions

- Provider-agnostic LLM layer (local Ollama by default, OpenAI-compatible optional)
- Secrets only in `.env` (git-ignored); every service ships a `.env.example`
- Schemas bootstrapped in code so a fresh `docker compose up` just works
- Clear module ownership and inline reasoning on the non-obvious parts
