import type { ErrorCode } from "@subtitle-app/shared";

// Lets provider code (and the job timeout) throw an error carrying a
// specific spec-required code, instead of everything collapsing into
// the generic E_JOB_WORKER_FAILURE fallback in worker.ts's failure
// handler. Any error NOT thrown as a ProviderError still falls back
// to that generic code, which is the correct behavior for genuinely
// unexpected failures we haven't specifically classified.
export class ProviderError extends Error {
  public readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ProviderError";
  }
}

// Detects network-level/service-unavailable failures (connection
// refused, timeout, 5xx, or a 429 that persists despite our own
// rate-limiting) versus other error types (like a genuinely malformed
// request), which shouldn't be reported as "service unavailable."
export function isServiceUnavailableError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { status?: number; code?: string };
  if (e.status !== undefined && (e.status >= 500 || e.status === 429)) return true;
  if (e.code === "ECONNREFUSED" || e.code === "ETIMEDOUT" || e.code === "ENOTFOUND") return true;
  return false;
}
