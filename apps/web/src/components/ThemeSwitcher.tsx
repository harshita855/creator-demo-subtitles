"use client";

import { useTheme, type Theme } from "@/lib/ThemeProvider";

const OPTIONS: { value: Theme; label: string; dotClass: string }[] = [
  { value: "dark", label: "Dark", dotClass: "bg-black" },
  { value: "light", label: "Light", dotClass: "bg-white border border-gray-300" },
  { value: "beige", label: "Beige", dotClass: "bg-[#e6d9c0] border border-[#c9b98f]" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="fixed right-6 top-6 z-50 flex items-center gap-1 rounded-full border p-1"
      style={{ backgroundColor: "var(--pill-bg)", borderColor: "var(--card-border)" }}
    >
      {OPTIONS.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isActive ? "var(--accent-soft)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-secondary)",
              border: isActive ? "1px solid var(--accent)" : "1px solid transparent",
            }}
          >
            <span className={`h-3 w-3 rounded-full ${opt.dotClass}`} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
