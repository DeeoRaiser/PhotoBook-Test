"use client";

/**
 * MarqueeBand — banda animada con palabras clave del producto.
 *
 * Usa la animación pb-marquee definida en los estilos globales.
 * El contenido se duplica para simular scroll infinito.
 */
const MARQUEE_ITEMS = [
  "Galerías privadas",
  "Búsqueda facial IA",
  "Galería QR colaborativa",
  "Portafolio profesional",
  "Venta de fotos integrada",
  "Eventos en tiempo real",
  "Selfie check-in",
];

export default function MarqueeBand() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div
      className="py-5 border-t border-b border-[rgba(42,127,212,0.2)] overflow-hidden bg-[#1a4a7a]"
      aria-hidden="true" // Decorativo — el contenido ya está en el resto de la página
    >
      <div className="pb-marquee flex gap-12 whitespace-nowrap">
        {doubled.map((item, i) => (
          <div
            key={i}
            className="text-[0.7rem] tracking-[0.2em] uppercase text-[#b8e0f7] shrink-0 flex items-center gap-4"
          >
            {item}
            <span className="text-[rgba(184,224,247,0.35)]">—</span>
          </div>
        ))}
      </div>
    </div>
  );
}
