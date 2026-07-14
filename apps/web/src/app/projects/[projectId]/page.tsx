"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProject, updateSegment } from "@/lib/apiClient";
import type { ProjectResponse } from "@/lib/types";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SubtitleSegmentRow } from "@/components/SubtitleSegmentRow";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function EditorPage() {
  const params = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchProject(params.projectId)
      .then(setProject)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load project.")
      );
  }, [params.projectId]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    function handleTimeUpdate() {
      setCurrentTime(videoEl!.currentTime);
    }

    videoEl.addEventListener("timeupdate", handleTimeUpdate);
    return () => videoEl.removeEventListener("timeupdate", handleTimeUpdate);
  }, [project]);

  function handleSeek(time: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  }

  async function handleSave(
    segmentId: string,
    updates: { original_text?: string; translated_text?: string }
  ) {
    if (!project) return;
    try {
      const updated = await updateSegment(project.project_id, segmentId, updates);
      setProject({
        ...project,
        segments: project.segments.map((s) => (s.id === segmentId ? updated : s)),
      });
    } catch (err) {
      console.error("Failed to save segment:", err);
    }
  }

  const activeSegment = project?.segments.find(
    (s) => currentTime >= s.startTime && currentTime < s.endTime
  );

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-red-600">Couldn&apos;t load project: {error}</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-gray-500">Loading project...</p>
      </main>
    );
  }

  const exportOptions: { label: string; language: string; format: string }[] = [
    { label: "Original (.srt)", language: "original", format: "srt" },
    { label: "Translated (.srt)", language: "translated", format: "srt" },
    { label: "Bilingual (.srt)", language: "bilingual", format: "srt" },
    { label: "Original (.txt)", language: "original", format: "txt" },
    { label: "Translated (.txt)", language: "translated", format: "txt" },
  ];

  return (
    <main className="grid min-h-screen grid-cols-1 gap-6 p-6 md:grid-cols-2">
      <div>
        <VideoPlayer ref={videoRef} src={project.video_url} />

        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Export</h2>
          <div className="flex flex-wrap gap-2">
            {exportOptions.map((opt) => (
              
              <a
                key={opt.label}
                href={`${API_URL}/api/projects/${project.project_id}/export?language=${opt.language}&format=${opt.format}`}
                download
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600"
              >
                {opt.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900">Subtitles</h2>
        {project.segments.map((segment) => (
          <SubtitleSegmentRow
            key={segment.id}
            segment={segment}
            isActive={activeSegment?.id === segment.id}
            onSeek={handleSeek}
            onSave={(updates) => handleSave(segment.id, updates)}
          />
        ))}
      </div>
    </main>
  );
}
