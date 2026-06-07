/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],

    // ── Imágenes: permite cargar desde Bunny CDN y cualquier subdominio ────────
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.b-cdn.net",
            },
            {
                protocol: "https",
                hostname: "**.mihost.com.ar",
            },
        ],
    },
    reactStrictMode: true,
    allowedDevOrigins: ['192.168.100.40'],

}

export default nextConfig
