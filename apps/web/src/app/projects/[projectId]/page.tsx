"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchProject, updateSegment, deleteSegment, addSegment } from "@/lib/apiClient";
import type { ProjectResponse } from "@/lib/types";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SubtitleSegmentRow } from "@/components/SubtitleSegmentRow";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HANDOFF_KEY = "tts:handoff-text";

export default function EditorPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
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

  // "Voice this": stash the chosen subtitle text and open the TTS studio,
  // which auto-loads it. No re-upload needed.
  function voiceThis(which: "original" | "translated") {
    if (!project) return;
    const text = project.segments
      .map((s) => (which === "translated" ? s.translated_text : s.original_text))
      .filter((t) => t && t.trim().length > 0)
      .join(" ");
    try {
      sessionStorage.setItem(HANDOFF_KEY, text);
    } catch {
      /* ignore */
    }
    router.push("/tts");
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

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderColor: "var(--card-border)",
  };
  const pillStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--text-primary)",
  };

  return (
    <main className="grid min-h-screen grid-cols-1 gap-6 px-6 pb-16 pt-20 md:grid-cols-2">
      <div className="flex flex-col gap-6">
        <VideoPlayer ref={videoRef} src={project.video_url} />

        {/* Text to speech */}
        <div className="rounded-2xl border p-5" style={cardStyle}>
          <h2 className="mb-1 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            🔊 Text to speech
          </h2>
          <p className="mb-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            Send these subtitles to the TTS studio and generate spoken audio.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => voiceThis("original")}
              className="rounded-full px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Voice original &rarr;
            </button>
            <button
              onClick={() => voiceThis("translated")}
              className="rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
              style={pillStyle}
            >
              Voice translation &rarr;
            </button>
          </div>
        </div>

        {/* Export */}
        <div className="rounded-2xl border p-5" style={cardStyle}>
          <h2 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Export
          </h2>
          <div className="flex flex-wrap gap-2">
            {exportOptions.map((opt) => (
              
              <a
                key={opt.label}
                href={`${API_URL}/api/projects/${project.project_id}/export?language=${opt.language}&format=${opt.format}`}
                download
                className="rounded-full border px-4 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                style={pillStyle}
              >
                {opt.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:max-h-screen md:overflow-y-auto">
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
