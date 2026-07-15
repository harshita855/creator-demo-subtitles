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

**Errors:** `E_VALIDATION`, `E_CORRUPTED_MEDIA`, `E_MISSING_AUDIO_STREAM`,
`E_VIDEO_TOO_LONG`, `E_FILE_TOO_LARGE` (413), `E_STORAGE_FAILURE` (502),
`E_UPLOAD_INTERRUPTED` (if the client disconnects mid-upload)

Rate limited: 30 requests / 15 minutes / IP.

---

## POST /api/uploads/youtube
Import a video by YouTube URL instead of a file upload. Downloaded
server-side (yt-dlp), then runs through the same validation/storage
path as a regular upload.

**Request body:**
```json
{ "url": "https://www.youtube.com/watch?v=..." }
```
Works with regular videos and Shorts.

**Response `201`:** same shape as `POST /api/uploads`.

**Errors:** `E_VALIDATION` (missing/malformed URL), `E_CORRUPTED_MEDIA`
(video unavailable, private, age-restricted, or the download failed),
`E_STORAGE_FAILURE`

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
`source_language: "auto"` triggers automatic spoken-language detection.

**Response `201`:**
```json
{ "job_id": "cuid", "status": "queued" }
```

Rate limited: 30 requests / 15 minutes / IP (job creation only - the
status-polling endpoint below is not rate limited, since the frontend
polls it every 2 seconds as expected, legitimate traffic).

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
  "error": null,
  "project_id": null
}
```

`status` is one of: `queued`, `extracting_audio`, `transcribing`,
`translating`, `formatting`, `completed`, `failed`.

`project_id` is `null` until the job completes, then contains the ID
of the Project the worker created - lets the frontend link straight
to the editor without a separate lookup.

---

## GET /api/projects/:projectId
Fetch the full project - video URL and all subtitle segments.

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
      "start": 1.2,
      "end": 4.8,
      "original_text": "...",
      "translated_text": "..."
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

**Response `200`:** the updated segment (same shape as segments above).

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

**Errors:** `E_NOT_FOUND` (404), `E_INVALID_TIMESTAMPS`

---

## GET /api/tts/options
List the available text-to-speech voices, models, languages, and limits.
Used by the frontend so these are never hardcoded client-side.

**Response `200`:**
```json
{
  "voices": [{ "id": "EXAVITQu4vr4xnSDxMaL", "name": "Sarah", "description": "Female · American · soft" }],
  "models": [{ "id": "eleven_flash_v2_5", "name": "Flash v2.5", "description": "Fastest · 30+ languages" }],
  "languages": [{ "code": "auto", "label": "Auto-detect" }],
  "maxChars": 5000,
  "defaultVoiceId": "EXAVITQu4vr4xnSDxMaL",
  "defaultModelId": "eleven_flash_v2_5"
}
```

---

## POST /api/tts
Synthesize speech from text. Returns an audio file (mp3). The provider
API key is held server-side only and never exposed to the client.

**Request body:**
```json
{
  "text": "Text to speak (max 5000 chars)",
  "voiceId": "EXAVITQu4vr4xnSDxMaL",
  "modelId": "eleven_flash_v2_5",
  "languageCode": "auto",
  "speed": 1.0
}
```
`voiceId` / `modelId` / `languageCode` fall back to defaults if omitted or
unknown; `speed` is clamped to 0.7–1.2.

**Response `200`:** `audio/mpeg` bytes (`X-Credits-Used` header when the
provider reports it).

**Errors:** `E_VALIDATION` (empty or too-long text), `E_TTS_UNAVAILABLE`
(502/503/429 from provider), `E_TTS_PAYMENT_REQUIRED` (402 — premium voice
or plan needed)

---

## POST /api/tts/clone
Create a cloned voice from uploaded audio samples. Wired and ready, but
provider voice cloning requires a paid plan — on a free plan this returns
`E_TTS_PAYMENT_REQUIRED`.

**Request:** `multipart/form-data` — `name` (string) + `samples` (1–5 audio files)

**Response `201`:**
```json
{ "voice_id": "cloned-voice-id", "name": "My Voice" }
```

**Errors:** `E_VALIDATION`, `E_TTS_PAYMENT_REQUIRED` (402), `E_TTS_UNAVAILABLE`

---

## GET /health
Health check. Returns `200 { "status": "ok", "service": "api" }`.
No auth, no rate limiting.

---

## Error codes reference

| Code | Meaning |
|---|---|
| `E_VALIDATION` | Request body failed schema validation |
| `E_NOT_FOUND` | Referenced resource doesn't exist |
| `E_CORRUPTED_MEDIA` | Uploaded/downloaded file isn't readable as valid media |
| `E_MISSING_AUDIO_STREAM` | File has no audio track |
| `E_VIDEO_TOO_LONG` | Exceeds `MAX_VIDEO_DURATION_SECONDS` |
| `E_FILE_TOO_LARGE` | Exceeds `MAX_UPLOAD_SIZE_MB` |
| `E_UPLOAD_INTERRUPTED` | Client disconnected before the upload completed |
| `E_STORAGE_FAILURE` | Object storage write/read failed |
| `E_INVALID_TIMESTAMPS` | Segment start/end combination invalid |
| `E_ASR_UNAVAILABLE` | Transcription provider (Groq/Whisper) unreachable or erroring |
| `E_TRANSLATION_UNAVAILABLE` | Translation provider (Groq/LLM) unreachable or erroring |
| `E_PROCESSING_TIMEOUT` | Job exceeded the configured processing time limit |
| `E_JOB_WORKER_FAILURE` | Worker processing failed for an unclassified reason |
| `E_DUPLICATE_REQUEST` | Unique constraint violation |
| `E_TTS_UNAVAILABLE` | Speech provider unreachable / rate-limited / errored |
| `E_TTS_PAYMENT_REQUIRED` | Speech action needs a paid plan (premium voice or cloning) |
| `E_INTERNAL` | Unhandled server error (detail logged server-side only) |
