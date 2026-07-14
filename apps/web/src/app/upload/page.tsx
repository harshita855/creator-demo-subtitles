"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileDropzone } from "@/components/FileDropzone";
import { LanguageSelect } from "@/components/LanguageSelect";
import { uploadFile, createJob } from "@/lib/apiClient";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translate, setTranslate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const upload = await uploadFile(file);
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
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">
          Upload your video
        </h1>

        <FileDropzone onFileSelected={setFile} selectedFile={file} />

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

        <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={translate}
            onChange={(e) => setTranslate(e.target.checked)}
          />
          Translate subtitles (uncheck for transcription only)
        </label>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !file}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "Uploading..." : "Upload and process"}
        </button>
      </div>
    </main>
  );
}
