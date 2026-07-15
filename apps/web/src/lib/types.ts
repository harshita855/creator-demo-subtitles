export type JobStatus =
  | "queued"
  | "uploading"
  | "extracting_audio"
  | "transcribing"
  | "translating"
  | "formatting"
  | "completed"
  | "failed";

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  error: { code: string; message: string } | null;
  project_id: string | null;
}

// Matches the spec's exact API shape (§7) - snake_case, matching what
// the backend now actually returns from GET/POST/PATCH on segments.
export interface SubtitleSegment {
  id: string;
  start: number;
  end: number;
  original_text: string;
  translated_text: string;
}

export interface ProjectResponse {
  project_id: string;
  video_url: string;
  source_language: string;
  target_language: string;
  segments: SubtitleSegment[];
}

export interface TtsVoice {
  id: string;
  name: string;
  description: string;
}

export interface TtsModel {
  id: string;
  name: string;
  description: string;
}

export interface TtsLanguage {
  code: string;
  label: string;
}

export interface TtsOptions {
  voices: TtsVoice[];
  models: TtsModel[];
  languages: TtsLanguage[];
  maxChars: number;
  defaultVoiceId: string;
  defaultModelId: string;
}

export interface SynthesizeParams {
  text: string;
  voiceId: string;
  modelId: string;
  languageCode?: string;
  speed?: number;
}
