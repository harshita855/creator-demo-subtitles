import type { TranscriptionProvider, TranslationProvider } from "@subtitle-app/shared";
import { MockTranscriptionProvider } from "./transcription/mockTranscriptionProvider";
import { MockTranslationProvider } from "./translation/mockTranslationProvider";
import { GroqTranscriptionProvider } from "./transcription/groqTranscriptionProvider";
import { GroqTranslationProvider } from "./translation/groqTranslationProvider";

export function getTranscriptionProvider(): TranscriptionProvider {
  const providerName = process.env.ASR_PROVIDER ?? "mock";
  switch (providerName) {
    case "mock":
      return new MockTranscriptionProvider();
    case "groq":
      return new GroqTranscriptionProvider();
    default:
      throw new Error(`Unknown ASR_PROVIDER: "${providerName}"`);
  }
}

export function getTranslationProvider(): TranslationProvider {
  const providerName = process.env.TRANSLATION_PROVIDER ?? "mock";
  switch (providerName) {
    case "mock":
      return new MockTranslationProvider();
    case "groq":
      return new GroqTranslationProvider();
    default:
      throw new Error(`Unknown TRANSLATION_PROVIDER: "${providerName}"`);
  }
}
