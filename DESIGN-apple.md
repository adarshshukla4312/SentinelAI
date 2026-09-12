---
version: alpha
name: Apple-AMOLED-Liquid-Glass-Design-Analysis
description: A photography-first dark mode interface that turns marketing into a high-contrast museum gallery. Set against pitch-black AMOLED canvases (#000000) and framed by SF Pro Display headlines with negative letter-spacing, UI chrome recedes into dynamic Liquid Glass surfaces. A single Action Blue (#2997ff) interactive color highlights key actions. Navigation menus neatly collapse into a Liquid Glass floating dock when scrolling down, reverting back to the full header when returning to the top.

colors:
  primary: "#2997ff"
  primary-focus: "#0071e3"
  primary-on-dark: "#2997ff"
  ink: "#ffffff"
  body: "#f5f5f7"
  body-on-dark: "#ffffff"
  body-muted: "#a1a1aa"
  ink-muted-80: "#d2d2d7"
  ink-muted-48: "#71717a"
  divider-soft: "#1c1c1e"
  hairline: "#2c2c2e"
  canvas: "#000000"
  canvas-parchment: "#09090b"
  surface-pearl: "#121214"
  surface-tile-1: "#000000"
  surface-tile-2: "#09090b"
  surface-tile-3: "#121214"
  surface-black: "#000000"
  surface-chip-translucent: "rgba(255, 255, 255, 0.12)"
  glass-fill: "rgba(255, 255, 255, 0.15)"
  glass-border-inset: "rgba(255, 255, 255, 0.3)"
  glass-shadow: "0 6px 6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.3)"
  on-primary: "#ffffff"
  on-dark: "#ffffff"

typography:
  hero-display:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.07
    letterSpacing: -0.28px
  display-lg:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: 0
  display-md:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 34px
    fontWeight: 600
    lineHeight: 1.47
    letterSpacing: -0.374px
  lead:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.14
    letterSpacing: 0.196px
  lead-airy:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 300
    lineHeight: 1.5
    letterSpacing: 0
  tagline:
    fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif"
    fontSize: 21px
    fontWeight: 600
    lineHeight: 1.19
    letterSpacing: 0.231px
  body-strong:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.24
    letterSpacing: -0.374px
  body:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: -0.374px
  dense-link:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 2.41
    letterSpacing: 0
  caption:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: -0.224px
  caption-strong:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.29
    letterSpacing: -0.224px
  button-large:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 300
    lineHeight: 1.0
    letterSpacing: 0
  button-utility:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.29
    letterSpacing: -0.224px
  fine-print:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: -0.12px
  micro-legal:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 10px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: -0.08px
  nav-link:
    fontFamily: "SF Pro Text, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: -0.12px

rounded:
  none: 0px
  xs: 5px
  sm: 8px
  md: 11px
  lg: 18px
  pill: 9999px
  full: 9999px
  glass-3xl: 24px
  glass-4xl: 32px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 17px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 80px

components:
  liquid-glass-wrapper:
    backgroundColor: "rgba(255, 255, 255, 0.25)"
    backdropFilter: "blur(3px)"
    svgFilter: "url(#glass-distortion)"
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)"
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)"
  liquid-glass-dock:
    backgroundColor: "rgba(255, 255, 255, 0.15)"
    rounded: "{rounded.glass-3xl}"
    padding: 12px
  liquid-glass-button:
    backgroundColor: "rgba(255, 255, 255, 0.15)"
    rounded: "{rounded.glass-3xl}"
    padding: 24px 40px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 11px 22px
  button-primary-focus:
    backgroundColor: "{colors.primary-focus}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  button-primary-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
  button-secondary-pill:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 11px 22px
  button-dark-utility:
    backgroundColor: "rgba(255, 255, 255, 0.1)"
    textColor: "{colors.body-on-dark}"
    typography: "{typography.button-utility}"
    rounded: "{rounded.sm}"
    padding: 8px 15px
  button-pearl-capsule:
    backgroundColor: "{colors.surface-pearl}"
    textColor: "{colors.ink-muted-80}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-store-hero:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-large}"
    rounded: "{rounded.pill}"
    padding: 14px 28px
  button-icon-circular:
    backgroundColor: "{colors.surface-chip-translucent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 44px
  text-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body}"
  text-link-on-dark:
    backgroundColor: transparent
    textColor: "{colors.primary-on-dark}"
    typography: "{typography.body}"
  global-nav:
    backgroundColor: "{colors.surface-black}"
    textColor: "{colors.on-dark}"
    typography: "{typography.nav-link}"
    height: 44px
  sub-nav-frosted:
    backgroundColor: "rgba(18, 18, 20, 0.75)"
    backdropFilter: "blur(20px)"
    textColor: "{colors.ink}"
    typography: "{typography.tagline}"
    height: 52px
  product-tile-dark-pitch:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.none}"
    padding: 80px
  product-tile-obsidian:
    backgroundColor: "{colors.canvas-parchment}"
    textColor: "{colors.ink}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.none}"
    padding: 80px
  product-tile-dark-2:
    backgroundColor: "{colors.surface-tile-2}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.none}"
  product-tile-dark-3:
    backgroundColor: "{colors.surface-tile-3}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.none}"
  store-utility-card:
    backgroundColor: "{colors.surface-pearl}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.lg}"
    padding: 24px
    border: "1px solid {colors.hairline}"
  configurator-option-chip:
    backgroundColor: "{colors.surface-pearl}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 12px 16px
  configurator-option-chip-selected:
    backgroundColor: "{colors.surface-pearl}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    border: "2px solid {colors.primary}"
  search-input:
    backgroundColor: "{colors.surface-pearl}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 12px 20px
    height: 44px
  floating-sticky-bar:
    backgroundColor: "rgba(18, 18, 20, 0.85)"
    backdropFilter: "blur(20px)"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: 64px
    padding: 12px 32px
  environment-quote-card:
    backgroundColor: "{colors.surface-tile-1}"
    textColor: "{colors.on-dark}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.none}"
    padding: 80px
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body-muted}"
    typography: "{typography.fine-print}"
    padding: 64px
