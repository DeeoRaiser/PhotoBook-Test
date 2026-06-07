"use client";

/**
 * HeroSection — primera sección de la landing.
 *
 * Contiene el h1 principal, descripción y la imagen hero con la tarjeta flotante.
 * Todo el texto es semánticamente correcto para SEO.
 */
export default function HeroSection() {
  return (
    <section
      aria-label="Presentación de PhotoBook"
      className="relative h-auto md:h-[91vh] grid md:grid-cols-2 overflow-hidden bg-[#f6faff]"
    >
      {/* ── Columna izquierda: copy ── */}
      <div className="relative z-[2] flex flex-col justify-center px-10 md:px-20 py-20 md:py-16">
        <div
          className="pb-fadeUp opacity-0 text-[0.72rem] tracking-[0.25em] uppercase text-[#2a7fd4] mb-7 flex items-center gap-3"
          style={{ animationDelay: "0.2s" }}
        >
          <span className="block w-8 h-px bg-[#2a7fd4]" aria-hidden="true" />
          {/* Eyebrow con palabra clave de nicho */}
          Plataforma para fotógrafos profesionales
        </div>

        <h1
          className="pb-fadeUp opacity-0 text-[clamp(3.2rem,5.5vw,5.5rem)] leading-[1.0] font-extrabold tracking-[-0.04em] mb-8"
          style={{
            fontSize: "3.5rem",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            animationDelay: "0.4s",
          }}
        >
          Tus fotos
          <br />
          merecen
          <br />
          <em className="not-italic text-[#2a7fd4] font-semibold"> algo más grande.</em>
        </h1>

        <p
          className="pb-fadeUp opacity-0 text-[1.05rem] text-[#4a7096] leading-[1.7] max-w-[420px] mb-12 font-light"
          style={{ animationDelay: "0.6s" }}
        >
          PhotoBook automatiza la forma en que mostrás,
          compartís y vendés tu trabajo fotográfico.
        </p>

        {/* Espacio para CTA si se desea añadir */}
        <div className="pb-fadeUp opacity-0" style={{ animationDelay: "0.8s" }} />
      </div>

      {/* ── Columna derecha: imagen ── */}
      <div className="relative min-h-[55vh] md:min-h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/fotoBook/1.jpg"
          alt="Portfolio de fotógrafo profesional en PhotoBook — galería de casamientos"
          width={900}
          height={1200}
          className="w-full h-full object-cover object-top brightness-90 contrast-105 saturate-110 block"
          loading="eager"
          fetchPriority="high"
        />

        {/* Fade hacia la izquierda para unir con el copy */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(to right, #f0f7ff 0%, rgba(240,247,255,0.5) 30%, transparent 55%)",
          }}
        />

        {/* Tarjeta flotante */}
        <div
          className="pb-cardIn opacity-0 absolute bottom-6 left-1/16 bg-white py-4 px-5 w-[220px] border-l-4 border-[#2a7fd4] md:translate-x-0 md:left-[-50px]"
          style={{
            animationDelay: "1.2s",
            boxShadow: "0 30px 60px rgba(0,0,0,0.12)",
          }}
          aria-hidden="true"
        >
          <div className="text-[0.65rem] tracking-[0.15em] uppercase text-[#2a7fd4] mb-1">
            <i className="fas fa-lock text-[0.6rem] mr-1" /> Galería privada
          </div>
          <div
            className="text-[0.92rem] font-semibold text-[#0f2a4a] mb-1 tracking-[-0.01em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            La boda de Vanessa &amp; Rubén
          </div>
          <div className="text-[0.72rem] text-[#4a7096]">
            38 fotos · Acceso con contraseña
          </div>
        </div>
      </div>
    </section>
  );
}
