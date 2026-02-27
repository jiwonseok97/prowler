import React from "react";

import { IconSvgProps } from "../../../types/index";

/* ─────────────────────────────────────────────────────────────
   Shared ALREADY11 brand mark – premium white 3-D isometric box
   inside a glowing white hexagon ring
───────────────────────────────────────────────────────────── */
function A11Icon({ idPrefix }: { idPrefix: string }) {
  const p = idPrefix;
  return (
    <svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        {/* ── 3D face gradients – all-white / silver palette ── */}
        {/* Top face  → near-pure white (maximum light from upper-left) */}
        <linearGradient id={`${p}tg`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#e8f4ff" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        {/* Front face → silver-white */}
        <linearGradient id={`${p}fg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#d4e8f8" />
          <stop offset="100%" stopColor="#a8c4dc" />
        </linearGradient>
        {/* Left face  → deep shadow */}
        <linearGradient id={`${p}lg`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#5a7090" />
          <stop offset="100%" stopColor="#283848" />
        </linearGradient>
        {/* Inner hex background */}
        <linearGradient id={`${p}ig`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#141c28" />
          <stop offset="100%" stopColor="#0c1420" />
        </linearGradient>
        {/* Bar-divider shadow overlay */}
        <linearGradient id={`${p}bs`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#080e18" stopOpacity="0.70" />
          <stop offset="100%" stopColor="#080e18" stopOpacity="0.45" />
        </linearGradient>
        {/* Outer hex glow filter */}
        <filter id={`${p}hg`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Front-face inner glow (shine stripe) */}
        <linearGradient id={`${p}sh`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="40%"  stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── outer hex ring – pure white glow ── */}
      <polygon
        points="81,44 62,76 26,76 7,44 26,12 62,12"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        filter={`url(#${p}hg)`}
      />

      {/* ── inner hex dark fill ── */}
      <polygon
        points="76,44 60,72 28,72 12,44 28,16 60,16"
        fill={`url(#${p}ig)`}
      />

      {/* ── 3D isometric box ── */}
      {/* Left face (shadow) */}
      <polygon points="28,24 28,66 16,58 16,32" fill={`url(#${p}lg)`} />
      {/* Top face (highlight – brightest) */}
      <polygon points="28,24 56,24 68,16 40,16" fill={`url(#${p}tg)`} />
      {/* Front face */}
      <rect x="28" y="24" width="28" height="42" fill={`url(#${p}fg)`} />
      {/* Shine stripe on front */}
      <rect x="28" y="24" width="28" height="42" fill={`url(#${p}sh)`} />

      {/* ── vertical bar dividers ── */}
      <rect x="32"   y="24" width="4.5" height="42" fill={`url(#${p}bs)`} />
      <rect x="39.5" y="24" width="4.5" height="42" fill={`url(#${p}bs)`} />
      <rect x="47"   y="24" width="4.5" height="42" fill={`url(#${p}bs)`} />

      {/* ── right dark micro-panel ── */}
      <rect x="52" y="36" width="4" height="16" rx="0.8"
        fill="#0a1420" opacity="0.95" />

      {/* ── +/– symbols (right of hex) ── */}
      {/* top + */}
      <line x1="68" y1="26" x2="68" y2="35"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="63.5" y1="30.5" x2="72.5" y2="30.5"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      {/* middle – */}
      <line x1="63.5" y1="44" x2="72.5" y2="44"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      {/* bottom + */}
      <line x1="68" y1="51" x2="68" y2="60"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="63.5" y1="55.5" x2="72.5" y2="55.5"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" />

      {/* ── sharp edge highlights ── */}
      <line x1="28" y1="24" x2="56" y2="24"
        stroke="#ffffff" strokeWidth="1.0" opacity="0.85" />
      <line x1="28" y1="24" x2="28" y2="66"
        stroke="#ffffff" strokeWidth="0.8" opacity="0.50" />
      <line x1="28" y1="24" x2="40" y2="16"
        stroke="#ffffff" strokeWidth="0.9" opacity="0.70" />
      {/* bottom front edge */}
      <line x1="28" y1="66" x2="56" y2="66"
        stroke="#c0d8f0" strokeWidth="0.7" opacity="0.40" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   ProwlerExtended  (sidebar open – icon + text)
───────────────────────────────────────────── */
export const ProwlerExtended: React.FC<IconSvgProps> = ({
  size,
  width = 248,
  height,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 306 68"
    fill="none"
    height={size || height}
    width={size || width}
    {...props}
  >
    <defs>
      <radialGradient id="a11ext-glow" cx="10%" cy="50%" r="60%" fx="10%" fy="50%">
        <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.18" />
        <stop offset="55%"  stopColor="#ffffff" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      {/* premium white-to-silver text gradient */}
      <linearGradient id="a11ext-txt-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#ffffff" />
        <stop offset="60%"  stopColor="#e8f2ff" />
        <stop offset="100%" stopColor="#c0d4ec" />
      </linearGradient>
      {/* text glow filter */}
      <filter id="a11ext-txt-glow" x="-5%" y="-30%" width="110%" height="160%">
        <feGaussianBlur stdDeviation="1.5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <style>{`
        .a11e-root { cursor: pointer; }
        .a11e-bg   { opacity: 0; transition: opacity 0.4s ease; }
        .a11e-root:hover .a11e-bg { opacity: 1; }
        .a11e-icon { transition: filter 0.4s ease; }
        .a11e-root:hover .a11e-icon {
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.45));
        }
      `}</style>
    </defs>

    <g className="a11e-root">
      <rect className="a11e-bg" x="0" y="0" width="306" height="68" rx="8"
        fill="url(#a11ext-glow)" />

      <g className="a11e-icon">
        <svg x="0" y="4" width="60" height="60" viewBox="0 0 88 88">
          <A11Icon idPrefix="ext" />
        </svg>
      </g>

      {/* premium white gradient text */}
      <text
        x="68" y="44"
        fontSize="34"
        fontWeight="900"
        fontFamily="'Arial Black','Franklin Gothic Heavy','Impact',system-ui,sans-serif"
        letterSpacing="0.5"
        fill="url(#a11ext-txt-grad)"
        filter="url(#a11ext-txt-glow)"
      >
        ALREADY11
      </text>
    </g>
  </svg>
);

/* ─────────────────────────────────────────────
   ProwlerShort  (sidebar collapsed – icon only)
───────────────────────────────────────────── */
export const ProwlerShort: React.FC<IconSvgProps> = ({
  size,
  width = 58,
  height,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 68 68"
    fill="none"
    height={size || height}
    width={size || width}
    {...props}
  >
    <defs>
      <style>{`
        .a11s-wrap { cursor: pointer; transition: filter 0.35s ease; }
        .a11s-wrap:hover {
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.5));
        }
      `}</style>
    </defs>
    <g className="a11s-wrap">
      <svg x="4" y="4" width="60" height="60" viewBox="0 0 88 88">
        <A11Icon idPrefix="sht" />
      </svg>
    </g>
  </svg>
);
