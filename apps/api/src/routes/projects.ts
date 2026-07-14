import { Router } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../lib/errors";
import { getPresignedDownloadUrl } from "../lib/storage";
import {
  UpdateSegmentRequestSchema,
  AddSegmentRequestSchema,
  type ProjectResponse,
} from "@subtitle-app/shared";

const router = Router();

router.get("/:projectId", async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        segments: { orderBy: { sequenceNumber: "asc" } },
        upload: true,
      },
    });
    if (!project) {
      throw new AppError("E_NOT_FOUND", "Project not found.", 404);
    }

    const videoUrl = await getPresignedDownloadUrl(project.upload.storagePath);

    const response: ProjectResponse = {
      project_id: project.id,
      video_url: videoUrl,
      source_language: project.sourceLanguage,
      target_language: project.targetLanguage,
      segments: project.segments.map((s) => ({
        id: s.id,
        projectId: s.projectId,
        sequenceNumber: s.sequenceNumber,
        startTime: s.startTime,
        endTime: s.endTime,
        originalText: s.originalText,
        translatedText: s.translatedText,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
});

router.post("/:projectId/segments", async (req, res, next) => {
  try {
    const parsed = AddSegmentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        "E_VALIDATION",
        "Invalid segment data: " + parsed.error.message,
        400
      );
    }
    const { start, end, original_text, translated_text } = parsed.data;

    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
    });
    if (!project) {
      throw new AppError("E_NOT_FOUND", "Project not found.", 404);
    }

    const maxSequence = await prisma.subtitleSegment.aggregate({
      where: { projectId: project.id },
      _max: { sequenceNumber: true },
    });
    const nextSequence = (maxSequence._max.sequenceNumber ?? 0) + 1;

    const segment = await prisma.subtitleSegment.create({
      data: {
        projectId: project.id,
        sequenceNumber: nextSequence,
        startTime: start,
        endTime: end,
        originalText: original_text,
        translatedText: translated_text,
      },
    });

    res.status(201).json({
      id: segment.id,
      projectId: segment.projectId,
      sequenceNumber: segment.sequenceNumber,
      startTime: segment.startTime,
      endTime: segment.endTime,
      originalText: segment.originalText,
      translatedText: segment.translatedText,
      createdAt: segment.createdAt.toISOString(),
      updatedAt: segment.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:projectId/segments/:segmentId", async (req, res, next) => {
  try {
    const parsed = UpdateSegmentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        "E_VALIDATION",
        "Invalid segment update: " + parsed.error.message,
        400
      );
    }

    const existing = await prisma.subtitleSegment.findFirst({
      where: { id: req.params.segmentId, projectId: req.params.projectId },
    });
    if (!existing) {
      throw new AppError("E_NOT_FOUND", "Segment not found.", 404);
    }

    const { start, end, original_text, translated_text } = parsed.data;

    const newStart = start ?? existing.startTime;
    const newEnd = end ?? existing.endTime;
    if (newStart >= newEnd) {
      throw new AppError(
        "E_INVALID_TIMESTAMPS",
        "Resulting start time must be before end time.",
        400
      );
    }

    const updated = await prisma.subtitleSegment.update({
      where: { id: existing.id },
      data: {
        startTime: newStart,
        endTime: newEnd,
        originalText: original_text ?? existing.originalText,
        translatedText: translated_text ?? existing.translatedText,
      },
    });

    res.status(200).json({
      id: updated.id,
      projectId: updated.projectId,
      sequenceNumber: updated.sequenceNumber,
      startTime: updated.startTime,
      endTime: updated.endTime,
      originalText: updated.originalText,
      translatedText: updated.translatedText,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:projectId/segments/:segmentId", async (req, res, next) => {
  try {
    const existing = await prisma.subtitleSegment.findFirst({
      where: { id: req.params.segmentId, projectId: req.params.projectId },
    });
    if (!existing) {
      throw new AppError("E_NOT_FOUND", "Segment not found.", 404);
    }

    await prisma.subtitleSegment.delete({ where: { id: existing.id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;