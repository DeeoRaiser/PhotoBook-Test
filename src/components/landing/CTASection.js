"use client";

import { Reveal, SectionLabel, BtnPrimary, BtnGhost } from "./ui";

/**
 * CTASection — sección final de llamado a la acción.
 *
 * Props:
 *   showToast  {(msg: string) => void}
 */
export default function CTASection({ showToast }) {
  return (
    <section
      aria-labelledby="cta-heading"
      className="px-8 py-40 text-center relative overflow-hidden"
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(42,127,212,0.1) 0%, transparent 70%)",
        }}
      />

      <Reveal>
        <div className="flex justify-center">
          <SectionLabel>Empezá hoy</SectionLabel>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <h2
          id="cta-heading"
          className="text-[clamp(2.5rem,5vw,5rem)] font-extrabold tracking-[-0.035em] leading-[1.08] mb-6 max-w-[800px] mx-auto [&_em]:not-italic [&_em]:text-[#2a7fd4] [&_em]:font-semibold text-[#0f2a4a]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Transformá tu trabajo
          <br />
          en un <em>negocio</em>
        </h2>
      </Reveal>

      <Reveal delay={220}>
        <p className="text-[#4a7096] text-base max-w-[500px] mx-auto mb-12 leading-[1.7] font-light">
          Unite a los fotógrafos que ya están usando PhotoBook para vender más, deleitar a
          sus clientes y diferenciarse de la competencia.
        </p>
      </Reveal>

      <Reveal delay={380}>
        <div className="flex gap-5 justify-center flex-wrap">
          <BtnPrimary onClick={() => showToast("✨ Beta abierta próximamente.")}>
            Comenzar gratis
          </BtnPrimary>
          <BtnGhost onClick={() => showToast("📩 contacto@photobook.com.ar")}>
            <i className="fas fa-envelope text-[0.7rem]" aria-hidden="true" /> Contactar
          </BtnGhost>
        </div>
      </Reveal>
    </section>
  );
}
