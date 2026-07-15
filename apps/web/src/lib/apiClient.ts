import type { JobStatusResponse, ProjectResponse, SubtitleSegment, TtsOptions, SynthesizeParams } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed with status ${res.status}`);
  }
  return res.json();
}

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

// Uses XMLHttpRequest instead of fetch() specifically because fetch's
// request body has no progress event - XHR's upload.onprogress is the
// only standard browser API that reports real bytes-sent progress
// during an upload, which is what the spec's "upload progress"
// requirement needs.
export function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CreateUploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/uploads`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let message = `Upload failed with status ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText);
          message = body?.error?.message ?? message;
        } catch {
          // response wasn't JSON - keep the generic message
        }
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed due to a network error."));

    xhr.send(formData);
  });
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

export async function deleteSegment(projectId: string, segmentId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/segments/${segmentId}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Delete failed with status ${res.status}`);
  }
}

export async function addSegment(
  projectId: string,
  data: { start: number; end: number; original_text: string; translated_text: string }
): Promise<SubtitleSegment> {
  const res = await fetch(`${API_URL}/api/projects/${projectId}/segments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Add segment failed with status ${res.status}`);
  }
  return res.json();
}

// --- Text-to-speech ---

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
