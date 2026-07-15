import fs from "node:fs";
import Groq from "groq-sdk";
import type { TranscriptionProvider, TranscriptSegment } from "@subtitle-app/shared";
import { ProviderError, isServiceUnavailableError } from "../../lib/providerError";

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

  async transcribe(
    mediaPath: string,
    sourceLanguage: string
  ): Promise<TranscriptSegment[]> {
    try {
      const response = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(mediaPath),
        model: "whisper-large-v3-turbo",
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
        language: sourceLanguage === "auto" ? undefined : sourceLanguage,
      });

      const segments = (response as unknown as { segments?: GroqSegment[] }).segments ?? [];
      return segments.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.text.trim(),
      }));
    } catch (err) {
      if (isServiceUnavailableError(err)) {
        throw new ProviderError(
          "E_ASR_UNAVAILABLE",
          "The transcription service is temporarily unavailable."
        );
      }
      throw err;
    }
  }
}
