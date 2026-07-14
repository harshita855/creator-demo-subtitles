import Groq from "groq-sdk";
import type { TranslationProvider } from "@subtitle-app/shared";

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
    const completion = await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2, // low temperature - we want faithful translation, not creative variation
      messages: [
        {
          role: "system",
          content:
            "You are a professional subtitle translator. Translate the given text " +
            "faithfully, preserving tone and meaning. Output ONLY the translated " +
            "text, no explanations, no quotes, no additional commentary.",
        },
        {
          role: "user",
          content: `Translate this text from ${sourceLanguage} to ${targetLanguage}:\n\n${text}`,
        },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() ?? text;
  }
}
