# Technical Explanation

## Architecture decisions

**Separate API and worker processes.** Transcription/translation take
seconds to minutes. If the API did this inline, requests would hang
and time out. Instead the API validates input, writes to Postgres,
pushes a message to Redis, and responds immediately. A completely
separate Node process (the worker) consumes that queue and does the
slow work, updating job status in Postgres as it progresses. The
frontend polls for status.

**Three separate storage systems, each doing what it's good at:**
Postgres (structured, relational data - the source of truth), Redis
(a fast, ephemeral job queue), MinIO/S3 (large binary files - video/
audio). Mixing these responsibilities into one system would be worse
at each individual job.

**Job and Project are separate entities.** A Project holds
user-editable subtitle data; a Job represents one processing run. This
means re-running transcription doesn't risk destroying edits already
made to an existing Project - they're linked but independently
lifecycled.

## ASR and translation provider design

Both transcription and translation are defined as TypeScript
interfaces in `packages/shared/src/providers/`, not concrete API
clients. The worker only ever calls the interface. A small factory
function (`apps/worker/src/providers/index.ts`) decides which concrete
implementation to instantiate, based on the `ASR_PROVIDER` /
`TRANSLATION_PROVIDER` environment variables.

This meant the entire pipeline (upload, queue, database writes,
frontend editor) could be built and tested with zero API keys using
mock implementations, before any real provider was wired in. Swapping
to a real provider later (Whisper via Groq, LLM-based translation via
Groq) touched exactly two new files plus one line in the factory - no
changes to routes, the queue, or the frontend were needed.

## Failure handling

- Every route throws a typed `AppError` (code + message + HTTP
  status); one central Express error-handling middleware formats all
  of them consistently, and never leaks stack traces or internal
  details to the client.
- Prisma-specific errors (e.g. "record not found" on an update/delete)
  are mapped to sensible HTTP responses (404/409) even if a route
  forgot to check existence first, as a safety net.
- BullMQ retries failed jobs automatically (3 attempts, exponential
  backoff) before marking a Job as `failed` with a structured error
  code/message stored on the row.
- Real-world example encountered during development: a misconfigured
  API key caused the worker to fail 3 times (visible in logs as
  automatic retries) before surfacing a clean, actionable error -
  confirming the retry/failure path works correctly under a genuine
  failure, not just in theory.

## Scaling approach

- **Worker horizontal scaling**: the worker is a stateless consumer of
  a Redis queue - running multiple worker container replicas requires
  no code changes, BullMQ handles distributing jobs among them.
- **Database**: read-heavy endpoints (GET job/project) could add a
  read replica; the schema has indexes on the foreign keys used in
  lookups (`uploadId`, `projectId`).
- **Object storage**: already S3-compatible (MinIO locally); swapping
  to real S3/R2/Cloudflare is a config change, not a code change.
- **Rate limiting** is currently per-process/in-memory
  (`express-rate-limit`); at real scale this would move to a
  Redis-backed store so limits are enforced consistently across
  multiple API container replicas.
- **Video delivery**: currently signed URLs direct from MinIO/S3;
  production would add a CDN in front of the bucket for actual video
  playback at scale.

## Security considerations

- Uploaded files are validated by actual content (`ffprobe`), never by
  trusting the client-supplied extension or MIME type.
- Filenames are sanitized before use in storage keys (prevents path
  traversal / unusual filesystem characters).
- Signed, time-limited URLs (1 hour) for video access instead of a
  public bucket.
- Rate limiting on write endpoints (uploads, job creation).
- Secrets (API keys, DB credentials) are environment-variable only,
  never committed; `.gitignore` excludes all `.env` files.
- Structured errors never expose provider names, stack traces, or
  infrastructure details to the client.

## Known limitations / improvements for a production version

- No authentication - every upload/project is currently accessible by
  anyone with the ID. Auth was explicitly out of scope for this build
  but the schema already has a nullable `userId` field ready for it.
- Rate limiting is per-process, not distributed (see Scaling above).
- No automated test suite yet - all verification so far has been
  manual (curl + direct DB checks). The SRT generator/validator is the
  best candidate for unit tests, being pure functions with no I/O.
- No CDN in front of video delivery.
- YouTube URL import (a spec bonus feature) not yet implemented.
