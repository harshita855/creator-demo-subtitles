import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AppError } from "./errors";

const execFileAsync = promisify(execFile);

interface FfprobeStream {
  codec_type: string;
}
interface FfprobeResult {
  format: {
    format_name: string;
    duration?: string;
  };
  streams: FfprobeStream[];
}

export interface ValidatedMedia {
  durationSeconds: number;
  hasAudioStream: boolean;
}

export async function validateMediaFile(filePath: string): Promise<ValidatedMedia> {
  let raw: string;
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      filePath,
    ]);
    raw = stdout;
  } catch (ffprobeErr) {
    console.error("[mediaValidation] ffprobe failed:", ffprobeErr);
    throw new AppError(
      "E_CORRUPTED_MEDIA",
      "The uploaded file could not be read as valid media.",
      400
    );
  }

  let parsed: FfprobeResult;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError(
      "E_CORRUPTED_MEDIA",
      "The uploaded file could not be read as valid media.",
      400
    );
  }

  if (!parsed.format || !parsed.streams || parsed.streams.length === 0) {
    throw new AppError(
      "E_CORRUPTED_MEDIA",
      "The uploaded file has no readable audio or video streams.",
      400
    );
  }

  const hasAudioStream = parsed.streams.some((s) => s.codec_type === "audio");
  if (!hasAudioStream) {
    throw new AppError(
      "E_MISSING_AUDIO_STREAM",
      "The uploaded file does not contain an audio track.",
      400
    );
  }

  const durationSeconds = parsed.format.duration
    ? parseFloat(parsed.format.duration)
    : 0;

  const maxDuration = process.env.MAX_VIDEO_DURATION_SECONDS
    ? Number(process.env.MAX_VIDEO_DURATION_SECONDS)
    : 7200;

  if (durationSeconds > maxDuration) {
    throw new AppError(
      "E_VIDEO_TOO_LONG",
      `Media duration exceeds the maximum allowed length of ${maxDuration} seconds.`,
      400
    );
  }

  return { durationSeconds, hasAudioStream };
}

export function sanitizeFilename(filename: string): string {
  const base = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(-200); // also cap absurd lengths
}