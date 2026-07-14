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
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
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
