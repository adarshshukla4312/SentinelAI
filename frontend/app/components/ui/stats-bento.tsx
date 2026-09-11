"use client";
import React from "react";

export interface StatsBentoProps {
  primaryTag?: string;
  primaryValue?: string;
  primaryDescription?: string;
  secondaryTag?: string;
  secondaryValue?: string;
  secondaryBars?: number[];
  statBValue?: string | number;
  statBTag?: string;
  statCValue?: string;
  statCTag?: string;
  statCIcon?: React.ReactNode;
  className?: string;
}

export const StatsBento: React.FC<StatsBentoProps> = ({
  primaryTag = "Market Share",
  primaryValue = "64%",
  primaryDescription = "Dominating the cloud-native infrastructure market for venture-backed startups.",
  secondaryTag = "Growth",
  secondaryValue = "+240%",
  secondaryBars = [10, 20, 40, 30, 60, 50, 80, 70, 90, 100, 110],
  statBValue = "12",
  statBTag = "Awards",
  statCValue = "4.9 / 5.0",
  statCTag = "G2 Peer Reviews",
  statCIcon = "★",
  className = "",
}) => {
  return (
    <section className={`min-h-screen bg-background flex flex-col justify-center px-4 py-12 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4 max-w-7xl mx-auto w-full">
        {/* Primary Stat */}
        <div className="md:col-span-3 md:row-span-2 bg-primary rounded-3xl p-10 flex flex-col justify-between overflow-hidden relative shadow-lg">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[repeating-linear-gradient(45deg,#808080_0px_1px,transparent_1px_10px)] opacity-30 mask-[radial-gradient(ellipse_80%_50%_at_100%_0%,#000_70%,transparent_110%)] pointer-events-none"></div>
          <div>
            <span className="inline-block px-3 py-1 bg-primary-foreground/10 rounded-full text-[10px] font-semibold text-primary-foreground/80 uppercase tracking-widest mb-6 border border-primary-foreground/20">
              {primaryTag}
            </span>
            <h3 className="text-6xl tracking-tighter text-primary-foreground font-bold">
              {primaryValue}
            </h3>
          </div>
          <p className="text-primary-foreground/80 text-sm max-w-xs leading-relaxed">
            {primaryDescription}
          </p>
        </div>

        {/* Secondary Stat A */}
        <div className="md:col-span-3 bg-muted rounded-3xl p-8 border border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              {secondaryTag}
            </p>
            <p className="text-3xl text-foreground font-bold">{secondaryValue}</p>
          </div>
          <div className="flex gap-1.5 items-end h-10">
            {secondaryBars.map((h, i) => (
              <div
                key={i}
                className="w-2 bg-foreground rounded-full transition-all duration-300 hover:opacity-80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Tertiary Stat B */}
        <div className="md:col-span-1 bg-card rounded-3xl p-6 border border-border flex flex-col justify-center text-center">
          <p className="text-3xl text-foreground font-bold">{statBValue}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">
            {statBTag}
          </p>
        </div>

        {/* Tertiary Stat C */}
        <div className="md:col-span-2 bg-muted rounded-3xl p-6 flex items-center gap-4 border border-border">
          <div className="size-10 text-xl rounded-full bg-background text-foreground flex items-center justify-center shrink-0 shadow-sm font-semibold">
            {statCIcon}
          </div>
          <div>
            <p className="text-sm text-foreground font-bold leading-none">{statCValue}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {statCTag}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsBento;
