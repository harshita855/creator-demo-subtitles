# Architecture

One reference document for the whole system — how requests flow, what each
piece is responsible for, and where every file lives.

## 1. What the system does, in one paragraph

A user uploads a video (or pastes a YouTube URL). The API stores it and
creates a job. A background worker pulls the job off a queue, extracts and
chunks the audio, sends it to a transcription provider, sends the transcript
to a translation provider, and saves timestamped subtitle segments to the
database. The frontend polls job status, then shows an editor where the user
fixes text/timing/adds/deletes segments next to the video, and finally lets
them export a `.srt` file.

## 2. Request flow

    Frontend (Next.js)
          |
          v
    API server (Express)
          |
          +---> Postgres   (jobs, projects, subtitle segments)
          +---> Redis       (job queue)
          +---> MinIO        (uploaded video / audio files)
          |
          v (Redis queue)
    Worker (background process)
          |
          +---> ASR provider          (speech -> timestamped text)
          +---> Translation provider  (text -> translated text)
          |
          v
    Postgres (worker writes segments + job status back)

**Why a separate worker process:** transcription/translation calls can take
minutes. The API validates the upload, writes to Postgres, pushes a message
to Redis, and responds immediately. The worker (a separate Node process)
picks that message up and does the slow work, updating job status in
Postgres as it progresses. The frontend polls `GET /api/jobs/{id}`.

