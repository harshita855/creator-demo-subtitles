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

export interface SubtitleSegment {
  id: string;
  projectId: string;
  sequenceNumber: number;
  startTime: number;
  endTime: number;
  originalText: string;
  translatedText: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  project_id: string;
  video_url: string;
  source_language: string;
  target_language: string;
  segments: SubtitleSegment[];
}
