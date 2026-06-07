"use client";

import { Reveal, SectionLabel, SectionTitle, BentoTag } from "./ui";

/**
 * FeaturesSection — grid de características tipo "bento".
 *
 * id="funcionalidades" para la navegación interna y SEO on-page.
 */

const CARDS = [
  {
    id: "galerias-carrito",
    icon: "fas fa-images",
    title: "Galerías + carrito de compras",
    description: (
      <>
        Creá galerías públicas o privadas protegidas con contraseña. Tus clientes
        visualizan automáticamente las fotos con tu{" "}
        <span className="font-semibold text-[#1a4a7a]">marca de agua personalizada</span>,
        seleccionan sus favoritas y compran en segundos desde cualquier dispositivo.
      </>
    ),
    tags: ["Ventas automáticas", "Marca de agua", "Protección por contraseña", "Baja calidad automática"],
    colSpan: "md:col-span-5",
    delay: 0,
    rotate: "group-hover:rotate-3",
  },
  {
    id: "busqueda-facial",
    icon: "fas fa-face-smile",
    title: "Búsqueda facial con IA",
    description:
      "Cada invitado encuentra automáticamente sus fotos entre cientos de imágenes gracias a inteligencia artificial de reconocimiento facial.",
    tags: ["IA avanzada", "98% precisión", "Búsqueda instantánea"],
    colSpan: "md:col-span-3",
    delay: 100,
    rotate: "group-hover:-rotate-3",
  },
  {
    id: "galeria-qr",
    icon: "fas fa-qrcode",
    title: "Galería QR colaborativa",
    description:
      "Los invitados escanean un QR, hacen check-in con una selfie y suben sus fotos en segundos. El álbum del evento se crea automáticamente y en tiempo real.",
    tags: ["QR", "Selfie check-in", "Tiempo real"],
    colSpan: "md:col-span-4",
    delay: 220,
    rotate: "group-hover:rotate-3",
  },
  {
    id: "portafolio",
    icon: "fab fa-instagram",
    title: "Portafolio profesional",
    description:
      "Transformá tu perfil en una vitrina profesional moderna. Mostrá tus mejores trabajos, organizá galerías impactantes y generá confianza para atraer nuevos clientes.",
    tags: ["Marca personal", "Galerías modernas", "Más clientes"],
    colSpan: "md:col-span-4",
    delay: 100,
    rotate: "group-hover:-rotate-3",
  },
];

function BentoCard({ icon, title, description, tags, delay, rotate }) {
  return (
    <div
      className="
        relative overflow-hidden rounded-2xl
        border border-[rgba(42,127,212,0.12)]
        bg-white p-6 sm:p-8 h-full group
        transition-all duration-500
        hover:-translate-y-1
        hover:shadow-[0_20px_50px_rgba(42,127,212,0.12)]
      "
    >
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2a7fd4]/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2a7fd4]/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
      <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2a7fd4] to-[#b8e0f7] scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Icon */}
        <div
          className={`
            w-14 h-14 rounded-2xl
            bg-gradient-to-br from-[#1a4a7a] to-[#2a7fd4]
            flex items-center justify-center
            text-white text-[1.2rem]
            shadow-lg shadow-blue-500/20 mb-6
            transition-transform duration-500
            group-hover:scale-110 ${rotate}
          `}
          aria-hidden="true"
        >
          <i className={icon} />
        </div>

        <h3
          className="text-[1.35rem] sm:text-[1.55rem] font-bold tracking-[-0.03em] mb-4 text-[#0f2a4a] leading-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {title}
        </h3>

        <p className="text-[0.96rem] text-[#4a7096] leading-[1.9] font-light flex-1">
          {description}
        </p>

        <div className="mt-6 flex flex-wrap">
          {tags.map((t) => (
            <BentoTag key={t}>{t}</BentoTag>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section
      id="funcionalidades"
      aria-labelledby="features-heading"
      className="bg-[#f0f7ff] px-8 md:px-20 py-32"
    >
      {/* Header */}
      <div className="grid md:grid-cols-2 gap-16 items-end mb-20">
        <div>
          <Reveal>
            <SectionLabel>Herramientas</SectionLabel>
          </Reveal>
          <Reveal delay={100}>
            <SectionTitle>
              <span id="features-heading">
                Todo lo que un
                <br />
                <em>fotógrafo necesita</em>
              </span>
            </SectionTitle>
          </Reveal>
        </div>
        <Reveal delay={220}>
          <p className="text-[#4a7096] text-base leading-[1.8] font-light">
            Diseñado desde cero para fotógrafos que quieren hacer crecer su negocio.
            Galerías que venden, eventos que sorprenden y un portafolio que enamora.
          </p>
        </Reveal>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {CARDS.map((card) => (
          <Reveal key={card.id} delay={card.delay} className={card.colSpan}>
            <BentoCard {...card} />
          </Reveal>
        ))}

        {/* Card 5 — Contacto integrado (layout especial con imágenes) */}
        <Reveal delay={220} className="md:col-span-8">
          <div
            className="
              relative overflow-hidden rounded-2xl
              border border-[rgba(42,127,212,0.12)]
              bg-white
              transition-all duration-500
              hover:-translate-y-1
              hover:shadow-[0_20px_50px_rgba(42,127,212,0.12)]
              group
            "
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a7fd4]/[0.03] to-transparent pointer-events-none" />
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2a7fd4] to-[#b8e0f7] scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100 z-20" />

            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* Copy */}
              <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center relative z-10">
                <div
                  className="
                    w-14 h-14 rounded-2xl
                    bg-gradient-to-br from-[#1a4a7a] to-[#2a7fd4]
                    flex items-center justify-center
                    text-white text-[1.2rem]
                    shadow-lg shadow-blue-500/20 mb-6
                    transition-transform duration-500
                    group-hover:scale-110 group-hover:rotate-3
                  "
                  aria-hidden="true"
                >
                  <i className="fas fa-envelope" />
                </div>

                <h3
                  className="text-[1.4rem] sm:text-[1.7rem] font-bold tracking-[-0.03em] mb-4 text-[#0f2a4a] leading-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Contacto integrado
                </h3>

                <p className="text-[0.96rem] sm:text-[1rem] text-[#4a7096] leading-[1.9] font-light max-w-[30rem]">
                  Centralizá toda la comunicación con tus clientes desde un solo lugar.
                  Recibí consultas directas por{" "}
                  <span className="font-semibold text-[#1a4a7a]">WhatsApp y email</span>,
                  respondé más rápido y convertí visitas en reservas.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <BentoTag>WhatsApp integrado</BentoTag>
                  <BentoTag>Mensajería profesional</BentoTag>
                  <BentoTag>Mail</BentoTag>
                </div>
              </div>

              {/* Images */}
              <div className="md:col-span-2 grid grid-cols-2 border-t md:border-t-0 md:border-l border-[rgba(42,127,212,0.08)]">
                <div className="relative overflow-hidden min-h-[240px] sm:min-h-[320px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/img/Contacto/1.jpg"
                    alt="Consulta de cliente a fotógrafo por WhatsApp en PhotoBook"
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f2a4a]/30 to-transparent" />
                </div>
                <div className="relative overflow-hidden border-l border-[rgba(255,255,255,0.08)] min-h-[240px] sm:min-h-[320px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/img/Contacto/4.jpg"
                    alt="Fotógrafo respondiendo a clientes desde su perfil en PhotoBook"
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f2a4a]/20 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
