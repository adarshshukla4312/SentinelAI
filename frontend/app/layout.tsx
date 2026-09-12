import type { Metadata } from "next";
import "./globals.css";
import { CollapsibleLiquidHeader } from "@/components/ui/liquid-glass";

export const metadata: Metadata = {
  title: "SentinelAI — Command Center",
  description: "AI-based fake identity and document screening system.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-black text-white antialiased min-h-screen selection:bg-[#2997ff]/30 selection:text-white">
        <CollapsibleLiquidHeader />
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}

