import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AppError } from "./errors";

const execFileAsync = promisify(execFile);

export async function downloadYoutubeVideo(
  url: string,
  outputPathWithoutExt: string
): Promise<{ filePath: string; title: string }> {
  if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url)) {
    throw new AppError(
      "E_VALIDATION",
      "Please provide a valid YouTube URL.",
      400
    );
  }

  try {
    // yt-dlp's --print statements fire at different pipeline stages,
    // not in command-line argument order: "%(title)s" (no WHEN
    // prefix) prints early, right after reading video info - BEFORE
    // download even starts. "after_move:filepath" only prints at the
    // very end, once the file is fully downloaded and moved into
    // place. So stdout order is always: title first, filepath second.
    const { stdout } = await execFileAsync("yt-dlp", [
      "-f", "best[ext=mp4]/best",
      "--no-playlist",
      "-q",
      "--no-progress",
      "--no-warnings",
      "-o", `${outputPathWithoutExt}.%(ext)s`,
      "--print", "%(title)s",
      "--print", "after_move:filepath",
      url,
    ]);

    const lines = stdout.trim().split("\n").filter((l) => l.length > 0);
    const title = lines[0] || "youtube-video";
    const filePath = lines[1];

    if (!filePath) {
      throw new Error("yt-dlp did not report a downloaded file path.");
    }

    return { filePath, title };
  } catch (err) {
    console.error("[youtubeDownload] yt-dlp failed:", err);
    throw new AppError(
      "E_CORRUPTED_MEDIA",
      "Could not download the video from that URL. It may be private, age-restricted, or unavailable.",
      400
    );
  }
}
