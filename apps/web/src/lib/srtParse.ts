// Turns the contents of an .srt or .txt file into plain speakable text.
//
// For SRT we strip the sequence numbers and "00:00:01,200 --> 00:00:04,800"
// timing lines, keeping only the spoken text. For TXT we just tidy up
// blank lines. The result is a single string ready to send to TTS.

const TIMECODE_RE =
  /^\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}/;
const INDEX_RE = /^\s*\d+\s*$/;

export function srtToText(raw: string): string {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  for (const line of lines) {
    if (TIMECODE_RE.test(line)) continue; // timing line
    if (INDEX_RE.test(line)) continue; // sequence number
    const trimmed = line.trim();
    if (trimmed.length === 0) continue; // blank separator
    out.push(trimmed);
  }

  // Join consecutive subtitle lines with spaces so it reads as flowing
  // speech rather than choppy fragments.
  return out.join(" ").replace(/\s+/g, " ").trim();
}

// Accepts either .srt or .txt content. TXT is treated as-is (paragraphs
// preserved); SRT is detected by the presence of timecode lines.
export function parseSubtitleFile(raw: string): string {
  if (TIMECODE_RE.test(raw) || /-->/.test(raw)) {
    return srtToText(raw);
  }
  return raw.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
