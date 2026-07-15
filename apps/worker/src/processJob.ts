import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "./db/prisma";
import { getTranscriptionProvider, getTranslationProvider } from "./providers";
import { downloadFileFromStorage } from "./lib/storage";
import { extractAudio } from "./lib/extractAudio";
import type { TranslationProvider } from "@subtitle-app/shared";
import type { TranscriptSegment } from "@subtitle-app/shared";

const TRANSLATION_BATCH_SIZE = 5;
const TRANSLATION_BATCH_DELAY_MS = 2000;

export async function processJob(jobId: string): Promise<void> {
  console.log(`[worker] starting job ${jobId}`);

  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { upload: true },
  });

  const tempDir = os.tmpdir();
  const rawId = crypto.randomUUID();
  const rawFilePath = path.join(tempDir, `${rawId}-source`);
  const audioFilePath = path.join(tempDir, `${rawId}-audio.wav`);

  try {
    await updateStatus(jobId, "extracting_audio", 15);
    await downloadFileFromStorage(job.upload.storagePath, rawFilePath);
    await extractAudio(rawFilePath, audioFilePath);

    await updateStatus(jobId, "transcribing", 40);
    const transcriptionProvider = getTranscriptionProvider();
    const segments = await transcriptionProvider.transcribe(
      audioFilePath,
      job.sourceLanguage
    );

    if (segments.length === 0) {
      throw new Error("Transcription returned no segments - no speech detected.");
    }

    let finalSegments = segments.map((s) => ({ ...s, translatedText: s.text }));

    if (job.translate) {
      await updateStatus(jobId, "translating", 65);
      const translationProvider = getTranslationProvider();
      finalSegments = await translateInBatches(
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

    console.log(
      `[worker] job ${jobId} completed - created project ${project.id} with ${finalSegments.length} segments`
    );
  } finally {
    fs.unlink(rawFilePath, () => {});
    fs.unlink(audioFilePath, () => {});
  }
}

// Translates segments in small sequential batches rather than all at
// once - Groq's free tier caps requests per minute (30 RPM as of this
// writing), and firing every segment's translation in parallel via
// Promise.all() blows through that limit on any video with more than
// ~30 segments. Batching keeps us comfortably under the limit
// regardless of video length, at the cost of taking a bit longer on
// long videos - an acceptable trade-off for a free-tier-backed demo.
async function translateInBatches(
  segments: TranscriptSegment[],
  provider: TranslationProvider,
  sourceLanguage: string,
  targetLanguage: string,
  jobId: string
): Promise<Array<TranscriptSegment & { translatedText: string }>> {
  const results: Array<TranscriptSegment & { translatedText: string }> = [];

  for (let i = 0; i < segments.length; i += TRANSLATION_BATCH_SIZE) {
    const batch = segments.slice(i, i + TRANSLATION_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (s) => ({
        ...s,
        translatedText: await provider.translate(s.text, sourceLanguage, targetLanguage),
      }))
    );
    results.push(...batchResults);

    console.log(
      `[worker] job ${jobId} translated ${results.length}/${segments.length} segments`
    );

    // Skip the delay after the final batch - no point waiting once done.
    if (i + TRANSLATION_BATCH_SIZE < segments.length) {
      await new Promise((resolve) => setTimeout(resolve, TRANSLATION_BATCH_DELAY_MS));
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
  console.log(`[worker] job ${jobId} -> ${status} (${progress}%)`);
}
