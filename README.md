# Subtitle Studio

Upload a video, get an automatic transcript, translate it, edit any
mistakes, and export subtitles as a downloadable file.

## Stack

- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Backend API:** Express + TypeScript
- **Worker:** Node/TypeScript background process (BullMQ)
- **Database:** PostgreSQL (via Prisma)
- **Queue:** Redis + BullMQ
- **Storage:** MinIO locally (S3-compatible)
- **ASR/Translation:** Whisper + LLM translation via Groq (free tier)

## Docs

- [`docs/api.md`](docs/api.md) - full API reference
- [`docs/db-schema.md`](docs/db-schema.md) - database schema
- [`docs/example.srt`](docs/example.srt) - real generated output
- [`docs/TECHNICAL.md`](docs/TECHNICAL.md) - architecture decisions,
  failure handling, scaling, security, known limitations
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - system diagram and folder map

## Running locally

1. Copy environment templates (both copies needed - see note below):
```bash
   cp .env.example .env
   cp .env.example docker/.env
```
2. Add a free Groq API key (console.groq.com) to both `.env` files as
   `GROQ_API_KEY=...`
3. Start everything:
```bash
   docker compose -f docker/docker-compose.yml up -d --build
```
4. Check:
   - Frontend: http://localhost:3000
   - API health: http://localhost:4000/health
   - MinIO console: http://localhost:9001 (`minio_admin` / `minio_admin_password`)

> **Why two `.env` files:** Docker Compose looks for `.env` in the same
> folder as the compose file (`docker/`), not the project root. Keep
> both in sync if you add new variables.

## Project structure

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full annotated folder
tree and request-flow diagram.

## Status

Core pipeline is complete and working end-to-end with real AI
(transcription + translation): upload -> process -> edit -> export.
See [`docs/TECHNICAL.md`](docs/TECHNICAL.md) for what's built, what's
a known limitation, and suggested next steps.
