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
