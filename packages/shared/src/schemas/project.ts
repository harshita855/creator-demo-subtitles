import { z } from "zod";
import { LanguageCodeSchema } from "./common";
import { SubtitleSegmentSchema } from "./segment";

// GET /api/projects/{project_id} response
export const ProjectResponseSchema = z.object({
  project_id: z.string(),
  video_url: z.string(),
  source_language: LanguageCodeSchema,
  target_language: LanguageCodeSchema,
  segments: z.array(SubtitleSegmentSchema),
});
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

// Full project record as stored in the database (spec §13).
export const ProjectSchema = z.object({
  id: z.string(),
  uploadId: z.string(),
  jobId: z.string(),
  title: z.string().nullable(),
  sourceLanguage: LanguageCodeSchema,
  targetLanguage: LanguageCodeSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;

// GET /api/projects/{id}/export query params
export const ExportQuerySchema = z.object({
  language: z.enum(["original", "translated", "bilingual"]),
  format: z.enum(["srt", "txt"]),
});
export type ExportQuery = z.infer<typeof ExportQuerySchema>;