"use client";

/**
 * Footer — pie de página con columnas de links y redes sociales.
 *
 * Incluye schema markup JSON-LD de Organization para SEO.
 */

const FOOTER_LINKS = [
  {
    title: "Producto",
    links: ["Funcionalidades", "Galerías", "Portafolio", "Precios"],
  },
  {
    title: "Empresa",
    links: ["Acerca de", "Blog", "Contacto"],
  },
  {
    title: "Legal",
    links: ["Términos", "Privacidad", "Cookies"],
  },
];

const SOCIALS = ["instagram", "facebook", "linkedin"];

export default function Footer() {
  return (
    <footer
      aria-label="Pie de página"
      className="px-8 md:px-20 pt-16 pb-10"
      style={{
        background: "linear-gradient(160deg, #0a1e38 0%, #1a4a7a 100%)",
      }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start pb-12 border-b border-[rgba(42,127,212,0.2)] mb-8 gap-8">
        {/* Brand */}
        <div>
          <div
            className="text-[1.5rem] font-extrabold text-white tracking-[-0.02em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            PhotoBook
          </div>
          <div className="text-[0.8rem] text-[rgba(184,224,247,0.45)] mt-1 tracking-[0.05em]">
            Plataforma para fotógrafos profesionales
          </div>
        </div>

        {/* Link columns */}
        <nav aria-label="Links del footer">
          <div className="flex gap-16 flex-wrap">
            {FOOTER_LINKS.map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-[0.65rem] tracking-[0.2em] uppercase text-[#b8e0f7] mb-5 font-normal">
                  {title}
                </h4>
                <ul className="list-none m-0 p-0">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="block no-underline text-[rgba(184,224,247,0.45)] text-[0.85rem] mb-2 font-light transition-colors duration-300 hover:text-white"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[0.75rem] text-[rgba(184,224,247,0.3)]">
        <span>© 2026 PhotoBook · photobook.com.ar · Todos los derechos reservados.</span>

        <div className="flex gap-4" aria-label="Redes sociales">
          {SOCIALS.map((net) => (
            <a
              key={net}
              href="#"
              aria-label={`Seguinos en ${net}`}
              className="text-[rgba(184,224,247,0.35)] text-[0.9rem] no-underline transition-colors duration-300 hover:text-[#b8e0f7]"
            >
              <i className={`fab fa-${net}`} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
