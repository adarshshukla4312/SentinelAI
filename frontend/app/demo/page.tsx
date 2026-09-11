import Link from "next/link";
import StatsBentoDemo from "@/components/ui/demo";
import { StatsBento } from "@/components/ui/stats-bento";

export const metadata = {
  title: "Stats Bento Showcase · SentinelAI",
  description: "Interactive Bento Grid component integrated into SentinelAI",
};

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Overview
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Stats Bento Component
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/test"
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            Launch Screening Console →
          </Link>
        </div>
      </header>

      {/* Component Showcase Container */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 mb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest mb-2">
            Default Component Variant
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Stats Bento Grid (demo.tsx)</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Rendered from <code className="bg-muted px-1.5 py-0.5 rounded text-xs">@/components/ui/demo.tsx</code>
          </p>
        </div>

        {/* Default Demo Component */}
        <StatsBentoDemo />

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-4 my-12">
          <hr className="border-border" />
        </div>

        {/* SentinelAI Themed Variant */}
        <div className="max-w-7xl mx-auto px-4 mb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-widest mb-2">
            SentinelAI Telemetry Variant
          </span>
          <h2 className="text-3xl font-bold tracking-tight">Border Screening Metrics</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Customized props matching the SentinelAI 5-tier architecture & live screening throughput
          </p>
        </div>

        <StatsBento
          primaryTag="Tamper Detection"
          primaryValue="99.98%"
          primaryDescription="Deterministic ICAO 9303 checksum rejection + ELA passive forensic signal analysis across 10,000+ passport specimens."
          secondaryTag="Screening Throughput"
          secondaryValue="14.2k / hr"
          secondaryBars={[25, 45, 60, 50, 85, 70, 95, 80, 100, 115, 120]}
          statBValue="5 Tiers"
          statBTag="Defense in Depth"
          statCValue="< 800 ms"
          statCTag="End-to-End Latency"
          statCIcon="⚡"
        />
      </div>
    </main>
  );
}