---

## Overview

This design system defines an **AMOLED Dark Mode gallery framed by Liquid Glass interactive chrome**. Product presentation rests against deep, pitch-black canvases (`#000000`) and subtle obsidian surface tiles (`#09090b`, `#121214`). Photorealistic product imagery glows with self-luminous weight, centered under bold SF Pro Display headlines with negative letter-spacing and a vivid Action Blue (`#2997ff`) accent.

The defining UI innovation is **Liquid Glass Navigation**: as the user scrolls down the page, top navigation bars gracefully contract into a translucent floating Liquid Glass dock positioned dynamically at the bottom or top of the viewport. Upon scrolling back to the top, the floating dock expands back into the standard full header. This ensures content remains unencumbered while navigation controls stay fluidly accessible.

**Key Characteristics:**
- **AMOLED Pitch-Black Palette**: Dominant background is pure `#000000` black, eliminating backlight spill on OLED screens and maximizing product contrast.
- **Liquid Glass Navigation Chrome**: Dynamic header-to-dock transitions with realistic SVG noise distortion, specular highlights, and spring dynamics (`cubic-bezier(0.175, 0.885, 0.32, 2.2)`).
- **Single Action Blue Accent** (`{colors.primary}` — `#2997ff`): The primary "click me" signal throughout dark mode surfaces.
- **Museum-Quality Density**: Edge-to-edge full-bleed tiles with ultra-clean white text on black canvases.
- **SF Pro Display + Text**: Negative letter-spacing at display sizes for the signature "Apple tight" headline feel.

---

## Liquid Glass Navigation Architecture

### Scroll Collapse Behavior
1. **At Top of Page (`scrollY === 0`)**: The full `{component.global-nav}` and `{component.sub-nav-frosted}` are pinned to the top of the viewport as an expanded header bar.
2. **On Scroll Down (`scrollY > 60px`)**: The full header smoothly morphs and contracts into a floating **Liquid Glass Dock** (`{component.liquid-glass-dock}`), positioning itself neatly at the bottom center (or top fixed position) of the viewport.
3. **On Return to Top**: The dock expands back to the full horizontal header width without layout shift.

### Project Setup & Component Specification

The codebase strictly supports:
- **shadcn project structure** (`@/components/ui/`)
- **Tailwind CSS v4 / v3**
- **TypeScript**

> [!IMPORTANT]
> **Component Location**: Components must reside in `/components/ui` (e.g. `/components/ui/liquid-glass.tsx`). If `/components/ui` does not exist, initialize shadcn CLI using `npx shadcn@latest init` to maintain standard component alias paths (`@/components/ui`).

#### File: `/components/ui/liquid-glass.tsx`

```tsx
"use client";

import React from "react";

// Types
interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  target?: string;
}

interface DockIcon {
  src: string;
  alt: string;
  onClick?: () => void;
}

// Glass Effect Wrapper Component
const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
  href,
  target = "_blank",
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  const content = (
    <div
      className={`relative flex font-semibold overflow-hidden text-white cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-inherit rounded-3xl"
        style={{
          backdropFilter: "blur(3px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-inherit"
        style={{ background: "rgba(255, 255, 255, 0.15)" }}
      />
      <div
        className="absolute inset-0 z-20 rounded-inherit rounded-3xl overflow-hidden"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)",
        }}
      />

      {/* Content */}
      <div className="relative z-30">{children}</div>
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

