import { AppError } from "../errors";
import { validateSegments, type SrtSegmentInput } from "./validate";

function formatTimestamp(totalSeconds: number): string {
  const totalMs = Math.round(totalSeconds * 1000);
  const ms = totalMs % 1000;
  const totalSecondsFloor = Math.floor(totalMs / 1000);
  const s = totalSecondsFloor % 60;
  const totalMinutes = Math.floor(totalSecondsFloor / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  const pad2 = (n: number) => n.toString().padStart(2, "0");
  const pad3 = (n: number) => n.toString().padStart(3, "0");

  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`;
}

export function generateSrt(segments: SrtSegmentInput[]): string {
  const issues = validateSegments(segments);
  if (issues.length > 0) {
    throw new AppError(
      "E_INVALID_TIMESTAMPS",
      `Cannot generate SRT: ${issues[0].message}`,
      400
    );
  }

  
  const nonEmpty = segments.filter((s) => s.text.trim().length > 0);

  return nonEmpty
    .map((segment, index) => {
      const sequenceNumber = index + 1; // always renumbered sequentially on export
      const startFormatted = formatTimestamp(segment.start);
      const endFormatted = formatTimestamp(segment.end);
      return `${sequenceNumber}\n${startFormatted} --> ${endFormatted}\n${segment.text.trim()}\n`;
    })
    .join("\n");
}