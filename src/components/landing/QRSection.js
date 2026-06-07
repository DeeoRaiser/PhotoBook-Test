"use client";

import { useState, useEffect, useRef } from "react";
import { Reveal, SectionLabel, SectionTitle } from "./ui";

/**
 * QRSection — sección oscura sobre la galería QR colaborativa.
 *
 * Incluye el slider de pasos para móvil y desktop.
 */

const STEPS = [
  {
    num: "01",
    title: "Generás el QR del evento",
    sub: "Disponible al instante desde tu panel de administración",
    image: "/img/galeria-evento/1.jpg",
  },
  {
    num: "02",
    title: "Los invitados escanean y hacen check-in",
    sub: "Ingreso rápido con selfie, sin aplicaciones ni registros complejos",
    image: "/img/galeria-evento/2.jpg",
  },
  {
    num: "03",
    title: "El álbum se construye en vivo",
    sub: "Fotos y videos aparecen automáticamente para todos los participantes",
    image: "/img/galeria-evento/3.jpg",
  },
  {
    num: "04",
    title: "Todos se llevan sus recuerdos",
    sub: "Cada invitado accede a las fotos donde aparece gracias a búsqueda facial con IA",
    image: "/img/galeria-evento/4.jpg",
  },
];

export default function QRSection() {
  const [active, setActive] = useState(0);
  const sliderRef = useRef(null);

  // Scroll slider on step change
  useEffect(() => {
    if (!sliderRef.current) return;
    const cardWidth = sliderRef.current.children[active]?.offsetWidth || 0;
    sliderRef.current.scrollTo({ left: active * (cardWidth + 24), behavior: "smooth" });
  }, [active]);

  const prev = () => setActive((p) => (p === 0 ? STEPS.length - 1 : p - 1));
  const next = () => setActive((p) => (p === STEPS.length - 1 ? 0 : p + 1));

  return (
    <section
      aria-labelledby="qr-heading"
      className="relative overflow-hidden px-5 sm:px-8 md:px-20 py-24 sm:py-28 md:py-32"
      style={{
        background:
          "linear-gradient(135deg, #081426 0%, #0d2040 35%, #1a4a7a 75%, #1a5a9a 100%)",
      }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-0 w-[30rem] h-[30rem] bg-[#2a7fd4]/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[25rem] h-[25rem] bg-[#b8e0f7]/5 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* ── Copy ── */}
        <div>
          <Reveal>
            <SectionLabel>Eventos en tiempo real</SectionLabel>
          </Reveal>

          <Reveal delay={100}>
            <SectionTitle light>
              <span id="qr-heading">
                El álbum colaborativo
                <br />
                <em className="text-[#b8e0f7] not-italic">
                  que se crea automáticamente
                </em>
              </span>
            </SectionTitle>
          </Reveal>

          <Reveal delay={220}>
            <div className="mt-6 mb-2 p-6 rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
              <p className="text-[rgba(184,224,247,0.78)] leading-[1.9] font-light text-[1rem] mb-5">
                Generá un QR único para cada evento. Los invitados escanean, realizan un
                check-in con selfie y empiezan a subir fotos y videos desde sus celulares
                en segundos.
              </p>
              <p className="text-[rgba(184,224,247,0.65)] leading-[1.9] font-light text-[1rem]">
                Ideal para casamientos, cumpleaños, quinceañeras, eventos corporativos y
                cualquier experiencia donde todos puedan aportar sus recuerdos en tiempo
                real.
              </p>
            </div>
          </Reveal>
        </div>

        {/* ── Slider de pasos ── */}
        <Reveal delay={380}>
          <div className="relative bg-transparent">
            {/* Arrow prev */}
            <button
              onClick={prev}
              aria-label="Paso anterior"
              className="
                hidden md:flex
                absolute left-0 top-1/2 -translate-y-1/2 z-30
                w-14 h-14 rounded-full items-center justify-center
                border border-white/10 bg-white/[0.06] backdrop-blur-md
                hover:bg-white/[0.12] transition-all duration-300
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Arrow next */}
            <button
              onClick={next}
              aria-label="Siguiente paso"
              className="
                hidden md:flex
                absolute right-0 top-1/2 -translate-y-1/2 z-30
                w-14 h-14 rounded-full items-center justify-center
                border border-white/10 bg-white/[0.06] backdrop-blur-md
                hover:bg-white/[0.12] transition-all duration-300
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Slide track */}
            <div
              ref={sliderRef}
              role="region"
              aria-label="Pasos del proceso QR"
              className="
                relative flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth
                px-2 sm:px-6 lg:px-16 pb-4 bg-transparent
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
              "
            >
              {STEPS.map((step, index) => (
                <button
                  key={step.image}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Paso ${step.num}: ${step.title}`}
                  aria-pressed={active === index}
                  className={`
                    relative shrink-0 snap-center
                    w-[88vw] sm:w-[70vw] lg:w-[520px]
                    rounded-[34px] overflow-hidden
                    border border-white/10 bg-white/[0.03] backdrop-blur-xl
                    text-left transition-all duration-500
                    ${active === index ? "scale-100 opacity-100" : "scale-[0.96] opacity-75"}
                  `}
                >
                  {/* Image */}
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-[300px] sm:h-[400px] lg:h-[450px] object-cover object-center transition-transform duration-700 will-change-transform select-none pointer-events-none"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-transparent" aria-hidden="true" />
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-5 flex items-start gap-4 bg-white/[0.92] backdrop-blur-xl border-t border-white/30">
                    {/* Step number */}
                    <div
                      className="
                        min-w-[54px] h-[54px] rounded-2xl flex items-center justify-center
                        bg-gradient-to-br from-[#1a4a7a] to-[#2a7fd4]
                        text-white text-[0.95rem] font-bold tracking-[0.08em]
                        shadow-lg shadow-blue-500/20
                      "
                      aria-hidden="true"
                    >
                      {step.num}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#081426] text-[1.02rem] font-semibold leading-tight mb-1">
                        {step.title}
                      </h3>
                      <p className="text-[#5b6b7d] text-[0.93rem] leading-[1.7] font-light">
                        {step.sub}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-3 mt-8" role="tablist" aria-label="Pasos del proceso">
              {STEPS.map((_, index) => (
                <button
                  key={index}
                  role="tab"
                  aria-selected={active === index}
                  aria-label={`Ir al paso ${index + 1}`}
                  onClick={() => setActive(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    active === index ? "w-10 bg-white" : "w-2.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
