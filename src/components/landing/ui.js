"use client";

import { useReveal } from "./hooks";

// ─── Reveal wrapper ───────────────────────────────────────────────────────────
export function Reveal({ children, delay = 0, className = "" }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Section label (eyebrow text) ─────────────────────────────────────────────
export function SectionLabel({ children, center = false }) {
  return (
    <div
      className={`flex items-center gap-3 text-[0.7rem] tracking-[0.25em] uppercase text-[#2a7fd4] mb-5 ${
        center ? "justify-center" : ""
      }`}
    >
      <span className="block w-6 h-px bg-[#2a7fd4] shrink-0" />
      {children}
    </div>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────
export function SectionTitle({ children, light = false }) {
  return (
    <h2
      className={`font-extrabold tracking-[-0.035em] leading-[1.08] mb-6 text-[clamp(2.2rem,4vw,4rem)] [&_em]:not-italic [&_em]:text-[#2a7fd4] [&_em]:font-semibold ${
        light ? "text-white" : "text-[#0f2a4a]"
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {children}
    </h2>
  );
}

// ─── Primary button ───────────────────────────────────────────────────────────
export function BtnPrimary({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#2a7fd4] text-white px-9 py-4 text-[0.8rem] tracking-[0.1em] uppercase font-medium rounded cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1a4a7a] hover:shadow-[0_12px_30px_rgba(42,127,212,0.3)]"
    >
      {children}
    </button>
  );
}

// ─── Ghost button ─────────────────────────────────────────────────────────────
export function BtnGhost({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-transparent text-[#4a7096] px-6 py-4 text-[0.8rem] tracking-[0.08em] uppercase font-normal border border-[rgba(42,127,212,0.2)] rounded cursor-pointer transition-all duration-300 hover:border-[#2a7fd4] hover:text-[#2a7fd4] hover:bg-[rgba(42,127,212,0.04)]"
    >
      {children}
    </button>
  );
}

// ─── Bento feature tag ────────────────────────────────────────────────────────
export function BentoTag({ children }) {
  return (
    <span className="inline-block mt-2 mr-2 text-[0.65rem] tracking-[0.15em] uppercase text-[#2a7fd4] border border-[rgba(42,127,212,0.2)] px-3 py-1">
      {children}
    </span>
  );
}

// ─── Gallery image card ───────────────────────────────────────────────────────
export function GalleryCard({ src, alt, type, title, sub, badge, wide = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg cursor-pointer group ${
        wide ? "md:col-span-2" : ""
      }`}
      style={{
        aspectRatio: wide ? "16/9" : "3/4",
        boxShadow: "0 8px 32px rgba(15,42,74,0.3)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-top brightness-90 saturate-110 transition-all duration-700 group-hover:scale-[1.06] group-hover:brightness-75"
      />
      <div
        className="absolute inset-0 flex flex-col justify-end p-8"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 55%)",
        }}
      >
        <div className="text-[0.65rem] tracking-[0.2em] uppercase text-[#b8e0f7] mb-2">
          {type}
        </div>
        <div
          className="text-[1.3rem] font-bold text-white leading-[1.15] mb-1 tracking-[-0.02em]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {title}
        </div>
        <div className="text-[0.75rem] text-[rgba(255,255,255,0.55)]">{sub}</div>
      </div>
      <div className="absolute top-5 right-5 bg-[rgba(42,127,212,0.2)] backdrop-blur-[8px] border border-[rgba(42,127,212,0.4)] text-[#b8e0f7] text-[0.62rem] tracking-[0.12em] uppercase px-3 py-1 rounded z-[4]">
        {badge}
      </div>
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────
export function Toast({ message, visible }) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 z-[10000] whitespace-nowrap transition-all duration-[400ms]
        bg-[#0f2a4a] text-[#e0f2fe] px-7 py-4 text-[0.85rem] tracking-[0.05em]
        border-l-4 border-[#2a7fd4] shadow-[0_20px_40px_rgba(15,42,74,0.3)] rounded
        ${
          visible
            ? "opacity-100 -translate-x-1/2 translate-y-0"
            : "opacity-0 -translate-x-1/2 translate-y-2 pointer-events-none"
        }`}
    >
      {message}
    </div>
  );
}
