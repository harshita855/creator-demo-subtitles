import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "./db/prisma";
import { getTranscriptionProvider, getTranslationProvider } from "./providers";
import { downloadFileFromStorage } from "./lib/storage";
import { extractAudio } from "./lib/extractAudio";
import { chunkAudio } from "./lib/chunkAudio";
import { ProviderError } from "./lib/providerError";
import { createLogger } from "@subtitle-app/shared";
import type { TranslationProvider, TranscriptionProvider } from "@subtitle-app/shared";
import type { TranscriptSegment } from "@subtitle-app/shared";

const logger = createLogger("worker");
const TRANSLATION_DELAY_MS = 2200;
const JOB_TIMEOUT_MS = process.env.JOB_TIMEOUT_MINUTES
  ? Number(process.env.JOB_TIMEOUT_MINUTES) * 60 * 1000
  : 45 * 60 * 1000;

export async function processJob(jobId: string): Promise<void> {
  logger.info("Starting job", { jobId });

  await Promise.race([
    runPipeline(jobId),
    timeoutAfter(JOB_TIMEOUT_MS, jobId),
  ]);
}

function timeoutAfter(ms: number, jobId: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new ProviderError(
          "E_PROCESSING_TIMEOUT",
          `Processing did not complete within ${Math.round(ms / 60000)} minutes.`
        )
      );
    }, ms);
  });
}

async function runPipeline(jobId: string): Promise<void> {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { upload: true },
  });

  const tempDir = os.tmpdir();
  const rawId = crypto.randomUUID();
  const rawFilePath = path.join(tempDir, `${rawId}-source`);
  const audioFilePath = path.join(tempDir, `${rawId}-audio.wav`);
  const chunkDir = path.join(tempDir, `${rawId}-chunks`);
  fs.mkdirSync(chunkDir, { recursive: true });

  try {
    await updateStatus(jobId, "extracting_audio", 15);
    await downloadFileFromStorage(job.upload.storagePath, rawFilePath);
    await extractAudio(rawFilePath, audioFilePath);

    await updateStatus(jobId, "transcribing", 40);
    const chunks = await chunkAudio(audioFilePath, chunkDir);
    logger.info("Audio split into chunks", { jobId, chunkCount: chunks.length });

    const transcriptionProvider = getTranscriptionProvider();
    const segments = await transcribeChunks(chunks, transcriptionProvider, job.sourceLanguage, jobId);

    if (segments.length === 0) {
      throw new Error("Transcription returned no segments - no speech detected.");
    }

    let finalSegments = segments.map((s) => ({ ...s, translatedText: s.text }));

    if (job.translate) {
      await updateStatus(jobId, "translating", 65);
      const translationProvider = getTranslationProvider();
      finalSegments = await translateSequentially(
        segments,
        translationProvider,
        job.sourceLanguage,
        job.targetLanguage,
        jobId
      );
    }

    await updateStatus(jobId, "formatting", 90);

    const project = await prisma.project.create({
      data: {
        uploadId: job.uploadId,
        jobId: job.id,
        sourceLanguage: job.sourceLanguage,
        targetLanguage: job.targetLanguage,
      },
    });

    await prisma.subtitleSegment.createMany({
      data: finalSegments.map((s, index) => ({
        projectId: project.id,
        sequenceNumber: index + 1,
        startTime: s.start,
        endTime: s.end,
        originalText: s.text,
        translatedText: s.translatedText,
      })),
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "completed", progress: 100, completedAt: new Date() },
    });

    logger.info("Job completed", {
      jobId,
      projectId: project.id,
      segmentCount: finalSegments.length,
    });
  } finally {
    fs.unlink(rawFilePath, () => {});
    fs.unlink(audioFilePath, () => {});
    fs.rm(chunkDir, { recursive: true, force: true }, () => {});
  }
}

async function transcribeChunks(
  chunks: { filePath: string; offsetSeconds: number }[],
  provider: TranscriptionProvider,
  sourceLanguage: string,
  jobId: string
): Promise<TranscriptSegment[]> {
  const allSegments: TranscriptSegment[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkSegments = await provider.transcribe(chunk.filePath, sourceLanguage);

    for (const s of chunkSegments) {
      allSegments.push({
        start: s.start + chunk.offsetSeconds,
        end: s.end + chunk.offsetSeconds,
        text: s.text,
      });
    }

    logger.info("Transcribed chunk", { jobId, chunkIndex: i + 1, totalChunks: chunks.length });
  }

  return allSegments;
}

async function translateSequentially(
  segments: TranscriptSegment[],
  provider: TranslationProvider,
  sourceLanguage: string,
  targetLanguage: string,
  jobId: string
): Promise<Array<TranscriptSegment & { translatedText: string }>> {
  const results: Array<TranscriptSegment & { translatedText: string }> = [];

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const translatedText = await provider.translate(s.text, sourceLanguage, targetLanguage);
    results.push({ ...s, translatedText });

    if ((i + 1) % 5 === 0 || i === segments.length - 1) {
      logger.info("Translation progress", {
        jobId,
        translated: i + 1,
        total: segments.length,
      });
    }

    if (i < segments.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, TRANSLATION_DELAY_MS));
    }
  }

  return results;
}

async function updateStatus(
  jobId: string,
  status: string,
  progress: number
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: status as never, progress },
  });
  logger.info("Job status updated", { jobId, status, progress });
}
