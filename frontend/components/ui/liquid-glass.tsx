"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Shield, FileCheck, Cpu, Activity, Search, Command, ArrowUp } from "lucide-react";

// Types
export interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  target?: string;
  onClick?: () => void;
}

export interface DockIcon {
  src?: string;
  icon?: React.ReactNode;
  alt: string;
  label?: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}

// Glass Effect Wrapper Component
export const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
  href,
  target = "_blank",
  onClick,
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  const content = (
    <div
      onClick={onClick}
      className={`relative flex font-semibold overflow-hidden text-white cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-inherit"
        style={{
          backdropFilter: "blur(3px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-inherit"
        style={{ background: "rgba(255, 255, 255, 0.25)" }}
      />
      <div
        className="absolute inset-0 z-20 rounded-inherit overflow-hidden pointer-events-none"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)",
        }}
      />

      {/* Content */}
      <div className="relative z-30 flex items-center justify-center w-full">{children}</div>
    </div>
  );

  return href ? (
    <a href={href} target={target} rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : (
    content
  );
};

// Dock Component (Exact Original Liquid Glass specification with vertical dock support and spring hover)
export const GlassDock: React.FC<{ icons: DockIcon[]; href?: string; className?: string; vertical?: boolean }> = ({
  icons,
  href,
  className = "",
  vertical = false,
}) => (
  <GlassEffect
    href={href}
    className={`rounded-full p-3 hover:p-4 transition-all duration-700 ${className}`}
  >
    <div className={`flex ${vertical ? "flex-col py-2 px-1 gap-4" : "flex-row px-2 py-1 gap-4"} items-center justify-center rounded-full overflow-hidden`}>
      {icons.map((iconItem, index) => (
        <div
          key={index}
          onClick={iconItem.onClick}
          title={iconItem.alt}
          className={`flex flex-col items-center justify-center p-2.5 rounded-full transition-all duration-700 hover:scale-125 cursor-pointer ${
            iconItem.active
              ? "bg-[#2997ff] text-white shadow-[0_0_20px_rgba(41,151,255,0.9)] border border-white/60"
              : "text-white/90 hover:text-white hover:bg-white/20"
          }`}
          style={{
            transformOrigin: "center center",
            transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
          }}
        >
          {iconItem.icon ? (
            iconItem.icon
          ) : (
            <img
              src={iconItem.src}
              alt={iconItem.alt}
              className="w-8 h-8 object-contain"
            />
          )}
          {iconItem.label && (
            <span className={`text-[10px] tracking-tight leading-none mt-1 font-semibold select-none ${
              iconItem.active ? "text-white" : "text-white/80"
            }`}>
              {iconItem.label}
            </span>
          )}
        </div>
      ))}
    </div>
  </GlassEffect>
);

// Button Component
export const GlassButton: React.FC<{ children: React.ReactNode; href?: string; onClick?: () => void; className?: string }> = ({
  children,
  href,
  onClick,
  className = "",
}) => (
  <GlassEffect
    href={href}
    onClick={onClick}
    className={`rounded-full px-8 py-3.5 hover:px-9 hover:py-4 transition-all duration-500 overflow-hidden ${className}`}
  >
    <div
      className="transition-all duration-500 hover:scale-95 flex items-center justify-center gap-2"
      style={{
        transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.2)",
      }}
    >
      {children}
    </div>
  </GlassEffect>
);

// SVG Filter Component
export const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="200"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

// Collapsible Navigation Header Component (Header -> Vertical Right-Side Floating Glass Dock -> Smoothly Morphing Back to Top Button in Footer)
export const CollapsibleLiquidHeader: React.FC = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (pathname !== "/") return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const totalHeight = document.documentElement.scrollHeight;

      setIsScrolled(scrollY > 50);

      // Detect if user has reached the footer area (within 320px of bottom)
      const nearBottom = viewportHeight + scrollY >= totalHeight - 320;
      setIsAtBottom(nearBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Exclusively render on the home screen; do not disrupt auditing tool or subroutes
  if (pathname !== "/") {
    return null;
  }

  const handleNavigate = (tabKey: string, targetId: string) => {
    setActiveTab(tabKey);
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      if (window.location.pathname !== "/") {
        window.location.href = `/#${targetId}`;
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const navIcons: DockIcon[] = [
    {
      icon: <Shield className="w-5 h-5" />,
      alt: "Command Center",
      label: "Command",
      active: activeTab === "overview",
      onClick: () => handleNavigate("overview", "hero"),
    },
    {
      icon: <FileCheck className="w-5 h-5" />,
      alt: "Document Screening",
      label: "Screen",
      active: activeTab === "screening",
      onClick: () => handleNavigate("screening", "features"),
    },
    {
      icon: <Activity className="w-5 h-5" />,
      alt: "Risk Analytics",
      label: "Risk",
      active: activeTab === "matrix",
      onClick: () => handleNavigate("matrix", "defense-tiers"),
    },
    {
      icon: <Cpu className="w-5 h-5" />,
      alt: "Forensic Matrix",
      label: "Forensics",
      active: activeTab === "engine",
      onClick: () => handleNavigate("engine", "architecture"),
    },
  ];

  return (
    <>
      <GlassFilter />
      {/* Top Full Expanded Header (Visible at top of page) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          isScrolled ? "opacity-0 pointer-events-none -translate-y-full" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="w-full bg-black/85 backdrop-blur-xl border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigate("overview", "hero")}>
            <div className="w-9 h-9 rounded-full bg-[#2997ff] flex items-center justify-center shadow-[0_0_15px_rgba(41,151,255,0.5)]">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              Sentinel<span className="text-[#2997ff]">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <button
              onClick={() => handleNavigate("overview", "hero")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === "overview"
                  ? "text-white bg-[#2997ff]/20 border border-[#2997ff]/50 shadow-[0_0_10px_rgba(41,151,255,0.3)]"
                  : "text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
            >
              Command Center
            </button>
            <button
              onClick={() => handleNavigate("screening", "features")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === "screening"
                  ? "text-white bg-[#2997ff]/20 border border-[#2997ff]/50 shadow-[0_0_10px_rgba(41,151,255,0.3)]"
                  : "text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
            >
              Document Screening
            </button>
            <button
              onClick={() => handleNavigate("matrix", "defense-tiers")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === "matrix"
                  ? "text-white bg-[#2997ff]/20 border border-[#2997ff]/50 shadow-[0_0_10px_rgba(41,151,255,0.3)]"
                  : "text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
            >
              Risk Analytics
            </button>
            <button
              onClick={() => handleNavigate("engine", "architecture")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === "engine"
                  ? "text-white bg-[#2997ff]/20 border border-[#2997ff]/50 shadow-[0_0_10px_rgba(41,151,255,0.3)]"
                  : "text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
            >
              Forensic Matrix
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => (window.location.href = "/test")}
              className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ED] active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(0,113,227,0.65)] hover:shadow-[0_0_25px_rgba(41,151,255,0.85)] border border-[#3ba2ff]/50 cursor-pointer inline-flex items-center justify-center font-medium tracking-wide"
            >
              Run Audit
            </button>
          </div>
        </div>
      </header>

      {/* Floating Right Element: Smoothly morphing from Vertical Glass Dock to Footer Back-to-Top Button */}
      <div
        className={`fixed z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center ${
          isScrolled
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none translate-x-12"
        } ${
          isAtBottom
            ? "bottom-8 md:bottom-12 right-6 md:right-[max(32px,calc((100vw-1200px)/2+12px))] top-auto translate-y-0"
            : "top-1/2 -translate-y-1/2 right-6"
        }`}
      >
        <div className="relative flex items-center justify-center">
          {/* Back to top button (morphing into view at footer) */}
          <div
            className={`transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
              isAtBottom
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-50 translate-y-8 pointer-events-none absolute"
            }`}
          >
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-6 py-3 rounded-full text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ED] active:scale-95 transition-all duration-300 shadow-[0_0_25px_rgba(0,113,227,0.75)] hover:shadow-[0_0_30px_rgba(41,151,255,0.95)] border border-[#3ba2ff]/50 cursor-pointer inline-flex items-center gap-2.5 font-medium tracking-wide whitespace-nowrap select-none"
              title="Back to top"
            >
              <ArrowUp className="w-4 h-4 text-white animate-bounce" />
              <span>Back to top</span>
            </button>
          </div>

          {/* Vertical Glass Dock (morphing / collapsing when near footer) */}
          <div
            className={`transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
              isAtBottom
                ? "opacity-0 scale-50 translate-y-8 pointer-events-none absolute"
                : "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            }`}
          >
            <GlassDock icons={navIcons} vertical={true} />
          </div>
        </div>
      </div>
    </>
  );
};

// Main Component (Demo export)
export const Component: React.FC = () => {
  const dockIcons: DockIcon[] = [
    {
      src: "https://cdn.21st.dev/assets/mirror/8d/8d2757d81dfac86570f4c8836c7406741afce9309493d7d32a5176dfb48604b6.png",
      alt: "Claude",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/a7/a7f5c3a20ee7e3979c200ae2de37dee2396d7b2eae8da7c5c294b1f308f8ebe3.png",
      alt: "Finder",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/06/06182c64d1993c122cceffea2e27a04c36a824f54b4a01163547b77f197f37bc.png",
      alt: "ChatGPT",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/b4/b4b6b0474a5074704d0f627855076899d0f1ab61685645103d3839d56297a93a.png",
      alt: "Maps",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/c2/c208bfbd8c5ceaf0d16c20f77f769600c3ee2c3084934bb74273f348948dc192.png",
      alt: "Safari",
    },
    {
      src: "https://cdn.21st.dev/assets/mirror/ce/ce6c5811b78662b15db06143f35dca896cd78790a05e2f652a921d0c18fbc166.png",
      alt: "Steam",
    },
  ];

  return (
    <div
      className="min-h-screen h-full flex items-center justify-center font-light relative overflow-hidden w-full bg-black"
    >
      <GlassFilter />
      <div className="flex flex-col gap-6 items-center justify-center w-full">
        <GlassDock icons={dockIcons} />
        <GlassButton>
          <div className="text-xl text-white">
            <p>How can I help you today?</p>
          </div>
        </GlassButton>
      </div>     
    </div>
  );
};
