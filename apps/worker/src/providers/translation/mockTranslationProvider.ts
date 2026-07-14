import type { TranslationProvider } from "@subtitle-app/shared";

export class MockTranslationProvider implements TranslationProvider {
  async translate(
    text: string,
    _sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return `[${targetLanguage}] ${text}`;
  }
}
