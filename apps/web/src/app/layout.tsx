import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { NavBar } from "@/components/NavBar";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Subtitle Studio",
  description: "Upload, transcribe, translate, edit, and export subtitles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className={baloo.className}>
        <ThemeProvider>
          <NavBar />
          <ThemeSwitcher />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
