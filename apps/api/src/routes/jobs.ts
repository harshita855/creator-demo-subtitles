import { Router } from "express";
import { prisma } from "../db/prisma";
import { jobQueue } from "../queue/jobQueue";
import { AppError } from "../lib/errors";
import {
  CreateJobRequestSchema,
  type CreateJobResponse,
  type JobStatusResponse,
} from "@subtitle-app/shared";
import { writeRateLimiter } from "../middleware/rateLimiter";

const router = Router();
router.use(writeRateLimiter);

router.post("/", async (req, res, next) => {
  try {
    const parsed = CreateJobRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        "E_VALIDATION",
        "Invalid job creation request: " + parsed.error.message,
        400
      );
    }
    const { upload_id, source_language, target_language, translate } = parsed.data;
    const upload = await prisma.upload.findUnique({ where: { id: upload_id } });
    if (!upload) {
      throw new AppError("E_NOT_FOUND", "The referenced upload does not exist.", 404);
    }
    const job = await prisma.job.create({
      data: {
        uploadId: upload_id,
        status: "queued",
        sourceLanguage: source_language,
        targetLanguage: target_language,
        translate,
      },
    });
    await jobQueue.add(
      "process-transcription",
      { jobId: job.id },
      {
        jobId: job.id,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      }
    );
    const response: CreateJobResponse = {
      job_id: job.id,
      status: job.status,
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

router.get("/:jobId", async (req, res, next) => {
  try {
    // Include the linked project - once the worker finishes, it creates
    // exactly one Project per Job (see schema.prisma), so this tells the
    // frontend where to send the user next without a separate lookup.
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId },
      include: { project: true },
    });
    if (!job) {
      throw new AppError("E_NOT_FOUND", "Job not found.", 404);
    }

    const response: JobStatusResponse & { project_id: string | null } = {
      job_id: job.id,
      status: job.status,
      progress: job.progress,
      error: job.errorCode
        ? {
            code: job.errorCode as NonNullable<JobStatusResponse["error"]>["code"],
            message: job.errorMessage ?? "",
          }
        : null,
      project_id: job.project?.id ?? null,
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
