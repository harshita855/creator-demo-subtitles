"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TtsStudio } from "@/components/TtsStudio";

const HANDOFF_KEY = "tts:handoff-text";

export default function TtsPage() {
  const [initialText, setInitialText] = useState("");

  // If the user clicked "Voice this" in the editor, the subtitle text was
  // stashed in sessionStorage — pick it up once, then clear it.
  useEffect(() => {
    try {
      const stashed = sessionStorage.getItem(HANDOFF_KEY);
      if (stashed) {
        setInitialText(stashed);
        sessionStorage.removeItem(HANDOFF_KEY);
      }
    } catch {
      // sessionStorage unavailable — no handoff, no problem.
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 pb-24 pt-20">
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
          Text to Speech
        </p>
        <h1 className="mt-1 text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
          Turn text into natural speech
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Paste text, or drop in an <strong>.srt</strong> / <strong>.txt</strong> file — pick a voice
          and language, and generate downloadable audio.
        </p>
      </div>

      <TtsStudio initialText={initialText} />

      <div
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        style={{ color: "var(--text-secondary)" }}
      >
        <InfoCard title="30+ languages">
          English, Hindi, Vietnamese, Spanish, Tamil, Arabic, Chinese and more — or let it auto-detect.
        </InfoCard>
        <InfoCard title="17 voices">
          A range of male, female and neutral voices across British, American and Australian accents.
        </InfoCard>
        <InfoCard title="Up to 5,000 chars">
          Per generation. Longer subtitle files can be split across a few runs.
        </InfoCard>
      </div>

      <p className="mt-8 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
        Came here to subtitle a video instead?{" "}
        <Link href="/upload" className="font-semibold underline" style={{ color: "var(--accent)" }}>
          Upload a video
        </Link>
      </p>
    </main>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed">{children}</p>
    </div>
  );
}
