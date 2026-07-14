export interface TranscriptSegment {
  start: number; 
  end: number;
  text: string;
}

export interface TranscriptionProvider {
  transcribe(mediaPath: string, sourceLanguage: string): Promise<TranscriptSegment[]>;
}