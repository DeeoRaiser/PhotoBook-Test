"use client";

import { useState, useEffect } from "react";
import { Reveal, SectionLabel, SectionTitle } from "./ui";

/**
 * ShowcaseSection — sección "Plataforma" con carrusel de imágenes del portafolio
 * y lista de características del perfil profesional.
 *
 * id="plataforma" para ancla de navegación.
 */

const IMAGES = [
  "/img/fotoBook/1.jpg",
  "/img/fotoBook/2.jpg",
  "/img/fotoBook/3.jpg",
  "/img/fotoBook/4.jpg",
];

const FEATURES = [
  "Perfil personalizable con foto y especialidades",
  "Diseño visual moderno",
  "Redes sociales, biografía y sitio web",
  "Galerías destacadas con portada personalizada",
  "Contacto directo mediante WhatsApp y email",
];

export default function ShowcaseSection() {
  const [active, setActive] = useState(0);

  // Autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % IMAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="plataforma"
      aria-labelledby="showcase-heading"
      className="relative overflow-hidden px-5 sm:px-8 md:px-20 py-24 sm:py-28 md:py-32 bg-[#e0f2fe]"
    >
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-[#2a7fd4]/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-[22rem] h-[22rem] bg-[#1a4a7a]/5 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* ── Carrusel de imágenes ── */}
        <Reveal className="relative order-2 lg:order-1">
          <div className="relative h-[520px] sm:h-[680px] lg:h-[760px] flex items-center justify-center">
            {/* Glow central */}
            <div
              className="absolute w-[22rem] h-[22rem] bg-[#2a7fd4]/10 blur-3xl rounded-full"
              aria-hidden="true"
            />

            {IMAGES.map((img, index) => {
              const prevIndex = (active - 1 + IMAGES.length) % IMAGES.length;
              const nextIndex = (active + 1) % IMAGES.length;
              const isActive = index === active;
              const isPrev = index === prevIndex;
              const isNext = index === nextIndex;

              if (!isActive && !isPrev && !isNext) return null;

              return (
                <div
                  key={img}
                  className={`
                    absolute transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)]
                    rounded-[30px] overflow-hidden
                    border border-white/60
                    bg-white/40 backdrop-blur-sm
                    shadow-[0_30px_80px_rgba(15,42,74,0.18)]
                    ${isActive ? "z-30 scale-100 opacity-100 translate-y-0 rotate-0 w-[78%] sm:w-[62%] lg:w-[56%]" : ""}
                    ${isPrev ? "z-20 scale-[0.88] opacity-70 -translate-x-[28%] translate-y-12 -rotate-[6deg] w-[68%] sm:w-[54%] lg:w-[48%]" : ""}
                    ${isNext ? "z-10 scale-[0.88] opacity-70 translate-x-[28%] translate-y-12 rotate-[6deg] w-[68%] sm:w-[54%] lg:w-[48%]" : ""}
                  `}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Portafolio de fotógrafo profesional en PhotoBook — imagen ${index + 1}`}
                    className="w-full aspect-[3/4] object-cover object-center"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f2a4a]/30 to-transparent" />
                </div>
              );
            })}

            {/* Dots */}
            <div className="absolute bottom-0 flex items-center gap-3" role="tablist" aria-label="Navegación del carrusel">
              {IMAGES.map((_, index) => (
                <button
                  key={index}
                  role="tab"
                  aria-selected={active === index}
                  aria-label={`Imagen ${index + 1}`}
                  onClick={() => setActive(index)}
                  className={`transition-all duration-300 rounded-full ${
                    active === index
                      ? "w-8 h-2 bg-[#2a7fd4]"
                      : "w-2 h-2 bg-[#2a7fd4]/30 hover:bg-[#2a7fd4]/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Copy ── */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <SectionLabel>Portafolio profesional</SectionLabel>
          </Reveal>

          <Reveal delay={100}>
            <SectionTitle>
              <span id="showcase-heading">
                Tu marca,
                <br />
                <em>tu escaparate digital</em>
              </span>
            </SectionTitle>
          </Reveal>

          <Reveal delay={220}>
            <p className="text-[#4a7096] leading-[1.9] text-[1rem] font-light mb-5">
              Creá un perfil profesional moderno donde mostrar tu estilo, tus mejores
              trabajos y toda la información que tus clientes necesitan para contratarte.
            </p>
            <p className="text-[#4a7096] leading-[1.9] text-[1rem] font-light mb-8">
              Tus galerías, redes sociales, especialidades y medios de contacto reunidos
              en un solo lugar que trabaja para vos las 24 horas.
            </p>
          </Reveal>

          <Reveal delay={380}>
            <ul className="space-y-3 mb-10" aria-label="Características del portafolio">
              {FEATURES.map((item) => (
                <li
                  key={item}
                  className="
                    flex items-start gap-4 p-4 rounded-2xl
                    bg-white/60 border border-white/70 backdrop-blur-sm
                    transition-all duration-300
                    hover:translate-x-1
                    hover:shadow-[0_10px_30px_rgba(42,127,212,0.08)]
                  "
                >
                  <div
                    className="mt-1 w-6 h-6 rounded-full bg-gradient-to-br from-[#1a4a7a] to-[#2a7fd4] flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <i className="fas fa-check text-white text-[0.65rem]" />
                  </div>
                  <p className="text-[0.95rem] text-[#4a7096] font-light leading-[1.7]">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
