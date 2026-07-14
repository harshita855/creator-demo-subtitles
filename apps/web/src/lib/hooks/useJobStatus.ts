import { useEffect, useState } from "react";
import { fetchJobStatus } from "../apiClient";
import type { JobStatusResponse } from "../types";

const POLL_INTERVAL_MS = 2000;
const TERMINAL_STATUSES = new Set(["completed", "failed"]);

export function useJobStatus(jobId: string) {
  const [data, setData] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const result = await fetchJobStatus(jobId);
        if (cancelled) return;
        setData(result);
        setError(null);

        if (!TERMINAL_STATUSES.has(result.status)) {
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to fetch job status.");
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [jobId]);

  return { data, error };
}