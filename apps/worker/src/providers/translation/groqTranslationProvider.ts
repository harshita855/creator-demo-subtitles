import Groq from "groq-sdk";
import type { TranslationProvider } from "@subtitle-app/shared";
import { ProviderError, isServiceUnavailableError } from "../../lib/providerError";

const LANGUAGE_NAMES: Record<string, string> = {
  auto: "the detected source language",
  en: "English",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  zh: "Chinese",
  ar: "Arabic",
  vi: "Vietnamese",
};

function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

export class GroqTranslationProvider implements TranslationProvider {
  private client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    const targetName = languageName(targetLanguage);
    const sourceName = languageName(sourceLanguage);

    try {
      const completion = await this.client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              `You are a professional subtitle translator. You translate from ${sourceName} into ${targetName}, and ONLY into ${targetName} - never any other language, even if the input is ambiguous or very short. ` +
              `Preserve tone and meaning faithfully. Output ONLY the ${targetName} translation, nothing else - no explanations, no quotes, no labels, and absolutely no text in any language other than ${targetName}.`,
          },
          {
            role: "user",
            content:
              `Translate the following subtitle line into ${targetName}. Respond with ONLY the ${targetName} text:\n\n${text}`,
          },
        ],
      });

      return completion.choices[0]?.message?.content?.trim() ?? text;
    } catch (err) {
      if (isServiceUnavailableError(err)) {
        throw new ProviderError(
          "E_TRANSLATION_UNAVAILABLE",
          "The translation service is temporarily unavailable."
        );
      }
      throw err;
    }
  }
}
