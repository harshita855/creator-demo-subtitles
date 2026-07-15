"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDropzone } from "@/components/FileDropzone";
import { LanguageSelect } from "@/components/LanguageSelect";
import { uploadFile, uploadYoutubeUrl, createJob } from "@/lib/apiClient";

type Source = "file" | "youtube";

export default function UploadPage() {
  const router = useRouter();
  const [source, setSource] = useState<Source>("file");
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translate, setTranslate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = source === "file" ? !!file : youtubeUrl.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) {
      setError(source === "file" ? "Please choose a file first." : "Please paste a YouTube URL first.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setUploadProgress(source === "file" ? 0 : null);

    try {
      const upload =
        source === "file"
          ? await uploadFile(file!, (percent) => setUploadProgress(percent))
          : await uploadYoutubeUrl(youtubeUrl.trim());

      const job = await createJob({
        upload_id: upload.upload_id,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        translate,
      });
      router.push(`/jobs/${job.job_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 pb-24 pt-20">
      <div className="mb-6 w-full max-w-lg text-center">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
          Video → Subtitles
        </p>
        <h1 className="mt-1 text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
          Upload your video
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          We&apos;ll transcribe it, translate it, and hand you an editable subtitle track.
        </p>
      </div>

      <div
        className="w-full max-w-lg rounded-2xl border p-8"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >

        <div
          className="mb-6 flex gap-1 rounded-full border p-1"
          style={{ borderColor: "var(--card-border)" }}
        >
          {(["file", "youtube"] as Source[]).map((opt) => {
            const isActive = source === opt;
            return (
              <button
                key={opt}
                onClick={() => setSource(opt)}
                disabled={isSubmitting}
                className="flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                }}
              >
                {opt === "file" ? "Upload a file" : "Paste YouTube URL"}
              </button>
            );
          })}
        </div>

        {source === "file" ? (
          <FileDropzone onFileSelected={setFile} selectedFile={file} />
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              YouTube URL
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              Works with regular videos and Shorts. Downloaded and processed on our server.
            </p>
          </div>
        )}

        {/* Upload progress bar - only meaningful for direct file uploads,
            since YouTube imports download server-side with nothing to
            report client-side until the API responds. */}
        {uploadProgress !== null && (
          <div className="mt-4">
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "var(--input-border)" }}
            >
              <div
                className="h-full transition-all duration-200"
                style={{ width: `${uploadProgress}%`, backgroundColor: "var(--accent)" }}
              />
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : "Upload complete, starting processing..."}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <LanguageSelect
            label="Spoken language"
            value={sourceLanguage}
            onChange={setSourceLanguage}
          />
          <LanguageSelect
            label="Translate to"
            value={targetLanguage}
            onChange={setTargetLanguage}
            excludeAuto
          />
        </div>

        <label
          className="mt-4 flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          <input
            type="checkbox"
            checked={translate}
            onChange={(e) => setTranslate(e.target.checked)}
          />
          Translate subtitles (uncheck for transcription only)
        </label>

        {error && (
          <p className="mt-4 text-sm font-medium text-red-500">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          className="mt-6 w-full rounded-full px-4 py-3 text-sm font-bold text-white transition-transform disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {isSubmitting ? "Processing..." : "Upload and process"}
        </button>
      </div>

      <p className="mt-6 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
        Just want to turn text into speech?{" "}
        <Link href="/tts" className="font-semibold underline" style={{ color: "var(--accent)" }}>
          Open the TTS studio
        </Link>
      </p>
    </main>
  );
}
