import { Worker, type Job } from "bullmq";
import { TRANSCRIPTION_QUEUE_NAME } from "@subtitle-app/shared";
import { getRedisConnectionOptions } from "./connection";
import { processJob } from "../processJob";
import { prisma } from "../db/prisma";

interface JobPayload {
  jobId: string;
}

export function startWorker(): Worker {
  const worker = new Worker<JobPayload>(
    TRANSCRIPTION_QUEUE_NAME,
    async (job: Job<JobPayload>) => {
      await processJob(job.data.jobId);
    },
    { connection: getRedisConnectionOptions(), concurrency: 2 }
  );

  worker.on("failed", async (job, err) => {
    console.error(`[worker] job ${job?.id} failed:`, err.message);
    if (job?.data?.jobId) {
      await prisma.job.update({
        where: { id: job.data.jobId },
        data: {
          status: "failed",
          errorCode: "E_JOB_WORKER_FAILURE",
          errorMessage: "Processing failed unexpectedly.",
          retryCount: { increment: 1 },
        },
      });
    }
  });

  worker.on("completed", (job) => {
    console.log(`[worker] BullMQ marked job ${job.id} as completed`);
  });

  return worker;
}