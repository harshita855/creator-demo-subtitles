import Link from "next/link";

const LANGUAGES = [
  "English", "Hindi", "Vietnamese", "Spanish", "French",
  "German", "Japanese", "Chinese", "Arabic",
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 pb-24 pt-24">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold" style={{ color: "var(--text-primary)" }}>
          Subtitle Studio
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          Upload a video, get real subtitles, edit anything that&apos;s off — powered by real AI transcription and translation.
        </p>

        <Link
          href="/upload"
          className="mt-8 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Upload a video
        </Link>
      </div>

      <div
        className="mt-16 w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: "var(--text-secondary)" }}
        >
          How it works
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            "Upload a video",
            "Auto transcribe & translate",
            "Review and edit",
            "Export subtitles",
          ].map((step, i) => (
            <div key={step} className="flex flex-col gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {i + 1}
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-6 w-full max-w-2xl rounded-2xl border p-8"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          9+ languages supported
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
          Auto-detects spoken language and translates into any of the following.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <span
              key={lang}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            >
              {lang}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
