"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { fetchTtsOptions, synthesizeSpeech } from "@/lib/apiClient";
import { parseSubtitleFile } from "@/lib/srtParse";
import type { TtsOptions } from "@/lib/types";

interface TtsStudioProps {
  // Pre-fill the text box (used when "Voice this" hands subtitles over
  // from the editor).
  initialText?: string;
}

export function TtsStudio({ initialText = "" }: TtsStudioProps) {
  const [options, setOptions] = useState<TtsOptions | null>(null);
  const [text, setText] = useState(initialText);
  const [voiceId, setVoiceId] = useState("");
  const [modelId, setModelId] = useState("");
  const [languageCode, setLanguageCode] = useState("auto");
  const [speed, setSpeed] = useState(1);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetchTtsOptions()
      .then((opts) => {
        setOptions(opts);
        setVoiceId(opts.defaultVoiceId);
        setModelId(opts.defaultModelId);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load voices.")
      );
  }, []);

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  // Revoke the previous object URL whenever it changes / on unmount.
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const maxChars = options?.maxChars ?? 5000;
  const overLimit = text.length > maxChars;

  const loadFile = useCallback(async (file: File) => {
    setError(null);
    const name = file.name.toLowerCase();
    if (!name.endsWith(".srt") && !name.endsWith(".txt")) {
      setError("Please choose a .srt or .txt file.");
      return;
    }
    const raw = await file.text();
    setText(parseSubtitleFile(raw));
  }, []);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void loadFile(file);
  }

  async function handleGenerate() {
    if (!text.trim()) {
      setError("Enter some text, or upload an SRT/TXT file.");
      return;
    }
    if (overLimit) {
      setError(`Text is too long. The limit is ${maxChars.toLocaleString()} characters.`);
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const { blob, creditsUsed } = await synthesizeSpeech({
        text,
        voiceId,
        modelId,
        languageCode,
        speed,
      });
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
      setCredits(creditsUsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  }

  const fieldStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="w-full rounded-2xl border p-6 sm:p-8"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      {/* Text input + file drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className="relative rounded-xl border-2 border-dashed transition-colors"
        style={{
          borderColor: isDragging ? "var(--accent)" : "var(--input-border)",
          backgroundColor: isDragging ? "var(--accent-soft)" : "transparent",
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Type or paste text to speak — or drop an .srt / .txt file here…"
          className="w-full resize-none rounded-xl bg-transparent p-4 text-sm focus:outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <label
            className="cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
            style={fieldStyle}
          >
            Upload .srt / .txt
            <input type="file" accept=".srt,.txt" className="hidden" onChange={handleFileInput} />
          </label>
          <span
            className="text-xs font-medium"
            style={{ color: overLimit ? "#ef4444" : "var(--text-secondary)" }}
          >
            {text.length.toLocaleString()} / {maxChars.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Voice">
          <select
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
            style={fieldStyle}
          >
            {options?.voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.description}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Language">
          <select
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value)}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
            style={fieldStyle}
          >
            {options?.languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Model">
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
            style={fieldStyle}
          >
            {options?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.description}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Speed — ${speed.toFixed(2)}×`}>
          <input
            type="range"
            min={0.7}
            max={1.2}
            step={0.05}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "var(--accent)" }}
          />
        </Field>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !options || overLimit}
        className="mt-5 w-full rounded-full px-4 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {isGenerating ? "Generating speech…" : "🔊 Generate speech"}
      </button>

      {audioUrl && (
        <div
          className="mt-5 rounded-xl border p-4"
          style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--input-border)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Your audio
            </p>
            {credits && (
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {credits} credits used
              </span>
            )}
          </div>
          <audio src={audioUrl} controls className="w-full" />
          <a
            href={audioUrl}
            download="speech.mp3"
            className="mt-3 inline-block rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors"
            style={fieldStyle}
          >
            ⬇ Download MP3
          </a>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
