# Database Schema

PostgreSQL via Prisma. Schema source of truth:
`packages/shared/prisma/schema.prisma`

## Entities

### Upload
One row per uploaded file.

| Column | Type | Notes |
|---|---|---|
| id | string (cuid) | primary key |
| userId | string? | nullable - auth not implemented |
| originalFilename | string | as provided by the client |
| storagePath | string | key within the MinIO/S3 bucket |
| mimeType | string | detected from the upload |
| fileSize | int | bytes |
| duration | float? | seconds, from ffprobe |
| status | enum | `uploading`, `uploaded`, `validation_failed` |
| createdAt | datetime | |

### Job
One row per transcription/translation request. Tracks the async
pipeline's progress.

| Column | Type | Notes |
|---|---|---|
| id | string (cuid) | primary key |
| uploadId | string | FK -> Upload |
| status | enum | see job state machine below |
| progress | int | 0-100 |
| sourceLanguage | string | ISO code or "auto" |
| targetLanguage | string | ISO code |
| translate | boolean | if false, transcription only |
| errorCode | string? | set only if status = failed |
| errorMessage | string? | human-readable, set only if failed |
| retryCount | int | incremented by BullMQ retries |
| createdAt | datetime | |
| completedAt | datetime? | |

**Job state machine:**
### Project
Created by the worker once a Job completes successfully. Holds the
editable subtitle data - separate from Job so re-processing (a new
Job) never destroys user edits already made to an existing Project.

| Column | Type | Notes |
|---|---|---|
| id | string (cuid) | primary key |
| uploadId | string | FK -> Upload |
| jobId | string | FK -> Job (unique - one project per job) |
| title | string? | not currently set by any route |
| sourceLanguage | string | |
| targetLanguage | string | |
| createdAt | datetime | |
| updatedAt | datetime | |

### SubtitleSegment
One row per subtitle line/block.

| Column | Type | Notes |
|---|---|---|
| id | string (cuid) | primary key |
| projectId | string | FK -> Project, `onDelete: Cascade` |
| sequenceNumber | int | display order; not necessarily gapless |
| startTime | float | seconds |
| endTime | float | seconds |
| originalText | string | |
| translatedText | string | |
| createdAt | datetime | |
| updatedAt | datetime | |

## Relationships
## Design notes

- **cuid() IDs**, not auto-increment integers - collision-resistant,
  don't leak row counts, work well in a distributed setup.
- **Job and Project are separate entities** rather than one combined
  table - a Project can accumulate user edits independently of the
  Job that created it; re-running transcription (a new Job) doesn't
  risk clobbering those edits.
- **sequenceNumber is not strictly re-numbered on every delete** - the
  export step renumbers sequentially at generation time instead, so
  deleting a middle segment doesn't require shifting every other row.
