"use client";

const LANGUAGES = [
  { code: "auto", label: "Auto-detect" },
  { code: "en", label: "English" },
  { code: "vi", label: "Vietnamese" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
];

interface LanguageSelectProps {
  label: string;
  value: string;
  onChange: (code: string) => void;
  excludeAuto?: boolean;
}

export function LanguageSelect({
  label,
  value,
  onChange,
  excludeAuto,
}: LanguageSelectProps) {
  const options = excludeAuto
    ? LANGUAGES.filter((l) => l.code !== "auto")
    : LANGUAGES;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-4 py-2.5 text-sm font-medium focus:outline-none"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
      >
        {options.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
