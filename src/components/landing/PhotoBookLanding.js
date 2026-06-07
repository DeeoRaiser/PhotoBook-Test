"use client";

import { useEffect, useRef, useState } from "react";

import Header from "./Header";
import HeroSection from "./HeroSection";
import MarqueeBand from "./MarqueeBand";
import FeaturesSection from "./FeaturesSection";
import GalleriesSection from "./GalleriesSection";
import ShowcaseSection from "./ShowcaseSection";
import QRSection from "./QRSection";
import CTASection from "./CTASection";
import Footer from "./Footer";
import { Toast } from "./ui";

/**
 * PhotoBookLanding — componente raíz de la landing page.
 *
 * Gestiona:
 *   - Carga de Google Fonts y Font Awesome (una sola vez)
 *   - Estado de scroll para el header
 *   - Sistema de toast global
 *
 * El SEO estructural (meta tags, Open Graph, JSON-LD) debe agregarse en el
 * archivo de layout/page de Next.js; ver comentarios más abajo.
 */
export default function PhotoBookLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const toastTimer = useRef(null);

  // ── Carga de fuentes y Font Awesome ──────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById("pb-fonts")) {
      const pc1 = Object.assign(document.createElement("link"), {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      });
      const pc2 = Object.assign(document.createElement("link"), {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      });
      const fonts = Object.assign(document.createElement("link"), {
        id: "pb-fonts",
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap",
      });
      document.head.append(pc1, pc2, fonts);
    }
    if (!document.getElementById("pb-fa")) {
      const fa = Object.assign(document.createElement("link"), {
        id: "pb-fa",
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
      });
      document.head.appendChild(fa);
    }
  }, []);

  // ── Scroll listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Toast helper ──────────────────────────────────────────────────────────
  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message: msg });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      3000
    );
  }

  return (
    <>
      {/* ── Keyframes & animaciones globales ── */}
      <style>{`
        @keyframes pb-fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pb-slideInCard {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pb-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .pb-fadeUp  { animation: pb-fadeUp 1s forwards; }
        .pb-cardIn  { animation: pb-slideInCard 1s forwards; }
        .pb-marquee { animation: pb-marquee 25s linear infinite; }
      `}</style>

      {/* ── Noise overlay decorativo ── */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Radial glow de fondo ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(42,127,212,0.05) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(184,224,247,0.08) 0%, transparent 60%)",
        }}
      />

      <div
        className="bg-[#f0f7ff] text-[#0f2a4a] overflow-x-hidden relative"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <Header scrolled={scrolled} />
        <main id="main-content">
          <HeroSection />
          <MarqueeBand />
          <FeaturesSection />
          <GalleriesSection />
          <ShowcaseSection />
          <QRSection />
          <CTASection showToast={showToast} />
        </main>
        <Footer />
        <Toast visible={toast.visible} message={toast.message} />
      </div>
    </>
  );
}
