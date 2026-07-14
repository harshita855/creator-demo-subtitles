import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "./db/prisma";
import { getTranscriptionProvider, getTranslationProvider } from "./providers";
import { downloadFileFromStorage } from "./lib/storage";
import { extractAudio } from "./lib/extractAudio";

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
      finalSegments = await Promise.all(
        segments.map(async (s) => ({
          ...s,
          translatedText: await translationProvider.translate(
            s.text,
            job.sourceLanguage,
            job.targetLanguage
          ),
        }))
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
    // Clean up temp files regardless of success or failure - never
    // leave downloaded videos/audio sitting on the worker's local disk.
    fs.unlink(rawFilePath, () => {});
    fs.unlink(audioFilePath, () => {});
  }
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
