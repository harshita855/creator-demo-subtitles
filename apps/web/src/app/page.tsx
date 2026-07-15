import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 pb-24 pt-24">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold sm:text-5xl" style={{ color: "var(--text-primary)" }}>
          Subtitle Studio
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: "var(--text-secondary)" }}>
          Subtitle any video with real AI transcription and translation — or turn text and subtitle
          files into natural speech. Two tools, one studio.
        </p>
      </div>

      {/* Two co-equal entry points */}
      <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        <ToolCard
          href="/upload"
          eyebrow="Video → Subtitles"
          title="Subtitle a video"
          body="Upload a video, auto-transcribe and translate, edit inline, and export .srt / .txt."
          cta="Upload a video"
        />
        <ToolCard
          href="/tts"
          eyebrow="Text → Speech"
          title="Text to Speech"
          body="Paste text or drop an .srt / .txt file, pick a voice and language, and generate audio."
          cta="Open TTS studio"
          highlight
        />
      </div>

      {/* How it works */}
      <div
        className="mt-10 w-full max-w-3xl rounded-2xl border p-8"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
          How it works
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {["Upload or paste", "Transcribe & translate", "Review and edit", "Export or voice it"].map(
            (step, i) => (
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
            )
          )}
        </div>
      </div>
    </main>
  );
}

function ToolCard({
  href,
  eyebrow,
  title,
  body,
  cta,
  highlight,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border p-7 text-left transition-transform hover:scale-[1.02]"
      style={{
        backgroundColor: highlight ? "var(--accent-soft)" : "var(--card-bg)",
        borderColor: highlight ? "var(--accent)" : "var(--card-border)",
      }}
    >
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
        {eyebrow}
      </span>
      <h2 className="mt-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      <p className="mt-2 flex-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        {body}
      </p>
      <span
        className="mt-5 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {cta} →
      </span>
    </Link>
  );
}
