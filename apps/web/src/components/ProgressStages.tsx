import type { JobStatus } from "@/lib/types";

const STAGES: { key: JobStatus; label: string }[] = [
  { key: "queued", label: "Queued" },
  { key: "extracting_audio", label: "Extracting audio" },
  { key: "transcribing", label: "Transcribing" },
  { key: "translating", label: "Translating" },
  { key: "formatting", label: "Formatting" },
  { key: "completed", label: "Completed" },
];

function getStageIndex(status: JobStatus): number {
  return STAGES.findIndex((s) => s.key === status);
}

export function ProgressStages({ status }: { status: JobStatus }) {
  const currentIndex = getStageIndex(status);
  const isFailed = status === "failed";

  return (
    <div className="flex flex-col gap-3">
      {STAGES.map((stage, index) => {
        const isDone = !isFailed && index < currentIndex;
        const isCurrent = !isFailed && index === currentIndex;

        return (
          <div key={stage.key} className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                isDone
                  ? "bg-green-500"
                  : isCurrent
                  ? "bg-blue-500 animate-pulse"
                  : "bg-gray-300"
              }`}
            />
            <span
              className={`text-sm ${
                isCurrent ? "font-semibold text-gray-900" : "text-gray-500"
              }`}
            >
              {stage.label}
            </span>
          </div>
        );
      })}
      {isFailed && (
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-sm font-semibold text-red-600">Failed</span>
        </div>
      )}
    </div>
  );
}