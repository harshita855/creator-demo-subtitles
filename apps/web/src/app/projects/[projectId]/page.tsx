"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProject, updateSegment, deleteSegment, addSegment } from "@/lib/apiClient";
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
    updates: { original_text?: string; translated_text?: string; start?: number; end?: number }
  ) {
    if (!project) return;
    try {
      const updated = await updateSegment(project.project_id, segmentId, updates);
      setProject({
        ...project,
        segments: project.segments
          .map((s) => (s.id === segmentId ? updated : s))
          .sort((a, b) => a.start - b.start),
      });
    } catch (err) {
      console.error("Failed to save segment:", err);
    }
  }

  async function handleDelete(segmentId: string) {
    if (!project) return;
    if (!confirm("Delete this subtitle segment?")) return;
    try {
      await deleteSegment(project.project_id, segmentId);
      setProject({
        ...project,
        segments: project.segments.filter((s) => s.id !== segmentId),
      });
    } catch (err) {
      console.error("Failed to delete segment:", err);
    }
  }

  async function handleAddSegment() {
    if (!project) return;
    const start = currentTime;
    const end = currentTime + 2;
    try {
      const created = await addSegment(project.project_id, {
        start,
        end,
        original_text: "New subtitle",
        translated_text: "New subtitle",
      });
      setProject({
        ...project,
        segments: [...project.segments, created].sort((a, b) => a.start - b.start),
      });
    } catch (err) {
      console.error("Failed to add segment:", err);
    }
  }

  const activeSegment = project?.segments.find(
    (s) => currentTime >= s.start && currentTime < s.end
  );

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-red-500">Couldn&apos;t load project: {error}</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p style={{ color: "var(--text-secondary)" }}>Loading project...</p>
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

        <div
          className="mt-6 rounded-2xl border p-4"
          style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <h2 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Export
          </h2>
          <div className="flex flex-wrap gap-2">
            {exportOptions.map((opt) => (
              <a key={opt.label}
                href={`${API_URL}/api/projects/${project.project_id}/export?language=${opt.language}&format=${opt.format}`}
                download
                className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
              >
                {opt.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Subtitles
          </h2>
          <button
            onClick={handleAddSegment}
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            + Add segment
          </button>
        </div>
        {project.segments.map((segment) => (
          <SubtitleSegmentRow
            key={segment.id}
            segment={segment}
            isActive={activeSegment?.id === segment.id}
            onSeek={handleSeek}
            onSave={(updates) => handleSave(segment.id, updates)}
            onDelete={() => handleDelete(segment.id)}
          />
        ))}
      </div>
    </main>
  );
}
