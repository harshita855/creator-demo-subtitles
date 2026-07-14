import { z } from "zod";

export const SUPPORTED_MIME_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/webm",
  "audio/mpeg",       // .mp3
  "audio/wav",
  "audio/x-m4a",
] as const;

export const UploadStatusSchema = z.enum([
  "uploading",
  "uploaded",
  "validation_failed",
]);
export type UploadStatus = z.infer<typeof UploadStatusSchema>;

// What the API returns right after a file is accepted (spec §7).
export const CreateUploadResponseSchema = z.object({
  upload_id: z.string(),
  filename: z.string(),
  status: UploadStatusSchema,
});
export type CreateUploadResponse = z.infer<typeof CreateUploadResponseSchema>;

// Full upload record as stored in the database (spec §13).
export const UploadSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  originalFilename: z.string(),
  storagePath: z.string(),
  mimeType: z.string(),
  fileSize: z.number().int().positive(),
  duration: z.number().positive().nullable(), // null until ffprobe runs
  status: UploadStatusSchema,
  createdAt: z.string().datetime(),
});
export type Upload = z.infer<typeof UploadSchema>;