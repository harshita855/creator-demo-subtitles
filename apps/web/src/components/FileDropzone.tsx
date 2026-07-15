"use client";

import { useCallback, useState, type DragEvent, type ChangeEvent } from "react";

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
}

export function FileDropzone({ onFileSelected, selectedFile }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors"
      style={{
        borderColor: isDragging ? "var(--accent)" : "var(--input-border)",
        backgroundColor: isDragging ? "var(--accent-soft)" : "var(--input-bg)",
      }}
    >
      {selectedFile ? (
        <>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {selectedFile.name}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Drag and drop a video or audio file here
          </p>
          <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
            MP4, MOV, WEBM, MP3, WAV, M4A
          </p>
        </>
      )}

      <label
        className="mt-2 cursor-pointer rounded-full border px-5 py-2 text-sm font-semibold transition-colors"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--card-bg)",
          color: "var(--text-primary)",
        }}
      >
        Choose file
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/x-m4a"
          className="hidden"
          onChange={handleFileInput}
        />
      </label>
    </div>
  );
}
