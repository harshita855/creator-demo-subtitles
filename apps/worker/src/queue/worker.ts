import { Worker, type Job } from "bullmq";
import { TRANSCRIPTION_QUEUE_NAME, createLogger } from "@subtitle-app/shared";
import { getRedisConnectionOptions } from "./connection";
import { processJob } from "../processJob";
import { prisma } from "../db/prisma";
import { ProviderError } from "../lib/providerError";

const logger = createLogger("worker");

interface JobPayload {
  jobId: string;
}

export function startWorker(): Worker {
  const worker = new Worker<JobPayload>(
    TRANSCRIPTION_QUEUE_NAME,
    async (job: Job<JobPayload>) => {
      await processJob(job.data.jobId);
    },
    {
      connection: getRedisConnectionOptions(),
      concurrency: 1,
    }
  );

  worker.on("failed", async (job, err) => {
    logger.error("Job failed", { jobId: job?.id, error: err.message });
    if (job?.data?.jobId) {
      const code = err instanceof ProviderError ? err.code : "E_JOB_WORKER_FAILURE";
      const message =
        err instanceof ProviderError ? err.message : "Processing failed unexpectedly.";

      await prisma.job.update({
        where: { id: job.data.jobId },
        data: {
          status: "failed",
          errorCode: code,
          errorMessage: message,
          retryCount: { increment: 1 },
        },
      });
    }
  });

  worker.on("completed", (job) => {
    logger.info("BullMQ marked job as completed", { jobId: job.id });
  });

  return worker;
}
