import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Converts any input video/audio into a clean 16kHz mono WAV -
// the format Whisper-family models expect for best accuracy, and
// small enough to upload quickly regardless of the source format.
export async function extractAudio(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-y", // overwrite output if it exists
    "-i", inputPath,
    "-ar", "16000",
    "-ac", "1",
    "-vn", // no video stream
    outputPath,
  ]);
}
