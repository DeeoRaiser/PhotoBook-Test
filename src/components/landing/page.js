// app/page.js  (o app/landing/page.js según tu estructura Next.js)
// ─────────────────────────────────────────────────────────────────────────────
// SEO COMPLETO PARA GOOGLE
// Incluye: meta tags, Open Graph, Twitter Card, JSON-LD (Organization +
// WebSite + SoftwareApplication), canonical URL y alternates.
// ─────────────────────────────────────────────────────────────────────────────

import PhotoBookLanding from "@/components/PhotoBookLanding";

// ── Metadata estática (Next.js App Router) ────────────────────────────────────
export const metadata = {
  // ── Básico ──
  title: "PhotoBook — Plataforma para fotógrafos profesionales",
  description:
    "PhotoBook automatiza galerías, ventas de fotos y eventos colaborativos para fotógrafos profesionales en Argentina. Galerías privadas, búsqueda facial con IA, portafolio y más.",
  keywords: [
    "plataforma para fotógrafos",
    "galería de fotos online",
    "venta de fotos online",
    "portafolio fotógrafo",
    "galería QR eventos",
    "búsqueda facial fotos",
    "software fotógrafo profesional",
    "galería privada fotos",
    "PhotoBook Argentina",
  ],
  authors: [{ name: "PhotoBook", url: "https://photobook.com.ar" }],
  creator: "PhotoBook",
  publisher: "PhotoBook",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Canonical & Alternates ──
  alternates: {
    canonical: "https://photobook.com.ar",
    languages: {
      "es-AR": "https://photobook.com.ar",
    },
  },

  // ── Open Graph ──
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://photobook.com.ar",
    siteName: "PhotoBook",
    title: "PhotoBook — Plataforma para fotógrafos profesionales",
    description:
      "Galerías privadas, búsqueda facial con IA, venta de fotos y eventos colaborativos. Todo lo que un fotógrafo profesional necesita en un solo lugar.",
    images: [
      {
        url: "https://photobook.com.ar/og-image.jpg", // Reemplazar con imagen real 1200×630
        width: 1200,
        height: 630,
        alt: "PhotoBook — Plataforma para fotógrafos profesionales",
      },
    ],
  },

  // ── Twitter Card ──
  twitter: {
    card: "summary_large_image",
    title: "PhotoBook — Plataforma para fotógrafos profesionales",
    description:
      "Galerías privadas, búsqueda facial con IA, venta de fotos y eventos colaborativos para fotógrafos.",
    images: ["https://photobook.com.ar/og-image.jpg"],
    creator: "@photobookAR", // Actualizar con el handle real
  },

  // ── Icons / PWA ──
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",

  // ── Verificación de Search Console ──
  // verification: {
  //   google: "TU_CÓDIGO_DE_VERIFICACIÓN",
  // },
};

// ── JSON-LD Structured Data ───────────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // Organization
    {
      "@type": "Organization",
      "@id": "https://photobook.com.ar/#organization",
      name: "PhotoBook",
      url: "https://photobook.com.ar",
      logo: {
        "@type": "ImageObject",
        url: "https://photobook.com.ar/logo.png",
        width: 200,
        height: 200,
      },
      sameAs: [
        "https://www.instagram.com/photobookAR",
        "https://www.facebook.com/photobookAR",
        "https://www.linkedin.com/company/photobookAR",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        email: "contacto@photobook.com.ar",
        contactType: "customer service",
        availableLanguage: "Spanish",
      },
      areaServed: "AR",
    },

    // WebSite (para el sitelinks search box si aplica)
    {
      "@type": "WebSite",
      "@id": "https://photobook.com.ar/#website",
      url: "https://photobook.com.ar",
      name: "PhotoBook",
      publisher: { "@id": "https://photobook.com.ar/#organization" },
      inLanguage: "es-AR",
    },

    // SoftwareApplication
    {
      "@type": "SoftwareApplication",
      "@id": "https://photobook.com.ar/#app",
      name: "PhotoBook",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://photobook.com.ar",
      publisher: { "@id": "https://photobook.com.ar/#organization" },
      description:
        "Plataforma para fotógrafos profesionales con galerías privadas, búsqueda facial con IA, venta de fotos y eventos colaborativos con QR.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "ARS",
        description: "Plan gratuito disponible",
      },
      featureList: [
        "Galerías privadas protegidas con contraseña",
        "Búsqueda facial con inteligencia artificial",
        "Galería QR colaborativa para eventos",
        "Portafolio profesional personalizable",
        "Venta de fotos con carrito de compras",
        "Contacto integrado vía WhatsApp y email",
        "Eventos en tiempo real con selfie check-in",
      ],
    },

    // WebPage
    {
      "@type": "WebPage",
      "@id": "https://photobook.com.ar/#webpage",
      url: "https://photobook.com.ar",
      name: "PhotoBook — Plataforma para fotógrafos profesionales",
      isPartOf: { "@id": "https://photobook.com.ar/#website" },
      about: { "@id": "https://photobook.com.ar/#organization" },
      description:
        "PhotoBook automatiza la forma en que los fotógrafos muestran, comparten y venden su trabajo.",
      inLanguage: "es-AR",
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: "https://photobook.com.ar",
          },
        ],
      },
    },
  ],
};

// ── Page Component ─────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <>
      {/* JSON-LD injected in <head> */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PhotoBookLanding />
    </>
  );
}
