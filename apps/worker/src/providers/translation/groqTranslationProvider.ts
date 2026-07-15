import Groq from "groq-sdk";
import type { TranslationProvider } from "@subtitle-app/shared";

// Maps ISO codes to full names - the model reasons much more
// reliably about "German" than about the bare code "de", especially
// for short, ambiguous phrases where the code alone isn't enough
// context to pin down the target language confidently.
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

    const completion = await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // lower than before - short/ambiguous lines are exactly where language drift happens
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

    const result = completion.choices[0]?.message?.content?.trim() ?? text;
    return result;
  }
}
