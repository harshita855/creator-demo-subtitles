"use client";

import { useState } from "react";
import type { SubtitleSegment } from "@/lib/types";

interface SubtitleSegmentRowProps {
  segment: SubtitleSegment;
  isActive: boolean;
  onSeek: (time: number) => void;
  onSave: (updates: { original_text?: string; translated_text?: string }) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}

export function SubtitleSegmentRow({
  segment,
  isActive,
  onSeek,
  onSave,
}: SubtitleSegmentRowProps) {
  const [originalText, setOriginalText] = useState(segment.originalText);
  const [translatedText, setTranslatedText] = useState(segment.translatedText);

  return (
    <div
      className="cursor-pointer rounded-xl border p-3 transition-colors"
      style={{
        borderColor: isActive ? "var(--accent)" : "var(--card-border)",
        backgroundColor: isActive ? "var(--accent-soft)" : "var(--card-bg)",
      }}
      onClick={() => onSeek(segment.startTime)}
    >
      <div className="mb-2 text-xs font-semibold" style={{ color: "var(--accent)" }}>
        {formatTime(segment.startTime)} &rarr; {formatTime(segment.endTime)}
      </div>

      <textarea
        className="mb-2 w-full resize-none rounded-lg border p-2 text-sm focus:outline-none"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
        rows={2}
        value={originalText}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setOriginalText(e.target.value)}
        onBlur={() => {
          if (originalText !== segment.originalText) {
            onSave({ original_text: originalText });
          }
        }}
      />

      <textarea
        className="w-full resize-none rounded-lg border p-2 text-sm focus:outline-none"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-secondary)",
        }}
        rows={2}
        value={translatedText}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setTranslatedText(e.target.value)}
        onBlur={() => {
          if (translatedText !== segment.translatedText) {
            onSave({ translated_text: translatedText });
          }
        }}
      />
    </div>
  );
}
