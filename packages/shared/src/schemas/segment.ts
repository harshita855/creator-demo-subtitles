import { z } from "zod";

// A single subtitle segment - the core editable unit.
export const SubtitleSegmentSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    sequenceNumber: z.number().int().positive(),
    startTime: z.number().min(0), // seconds
    endTime: z.number().min(0),
    originalText: z.string(),
    translatedText: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .refine((s) => s.endTime > s.startTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });
export type SubtitleSegment = z.infer<typeof SubtitleSegmentSchema>;

// PATCH /api/projects/{id}/segments/{segmentId}
// All fields optional since an edit might only touch text OR timing.
export const UpdateSegmentRequestSchema = z
  .object({
    start: z.number().min(0).optional(),
    end: z.number().min(0).optional(),
    original_text: z.string().optional(),
    translated_text: z.string().optional(),
  })
  .refine(
    (s) => !(s.start !== undefined && s.end !== undefined) || s.end > s.start,
    { message: "end must be after start", path: ["end"] }
  );
export type UpdateSegmentRequest = z.infer<typeof UpdateSegmentRequestSchema>;

// POST /api/projects/{id}/segments
export const AddSegmentRequestSchema = z
  .object({
    start: z.number().min(0),
    end: z.number().min(0),
    original_text: z.string(),
    translated_text: z.string(),
  })
  .refine((s) => s.end > s.start, {
    message: "end must be after start",
    path: ["end"],
  });
export type AddSegmentRequest = z.infer<typeof AddSegmentRequestSchema>;