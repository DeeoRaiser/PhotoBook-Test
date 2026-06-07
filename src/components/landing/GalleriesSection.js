"use client";

import { Reveal, SectionLabel, SectionTitle, GalleryCard } from "./ui";

/**
 * GalleriesSection — sección oscura que muestra galerías públicas y privadas.
 *
 * id="galerias" para ancla de navegación.
 */
export default function GalleriesSection() {
  return (
    <section
      id="galerias"
      aria-labelledby="galleries-heading"
      className="relative overflow-hidden px-5 sm:px-8 md:px-20 py-24 sm:py-28 md:py-32"
      style={{
        background: "linear-gradient(160deg, #1a4a7a 0%, #0d2040 55%, #081426 100%)",
      }}
    >
      {/* Background glows (decorativos) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-[#2a7fd4]/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[20rem] h-[20rem] bg-[#b8e0f7]/5 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-end mb-14 md:mb-20">
          <div>
            <Reveal>
              <SectionLabel>Galerías reales</SectionLabel>
            </Reveal>
            <Reveal delay={100}>
              <SectionTitle light>
                <span id="galleries-heading">
                  Cada evento merece
                  <br />
                  <em className="text-[#b8e0f7] not-italic">una experiencia única</em>
                </span>
              </SectionTitle>
            </Reveal>
          </div>

          <Reveal delay={220}>
            <div className="backdrop-blur-sm bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <p className="text-[rgba(184,224,247,0.78)] leading-[1.9] font-light text-[0.98rem] sm:text-[1rem]">
                Compartí galerías públicas para mostrar tu trabajo al mundo o creá accesos
                privados con contraseña para clientes exclusivos. Vos controlás quién puede
                ver, descargar y comprar cada foto.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7 mt-12">
          {/* Galería pública */}
          <Reveal className="md:col-span-2">
            <div
              className="
                group relative overflow-hidden rounded-3xl
                border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm
                transition-all duration-500
                hover:-translate-y-1 hover:border-white/[0.14]
                hover:shadow-[0_25px_80px_rgba(0,0,0,0.35)]
              "
            >
              <GalleryCard
                src="/img/galerias/Publicas.jpg"
                alt="Galería pública de casamientos en PhotoBook — La boda de Vanessa y Rubén"
                type={
                  <>
                    <i className="fas fa-globe-americas mr-1" /> Galería pública
                  </>
                }
                title="La boda de Vanessa & Rubén"
                sub="por Juan González · Fotografía de casamientos"
                badge="🌐 Público"
                wide
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081426]/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2a7fd4] to-[#b8e0f7] scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          </Reveal>

          {/* Galería privada */}
          <Reveal delay={100}>
            <div
              className="
                group relative overflow-hidden rounded-3xl
                border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm
                transition-all duration-500
                hover:-translate-y-1 hover:border-white/[0.14]
                hover:shadow-[0_25px_80px_rgba(0,0,0,0.35)]
              "
            >
              <GalleryCard
                src="/img/galerias/Privadas.jpg"
                alt="Galería privada protegida con contraseña en PhotoBook para fotógrafos"
                type={
                  <>
                    <i className="fas fa-lock mr-1" /> Acceso privado
                  </>
                }
                title="Galería protegida"
                sub="Solo las personas autorizadas pueden acceder"
                badge="🔒 Privado"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081426]/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2a7fd4] to-[#b8e0f7] scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
