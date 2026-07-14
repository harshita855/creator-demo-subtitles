"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useJobStatus } from "@/lib/hooks/useJobStatus";
import { ProgressStages } from "@/components/ProgressStages";

export default function JobStatusPage() {
  const params = useParams<{ jobId: string }>();
  const { data, error } = useJobStatus(params.jobId);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="w-full max-w-md rounded-lg border border-gray-200 p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">
          Processing your video
        </h1>

        {error && (
          <p className="mb-4 text-sm text-red-600">
            Couldn&apos;t reach the server: {error}
          </p>
        )}

        {!data && !error && (
          <p className="text-sm text-gray-500">Loading job status...</p>
        )}

        {data && (
          <>
            <ProgressStages status={data.status} />

            <div className="mt-6">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">{data.progress}% complete</p>
            </div>

            {data.status === "completed" && data.project_id && (
              <div className="mt-6 flex flex-col gap-3">
                <p className="text-sm text-green-700">
                  Done! Your subtitles are ready.
                </p>
                <Link
                  href={`/projects/${data.project_id}`}
                  className="rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  View &amp; edit subtitles
                </Link>
              </div>
            )}

            {data.error && (
              <p className="mt-6 text-sm text-red-600">{data.error.message}</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
