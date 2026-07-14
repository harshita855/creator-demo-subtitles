import { z } from "zod";
import { LanguageCodeSchema, ErrorCodeSchema } from "./common";

// Order matters here - it mirrors the actual pipeline sequence (spec §8).
export const JobStatusSchema = z.enum([
  "queued",
  "uploading",
  "extracting_audio",
  "transcribing",
  "translating",
  "formatting",
  "completed",
  "failed",
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

// POST /api/jobs request body
export const CreateJobRequestSchema = z.object({
  upload_id: z.string(),
  source_language: LanguageCodeSchema,
  target_language: LanguageCodeSchema,
  translate: z.boolean(),
});
export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;

export const CreateJobResponseSchema = z.object({
  job_id: z.string(),
  status: JobStatusSchema,
});
export type CreateJobResponse = z.infer<typeof CreateJobResponseSchema>;

// GET /api/jobs/{job_id} response
export const JobStatusResponseSchema = z.object({
  job_id: z.string(),
  status: JobStatusSchema,
  progress: z.number().min(0).max(100),
  error: z
    .object({
      code: ErrorCodeSchema,
      message: z.string(),
    })
    .nullable(),
});
export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;

// Full job record as stored in the database (spec §13).
export const JobSchema = z.object({
  id: z.string(),
  uploadId: z.string(),
  status: JobStatusSchema,
  progress: z.number().min(0).max(100),
  sourceLanguage: LanguageCodeSchema,
  targetLanguage: LanguageCodeSchema,
  translate: z.boolean(),
  errorCode: ErrorCodeSchema.nullable(),
  errorMessage: z.string().nullable(),
  retryCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});
export type Job = z.infer<typeof JobSchema>;