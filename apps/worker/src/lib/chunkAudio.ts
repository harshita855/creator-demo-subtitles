import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileAsync = promisify(execFile);

// 10 minutes per chunk. At 16kHz mono 16-bit PCM WAV (~1.92 MB/min),
// a 10-minute chunk is roughly 19MB - comfortably under Whisper's
// ~25MB per-file limit with margin for container overhead. Using
// ffmpeg's segment muxer means short files just produce a single
// chunk automatically, so this same code path handles both short and
// long videos without any branching logic.
const CHUNK_DURATION_SECONDS = 600;

export interface AudioChunk {
  filePath: string;
  offsetSeconds: number;
}

export async function chunkAudio(
  audioFilePath: string,
  outputDir: string
): Promise<AudioChunk[]> {
  const pattern = path.join(outputDir, "chunk_%03d.wav");

  await execFileAsync("ffmpeg", [
    "-y",
    "-i", audioFilePath,
    "-f", "segment",
    "-segment_time", String(CHUNK_DURATION_SECONDS),
    "-c", "copy",
    pattern,
  ]);

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.startsWith("chunk_") && f.endsWith(".wav"))
    .sort();

  return files.map((filename, index) => ({
    filePath: path.join(outputDir, filename),
    offsetSeconds: index * CHUNK_DURATION_SECONDS,
  }));
}
