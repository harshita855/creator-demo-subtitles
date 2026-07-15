import type { JobStatusResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed with status ${res.status}`);
  }
  return res.json();
}
import type { ProjectResponse, SubtitleSegment } from "./types";

export async function fetchProject(projectId: string): Promise<ProjectResponse> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function updateSegment(
  projectId: string,
  segmentId: string,
  updates: Partial<{
    start: number;
    end: number;
    original_text: string;
    translated_text: string;
  }>
): Promise<SubtitleSegment> {
  const res = await fetch(
    `${API_URL}/api/projects/${projectId}/segments/${segmentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed with status ${res.status}`);
  }
  return res.json();
}

export interface CreateUploadResponse {
  upload_id: string;
  filename: string;
  status: string;
}

export async function uploadFile(file: File): Promise<CreateUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/uploads`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Upload failed with status ${res.status}`);
  }
  return res.json();
}

export interface CreateJobResponse {
  job_id: string;
  status: string;
}

export async function createJob(params: {
  upload_id: string;
  source_language: string;
  target_language: string;
  translate: boolean;
}): Promise<CreateJobResponse> {
  const res = await fetch(`${API_URL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Job creation failed with status ${res.status}`);
  }
  return res.json();
}

export async function uploadYoutubeUrl(url: string): Promise<CreateUploadResponse> {
  const res = await fetch(`${API_URL}/api/uploads/youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `YouTube import failed with status ${res.status}`);
  }
  return res.json();
}

// --- Text-to-speech ---
import type { TtsOptions, SynthesizeParams } from "./types";

export async function fetchTtsOptions(): Promise<TtsOptions> {
  const res = await fetch(`${API_URL}/api/tts/options`);
  if (!res.ok) {
    throw new Error(`Failed to load speech options (status ${res.status}).`);
  }
  return res.json();
}

export interface SynthesizeResult {
  blob: Blob;
  creditsUsed: string | null;
}

export async function synthesizeSpeech(
  params: SynthesizeParams
): Promise<SynthesizeResult> {
  const res = await fetch(`${API_URL}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Speech generation failed (status ${res.status}).`);
  }
  return {
    blob: await res.blob(),
    creditsUsed: res.headers.get("x-credits-used"),
  };
}
