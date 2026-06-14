import { DM_Sans, DM_Mono } from "next/font/google"
import { GoogleAnalytics } from "@next/third-parties/google"
import "./globals.css"

const dmSans = DM_Sans({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
    display: "swap",
})

const dmMono = DM_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
    weight: ["400", "500"],
    display: "swap",
})

export const metadata = {
    title: "PhotoBook",
    description: "Tu market de fotografía profesional",
}

export default function RootLayout({ children }) {
    return (
        <html
            lang="es"
            className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
        >
            <head>
                <meta
                    name="facebook-domain-verification"
                    content="bestt2wxmlu1b8ddgq60lhylgd7eq4"
                />
            </head>
            <body
                className="min-h-full flex flex-col"
                style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                }}
            >
                {children}
            </body>

            <GoogleAnalytics gaId="G-QSDE7PH1FP" />
        </html>
    )
}