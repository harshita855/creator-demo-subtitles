import type { TranscriptionProvider, TranscriptSegment } from "@subtitle-app/shared";

export class MockTranscriptionProvider implements TranscriptionProvider {
  async transcribe(
    _mediaPath: string,
    _sourceLanguage: string
  ): Promise<TranscriptSegment[]> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    return [
      { start: 0.0, end: 2.5, text: "Hello and welcome to this video." },
      { start: 2.5, end: 5.2, text: "Today we're going to talk about subtitles." },
      { start: 5.2, end: 8.0, text: "Thanks for watching, see you next time." },
    ];
  }
}
