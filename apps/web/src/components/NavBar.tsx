"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/upload", label: "Subtitle" },
  { href: "/tts", label: "Text to Speech" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-6 top-6 z-50 flex items-center gap-1 rounded-full border p-1"
      style={{ backgroundColor: "var(--pill-bg)", borderColor: "var(--card-border)" }}
    >
      <Link
        href="/"
        className="rounded-full px-3 py-1.5 text-sm font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        🎬 Studio
      </Link>
      {LINKS.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isActive ? "var(--accent-soft)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-secondary)",
              border: isActive ? "1px solid var(--accent)" : "1px solid transparent",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
