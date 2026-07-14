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
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
        isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"
      }`}
    >
      {selectedFile ? (
        <>
          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
          <p className="text-xs text-gray-500">
            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Drag and drop a video or audio file here
          </p>
          <p className="text-xs text-gray-400">MP4, MOV, WEBM, MP3, WAV, M4A</p>
        </>
      )}

      <label className="mt-2 cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600">
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