**Why three separate storage systems:** Postgres (structured relational
data, source of truth), Redis (fast ephemeral queue), MinIO/S3 (large binary
files - object storage is built for this, databases aren't).

## 3. The provider abstraction

`TranscriptionProvider` and `TranslationProvider` are interfaces, not
concrete API clients (`packages/shared/src/providers/`). The worker only
calls the interface. A factory function (`apps/worker/src/providers/index.ts`)
picks the concrete implementation based on `ASR_PROVIDER`/`TRANSLATION_PROVIDER`
env vars. The entire pipeline was built and tested with zero API keys using
mocks, before swapping to real providers (Whisper + LLM translation via Groq)
by adding two new files and one line in the factory - no other code changed.

## 4. Job states

    queued -> extracting_audio -> transcribing -> translating -> formatting -> completed
                                                                            \-> failed (from any state)

BullMQ's own states (`waiting`, `active`, `completed`, `failed`) track the
*queue message*, not business logic - don't confuse the two.

## 5. Complete folder structure

    subtitle-studio/
    ├── apps/
    │   ├── web/                          Next.js frontend
    │   │   ├── src/
    │   │   │   ├── app/
    │   │   │   │   ├── layout.tsx            Theme provider + switcher
    │   │   │   │   ├── page.tsx              Landing page
    │   │   │   │   ├── globals.css           Theme CSS variables
    │   │   │   │   ├── upload/page.tsx       Upload (file or YouTube URL)
    │   │   │   │   ├── jobs/[jobId]/page.tsx Processing/progress page
    │   │   │   │   └── projects/[projectId]/page.tsx  Subtitle editor
    │   │   │   ├── components/
    │   │   │   │   ├── VideoPlayer.tsx
    │   │   │   │   ├── SubtitleSegmentRow.tsx
    │   │   │   │   ├── LanguageSelect.tsx
    │   │   │   │   ├── ProgressStages.tsx
    │   │   │   │   ├── FileDropzone.tsx
    │   │   │   │   └── ThemeSwitcher.tsx
    │   │   │   └── lib/
    │   │   │       ├── apiClient.ts          Typed fetch/XHR wrapper
    │   │   │       ├── ThemeProvider.tsx
    │   │   │       ├── types.ts
    │   │   │       └── hooks/useJobStatus.ts
    │   │   └── ...
    │   │
    │   ├── api/                          Express API server
    │   │   ├── src/
    │   │   │   ├── index.ts
    │   │   │   ├── routes/
    │   │   │   │   ├── uploads.ts            POST /uploads, POST /uploads/youtube
    │   │   │   │   ├── jobs.ts               POST/GET /jobs
    │   │   │   │   ├── projects.ts           GET/PATCH/POST/DELETE segments
    │   │   │   │   └── export.ts
    │   │   │   ├── lib/
    │   │   │   │   ├── storage.ts            S3/MinIO client wrapper
    │   │   │   │   ├── youtubeDownload.ts    yt-dlp wrapper
    │   │   │   │   ├── srt/                  generate.ts, validate.ts
    │   │   │   │   └── errors.ts
    │   │   │   └── middleware/
    │   │   │       ├── errorHandler.ts
    │   │   │       └── rateLimiter.ts
    │   │   └── ...
    │   │
    │   └── worker/                        Background job processor
    │       ├── src/
    │       │   ├── index.ts
    │       │   ├── processJob.ts             Orchestrates the pipeline
    │       │   ├── lib/
    │       │   │   ├── extractAudio.ts
    │       │   │   ├── chunkAudio.ts         Splits long audio for Whisper
    │       │   │   ├── storage.ts
    │       │   │   └── providerError.ts      Typed errors for specific codes
    │       │   └── providers/
    │       │       ├── transcription/ (mock + groq)
    │       │       └── translation/ (mock + groq)
    │       └── ...
    │
    ├── packages/shared/                   Types, schemas, providers, logger
    │   └── src/
    │       ├── schemas/                       Zod schemas per entity
    │       ├── providers/                     Provider interfaces
    │       ├── queue.ts                       Queue name constant
    │       └── logger.ts                      Structured JSON logger
    │
    ├── docker/                            docker-compose.yml + 3 Dockerfiles
    ├── docs/                              api.md, db-schema.md, TECHNICAL.md, example.srt, architecture-diagram.svg
    ├── .env.example
    └── README.md

## 6. Reusable vs one-off

**Reusable:** `packages/shared/*` (schemas, provider interfaces, logger,
queue name), `apps/api/src/lib/srt/*` (pure functions), `apps/api/src/lib/errors.ts`,
`apps/web/src/components/*` and hooks.

**One-off:** individual page files, individual route handlers,
`apps/worker/src/processJob.ts`'s specific pipeline sequencing.

## 7. Build order recap

1-11. Scaffold through export - done
12. Error handling pass - done
13. Security/reliability pass - done
14. Real ASR/translation integration (Groq) - done
15. Documentation - done (this file, api.md, db-schema.md, TECHNICAL.md, example.srt)
16. Bonus features - YouTube import, auto language detection, bilingual export
17. Deployment - pending, held until teammate's ASR/TTS integration lands

## 8. Updates since initial build

Several pieces were added after the original plan's Step 15:

- **YouTube URL import** — `POST /api/uploads/youtube` downloads
  server-side via `yt-dlp`, then reuses the exact same validation/
  storage/DB path as a regular file upload. No duplicate logic.
- **Audio chunking** — long videos are split into 10-minute audio
  chunks (`apps/worker/src/lib/chunkAudio.ts`) before transcription,
  since Whisper's API has a file-size ceiling. Segment timestamps are
  offset back to the full video's timeline after transcription, so
  nothing downstream needs to know chunking happened. Tested
  successfully on a real 20-minute video (3 chunks, 369 segments).
- **Rate-limit-safe translation** — translation requests run strictly
  sequentially (one at a time, ~2.2s apart) rather than in parallel,
  after discovering Groq's free tier caps at 30 requests/minute.
  Worker concurrency is also set to 1, so only one job's translation
  stream exists at any moment.
- **Structured JSON logging** — `packages/shared/src/logger.ts`
  provides a shared logger used by both `api` and `worker`; every log
  line is a JSON object with `timestamp`, `level`, `service`,
  `message`, and contextual fields, rather than plain strings.
- **Job processing timeout** — a 45-minute ceiling (configurable via
  `JOB_TIMEOUT_MINUTES`) catches genuinely stuck jobs without
  interfering with normal long-video processing time.
- **Full segment CRUD in the editor UI** — timestamp editing, delete,
  and add-segment buttons, all wired to the API endpoints that existed
  from Step 9 but weren't yet exposed in the frontend.
- **Theme system** — Dark/Light/Beige switcher via CSS variables,
  applied across landing/upload/processing/editor pages.
