import { z } from "zod";

// Structured error shape used across every API response (spec §11).
// Never expose provider names, stack traces, or internals — just this.
export const ErrorCodeSchema = z.enum([
  "E_UNSUPPORTED_FORMAT",
  "E_CORRUPTED_MEDIA",
  "E_MISSING_AUDIO_STREAM",
  "E_FILE_TOO_LARGE",
  "E_VIDEO_TOO_LONG",
  "E_UPLOAD_INTERRUPTED",
  "E_ASR_UNAVAILABLE",
  "E_TRANSLATION_UNAVAILABLE",
  "E_TTS_UNAVAILABLE",
  "E_TTS_PAYMENT_REQUIRED",
  "E_PROCESSING_TIMEOUT",
  "E_INVALID_TIMESTAMPS",
  "E_STORAGE_FAILURE",
  "E_DUPLICATE_REQUEST",
  "E_JOB_WORKER_FAILURE",
  "E_NOT_FOUND",
  "E_VALIDATION",
  "E_INTERNAL",
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ISO 639-1-ish language code, or "auto" for source-language detection.
export const LanguageCodeSchema = z.union([z.string().min(2).max(10), z.literal("auto")]);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;