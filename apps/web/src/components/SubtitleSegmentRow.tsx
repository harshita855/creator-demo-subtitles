"use client";

import { useState } from "react";
import type { SubtitleSegment } from "@/lib/types";

interface SubtitleSegmentRowProps {
  segment: SubtitleSegment;
  isActive: boolean;
  onSeek: (time: number) => void;
  onSave: (updates: {
    original_text?: string;
    translated_text?: string;
    start?: number;
    end?: number;
  }) => void;
  onDelete: () => void;
}

export function SubtitleSegmentRow({
  segment,
  isActive,
  onSeek,
  onSave,
  onDelete,
}: SubtitleSegmentRowProps) {
  const [originalText, setOriginalText] = useState(segment.original_text);
  const [translatedText, setTranslatedText] = useState(segment.translated_text);
  const [startTime, setStartTime] = useState(segment.start.toString());
  const [endTime, setEndTime] = useState(segment.end.toString());
  const [timeError, setTimeError] = useState<string | null>(null);

  function handleTimeBlur() {
    const newStart = parseFloat(startTime);
    const newEnd = parseFloat(endTime);

    if (isNaN(newStart) || isNaN(newEnd)) {
      setTimeError("Timestamps must be numbers.");
      return;
    }
    if (newStart < 0 || newEnd < 0) {
      setTimeError("Timestamps can't be negative.");
      return;
    }
    if (newStart >= newEnd) {
      setTimeError("Start must be before end.");
      return;
    }

    setTimeError(null);
    if (newStart !== segment.start || newEnd !== segment.end) {
      onSave({ start: newStart, end: newEnd });
    }
  }

  return (
    <div
      className="cursor-pointer rounded-2xl border p-4 transition-colors"
      style={{
        borderColor: isActive ? "var(--accent)" : "var(--card-border)",
        backgroundColor: isActive ? "var(--accent-soft)" : "var(--card-bg)",
      }}
      onClick={() => onSeek(segment.start)}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            value={startTime}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setStartTime(e.target.value)}
            onBlur={handleTimeBlur}
            className="w-16 rounded-lg border px-2 py-1 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--text-secondary)",
            }}
          />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            &rarr;
          </span>
          <input
            type="number"
            step="0.1"
            value={endTime}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setEndTime(e.target.value)}
            onBlur={handleTimeBlur}
            className="w-16 rounded-lg border px-2 py-1 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--text-secondary)",
            }}
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-full px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
          title="Delete this segment"
        >
          Delete
        </button>
      </div>

      {timeError && (
        <p className="mb-2 text-xs font-medium text-red-500">{timeError}</p>
      )}

      <textarea
        className="mb-2 w-full resize-none rounded-xl border p-2 text-sm focus:outline-none"
        rows={2}
        value={originalText}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setOriginalText(e.target.value)}
        onBlur={() => {
          if (originalText !== segment.original_text) {
            onSave({ original_text: originalText });
          }
        }}
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
      />
      <textarea
        className="w-full resize-none rounded-xl border p-2 text-sm focus:outline-none"
        rows={2}
        value={translatedText}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setTranslatedText(e.target.value)}
        onBlur={() => {
          if (translatedText !== segment.translated_text) {
            onSave({ translated_text: translatedText });
          }
        }}
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
          color: "var(--text-secondary)",
        }}
      />
    </div>
  );
}
