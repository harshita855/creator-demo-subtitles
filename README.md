# Subtitle Studio

Two tools in one app:

- **Subtitle a video** — upload a video, get an automatic transcript,
  translate it, edit any mistakes, and export subtitles as a
  downloadable file.
- **Text to Speech** — turn text (or an uploaded `.srt` / `.txt`) into
  natural spoken audio, with a choice of voices, languages, and speed.
  The subtitle editor can send its subtitles straight to the TTS studio.

## Stack

- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Backend API:** Express + TypeScript
- **Worker:** Node/TypeScript background process (BullMQ)
- **Database:** PostgreSQL (via Prisma)
- **Queue:** Redis + BullMQ
- **Storage:** MinIO locally (S3-compatible)
- **ASR/Translation:** Whisper + LLM translation via Groq (free tier)
- **Text-to-Speech:** ElevenLabs (`eleven_flash_v2_5`), key held server-side

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
2. Add your API keys to both `.env` files:
   - `GROQ_API_KEY=...` — free key from console.groq.com (transcription + translation)
   - `ELEVENLABS_API_KEY=...` — free key from elevenlabs.io (text-to-speech)
3. Start everything:
```bash
   docker compose -f docker/docker-compose.yml up -d --build
```
4. Check:
   - Frontend: http://localhost:3000
   - Text-to-Speech studio: http://localhost:3000/tts
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
Text-to-Speech is live too: text or `.srt`/`.txt` -> spoken audio, with
a "Voice this" handoff from the subtitle editor. Voice cloning is wired
but requires a paid ElevenLabs plan.
See [`docs/TECHNICAL.md`](docs/TECHNICAL.md) for what's built, what's
a known limitation, and suggested next steps.
