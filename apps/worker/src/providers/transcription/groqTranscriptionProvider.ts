import fs from "node:fs";
import Groq from "groq-sdk";
import type { TranscriptionProvider, TranscriptSegment } from "@subtitle-app/shared";

interface GroqSegment {
  start: number;
  end: number;
  text: string;
}

export class GroqTranscriptionProvider implements TranscriptionProvider {
  private client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  // mediaPath here is a local file path to the already-extracted
  // audio WAV file (see processJob.ts), not the upload ID.
  async transcribe(
    mediaPath: string,
    sourceLanguage: string
  ): Promise<TranscriptSegment[]> {
    const response = await this.client.audio.transcriptions.create({
      file: fs.createReadStream(mediaPath),
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
      // Groq/Whisper wants an ISO 639-1 code or omitted entirely for
      // auto-detect - "auto" isn't a real code, so we translate it.
      language: sourceLanguage === "auto" ? undefined : sourceLanguage,
    });

    const segments = (response as unknown as { segments?: GroqSegment[] }).segments ?? [];

    return segments.map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));
  }
}
