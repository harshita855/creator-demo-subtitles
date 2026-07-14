# API Documentation

Base URL (local): `http://localhost:4000`

All responses are JSON. All errors follow this shape:
```json
{ "error": { "code": "E_SOME_CODE", "message": "Human-readable message" } }
```

## POST /api/uploads
Upload a video/audio file.

**Request:** `multipart/form-data`, field name `file`

**Response `201`:**
```json
{ "upload_id": "cuid", "filename": "video.mp4", "status": "uploaded" }
```

**Errors:** `E_VALIDATION` (no file), `E_CORRUPTED_MEDIA`, `E_MISSING_AUDIO_STREAM`,
`E_VIDEO_TOO_LONG`, `E_FILE_TOO_LARGE` (413), `E_STORAGE_FAILURE` (502)

Rate limited: 30 requests / 15 minutes / IP.

---

## POST /api/jobs
Create a transcription/translation job for an uploaded file.

**Request body:**
```json
{
  "upload_id": "cuid",
  "source_language": "auto",
  "target_language": "en",
  "translate": true
}
```

**Response `201`:**
```json
{ "job_id": "cuid", "status": "queued" }
```

Rate limited: 30 requests / 15 minutes / IP.

---

## GET /api/jobs/:jobId
Poll job status. Intended to be called every ~2 seconds by the frontend
until status is `completed` or `failed`.

**Response `200`:**
```json
{
  "job_id": "cuid",
  "status": "transcribing",
  "progress": 40,
  "error": null
}
```

`status` is one of: `queued`, `extracting_audio`, `transcribing`,
`translating`, `formatting`, `completed`, `failed`.

---

## GET /api/projects/:projectId
Fetch the full project - video URL and all subtitle segments. Called
once the associated job reaches `completed` (a Project is created by
the worker at that point, linked via the Job).

**Response `200`:**
```json
{
  "project_id": "cuid",
  "video_url": "https://presigned-minio-or-s3-url...",
  "source_language": "auto",
  "target_language": "en",
  "segments": [
    {
      "id": "cuid",
      "projectId": "cuid",
      "sequenceNumber": 1,
      "startTime": 0.0,
      "endTime": 2.5,
      "originalText": "...",
      "translatedText": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

`video_url` is a signed URL valid for 1 hour.

**Errors:** `E_NOT_FOUND` (404)

---

## PATCH /api/projects/:projectId/segments/:segmentId
Edit a segment's text and/or timing. All fields optional - send only
what changed.

**Request body (any subset):**
```json
{
  "start": 1.2,
  "end": 4.8,
  "original_text": "Updated text",
  "translated_text": "Updated translation"
}
```

**Response `200`:** the updated segment (same shape as above).

**Errors:** `E_VALIDATION`, `E_NOT_FOUND` (404), `E_INVALID_TIMESTAMPS`
(if the resulting start/end combination is invalid)

---

## POST /api/projects/:projectId/segments
Add a new segment.

**Request body:**
```json
{
  "start": 10.0,
  "end": 12.5,
  "original_text": "New line",
  "translated_text": "Translated new line"
}
```

**Response `201`:** the created segment.

---

## DELETE /api/projects/:projectId/segments/:segmentId
Delete a segment.

**Response `204`:** empty body.

**Errors:** `E_NOT_FOUND` (404)

---

## GET /api/projects/:projectId/export
Download subtitles as a file.

**Query params:**
- `language`: `original` | `translated` | `bilingual`
- `format`: `srt` | `txt`

**Response `200`:** file download (`Content-Disposition: attachment`).
Bilingual format puts original text and translated text on two lines
within the same subtitle block (our own convention - no single
official standard exists for bilingual SRT).

**Errors:** `E_NOT_FOUND` (404), `E_INVALID_TIMESTAMPS` (if underlying
segment data is somehow invalid - should not normally occur given
PATCH/POST validation)

---

## GET /health
Health check. Returns `200 { "status": "ok", "service": "api" }`.
No auth, no rate limiting - used by Docker/orchestration to confirm
the container is ready.

---

## Error codes reference

| Code | Meaning |
|---|---|
| `E_VALIDATION` | Request body failed schema validation |
| `E_NOT_FOUND` | Referenced resource doesn't exist |
| `E_CORRUPTED_MEDIA` | Uploaded file isn't readable as valid media |
| `E_MISSING_AUDIO_STREAM` | File has no audio track |
| `E_VIDEO_TOO_LONG` | Exceeds `MAX_VIDEO_DURATION_SECONDS` |
| `E_FILE_TOO_LARGE` | Exceeds `MAX_UPLOAD_SIZE_MB` |
| `E_STORAGE_FAILURE` | Object storage write/read failed |
| `E_INVALID_TIMESTAMPS` | Segment start/end combination invalid |
| `E_JOB_WORKER_FAILURE` | Worker processing failed unexpectedly |
| `E_DUPLICATE_REQUEST` | Unique constraint violation |
| `E_INTERNAL` | Unhandled server error (detail logged server-side only) |