// Dock Component
const GlassDock: React.FC<{ icons: DockIcon[]; href?: string }> = ({
  icons,
  href,
}) => (
  <GlassEffect
    href={href}
    className="rounded-3xl p-3 hover:p-4 hover:rounded-4xl"
  >
    <div className="flex items-center justify-center gap-2 rounded-3xl p-3 py-0 px-0.5 overflow-hidden">
      {icons.map((icon, index) => (
        <img
          key={index}
          src={icon.src}
          alt={icon.alt}
          className="w-16 h-16 transition-all duration-700 hover:scale-110 cursor-pointer"
          style={{
            transformOrigin: "center center",
            transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
          }}
          onClick={icon.onClick}
        />
      ))}
    </div>
  </GlassEffect>
);

// Button Component
const GlassButton: React.FC<{ children: React.ReactNode; href?: string }> = ({
  children,
  href,
}) => (
  <GlassEffect
    href={href}
    className="rounded-3xl px-10 py-6 hover:px-11 hover:py-7 hover:rounded-4xl overflow-hidden"
  >
    <div
      className="transition-all duration-700 hover:scale-95"
      style={{
        transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
      }}
    >
      {children}
    </div>
  </GlassEffect>
);

// SVG Filter Component
const GlassFilter: React.FC = () => (
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

// Main Component Example
export const Component = () => {
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
    <div className="min-h-screen h-full flex items-center justify-center font-light relative overflow-hidden w-full bg-black">
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
```

#### Demo Usage File: `/components/demo.tsx`
```tsx
import { Component } from "@/components/ui/liquid-glass";

const DemoOne = () => {
  return <Component />;
};

export { DemoOne };
```

#### Global CSS Extension (`index.css` / `globals.css`)
```css
@import "tailwindcss";
@import "tw-animate-css";

@keyframes moveBackground {
  from {
    background-position: 0% 0%;
  }
  to {
    background-position: 0% -1000%;
  }
}
```

#### Integration Guidelines
1. **Icons**: Use `lucide-react` vector SVGs for interface icons (Search, Shopping Bag, Menu, Chevron) within glass elements.
2. **Background Integration**: Remove demo image assets when embedding into production page layouts; integrate liquid glass directly over AMOLED product canvases.
3. **State Management**: Track window scroll offset with a lightweight scroll listener hook to toggle collapsed dock state smoothly.

---

## Colors

### Brand & Accent
- **Action Blue** (`{colors.primary}` — `#2997ff`): The single brand-level interactive color in dark mode. Text links, primary pill CTAs, focus indicators.
- **Focus Blue** (`{colors.primary-focus}` — `#0071e3`): High-visibility outline tint for active focus states (`outline: 2px solid`).

### Surface (AMOLED Pitch-Black Ladder)
- **AMOLED Canvas** (`{colors.canvas}` — `#000000`): Pure pitch black. Dominant background for homepage product sections, videos, and full-bleed hero tiles.
- **Obsidian Dark 1** (`{colors.canvas-parchment}` — `#09090b`): Deepest dark tone used for subtle section breaks and alternating product tiles.
- **Obsidian Dark 2** (`{colors.surface-pearl}` — `#121214`): Elevated dark surface hex for utility cards, search inputs, and configurator panels.
- **Tile Surface 2** (`{colors.surface-tile-2}` — `#09090b`): Micro-step dark surface.
- **Tile Surface 3** (`{colors.surface-tile-3}` — `#121214`): Embedded player surfaces.

### Text
- **Pure White Ink** (`{colors.ink}` — `#ffffff`): Headlines, hero titles, body paragraphs on pitch-black surfaces.
- **Body Text** (`{colors.body}` — `#f5f5f7`): High-legibility off-white body copy.
- **Body Muted** (`{colors.body-muted}` — `#a1a1aa`): Secondary descriptions and category subtitles.
- **Ink Muted 80** (`{colors.ink-muted-80}` — `#d2d2d7`): Emphasized secondary labels on dark cards.
- **Ink Muted 48** (`{colors.ink-muted-48}` — `#71717a`): Fine print and disclaimers.

---

## Typography

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.hero-display}` | 56px | 600 | 1.07 | -0.28px | Hero headline; "Apple tight" tracking |
| `{typography.display-lg}` | 40px | 600 | 1.10 | 0 | Tile headlines atop product tiles |
| `{typography.display-md}` | 34px | 600 | 1.47 | -0.374px | Section heads |
| `{typography.lead}` | 28px | 400 | 1.14 | 0.196px | Subcopy below headlines |
| `{typography.lead-airy}` | 24px | 300 | 1.5 | 0 | Editorial lead paragraphs |
| `{typography.tagline}` | 21px | 600 | 1.19 | 0.231px | Sub-tile tagline |
| `{typography.body-strong}` | 17px | 600 | 1.24 | -0.374px | Inline strong emphasis |
| `{typography.body}` | 17px | 400 | 1.47 | -0.374px | Default paragraph copy |
| `{typography.dense-link}` | 17px | 400 | 2.41 | 0 | Dense link columns in footer |
| `{typography.caption}` | 14px | 400 | 1.43 | -0.224px | Captions, button labels |
| `{typography.caption-strong}` | 14px | 600 | 1.29 | -0.224px | Bold captions |
| `{typography.button-large}` | 18px | 300 | 1.0 | 0 | Store hero CTAs |
| `{typography.button-utility}` | 14px | 400 | 1.29 | -0.224px | Utility nav labels |
| `{typography.fine-print}` | 12px | 400 | 1.0 | -0.12px | Footer fine print |
| `{typography.micro-legal}` | 10px | 400 | 1.3 | -0.08px | Legal disclaimers |
| `{typography.nav-link}` | 12px | 400 | 1.0 | -0.12px | Global nav menu items |

---

## Layout & Shapes

### Spacing System
- **Base unit**: 8px (`{spacing.xs}`).
- **Section vertical padding**: 80px (`{spacing.section}`) per product tile. Full-bleed tiles stack with 0 gap (surface dark tone change creates section break).

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed product tiles |
| `{rounded.sm}` | 8px | Dark utility buttons, thumbnail frames |
| `{rounded.md}` | 11px | Dark pearl capsules |
| `{rounded.lg}` | 18px | Utility cards, store cards |
| `{rounded.pill}` | 9999px | Action Blue pill CTAs, search inputs |
| `{rounded.full}` | 9999px / 50% | Circular overlay buttons |
| `{rounded.glass-3xl}` | 24px | Liquid Glass floating dock container |
| `{rounded.glass-4xl}` | 32px | Liquid Glass expanded hover state |

---

## Components

### 1. Liquid Glass Header & Floating Dock
- **Top Header (`scrollY === 0`)**: Full-width top navigation bar (`height: 44px`) rendered with subtle backdrop blur over pitch-black canvas (`rgba(0, 0, 0, 0.6)`).
- **Collapsed Floating Dock (`scrollY > 60px`)**: Centered floating capsule using `{component.liquid-glass-dock}` with `backdropFilter: blur(3px)`, SVG noise distortion (`#glass-distortion`), inset highlights, and quick spring scaling (`cubic-bezier(0.175, 0.885, 0.32, 2.2)`).

### 2. Buttons
- **`button-primary`**: Action Blue pill (`#2997ff`), text `#ffffff`, rounded `{rounded.pill}`, padding 11px × 22px. Active press state: `transform: scale(0.95)`.
- **`button-secondary-pill`**: Translucent outline pill, 1px solid `#2997ff`, text `#2997ff`.
- **`button-dark-utility`**: Glass utility chip (`rgba(255, 255, 255, 0.1)`), text `#ffffff`, rounded `{rounded.sm}` (8px).

### 3. Product Tiles & Store Cards
- **`product-tile-dark-pitch`**: Full-bleed `#000000` AMOLED tile with white typography (`#ffffff`), centered product render, and system shadow.
- **`product-tile-obsidian`**: Full-bleed `#09090b` tile providing subtle contrast rhythm.
- **`store-utility-card`**: Dark utility container (`#121214`), 1px solid hairline border (`#2c2c2e`), rounded `{rounded.lg}` (18px), padding 24px.
- **`search-input`**: Full-pill dark input (`#121214`), border `#2c2c2e`, text `#ffffff`, height 44px.

---

## Do's and Don'ts

### Do
- Maintain pitch-black `#000000` as the default background canvas for full AMOLED contrast.
- Ensure the header smoothly morphs into the Liquid Glass dock when scrolling down.
- Use `{colors.primary}` (`#2997ff`) exclusively as the single interactive accent.
- Place full Liquid Glass component code inside `/components/ui/liquid-glass.tsx`.
- Use `transform: scale(0.95)` for button active press feedback.

### Don't
- Don't use light or parchment white background canvases.
- Don't introduce arbitrary secondary brand colors.
- Don't apply heavy drop shadows to UI cards or text; elevation in UI comes from glass refraction and dark surface steps.
- Don't hardcode third-party image URLs into production navigation icons — use `lucide-react` vector SVGs instead.
