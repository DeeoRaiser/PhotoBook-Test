// src/app/p/[slug]/PublicPortfolio.js  — Client Component
"use client"
import { useEffect, useState } from "react"
import { Instagram, Facebook, Youtube, Linkedin, Globe, Mail, MapPin, Camera, ExternalLink, MessageCircle, Star } from "lucide-react"
import Link from "next/link"

const SOCIAL_ICONS = {
    instagram: { icon: Instagram, label: "Instagram", color: "#E1306C" },
    facebook: { icon: Facebook, label: "Facebook", color: "#1877F2" },
    youtube: { icon: Youtube, label: "YouTube", color: "#FF0000" },
    linkedin: { icon: Linkedin, label: "LinkedIn", color: "#0A66C2" },
    website: { icon: Globe, label: "Sitio web", color: "#64748b" },
    email: { icon: Mail, label: "Email", color: "#64748b" },
}

export default function PublicPortfolio({ slug }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("galleries")

    useEffect(() => {
        fetch(`/api/portfolio/public/${slug}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false) })
    }, [slug])

    if (loading) return <div style={styles.loading}><div className="animate-spin" style={styles.spinner} /></div>
    if (!data) return <div style={styles.notFound}><Camera size={48} style={{ opacity: 0.2 }} /><p>Portfolio no encontrado</p></div>

    const socials = [
        data.portfolioInstagram && { key: "instagram", href: data.portfolioInstagram },
        data.portfolioFacebook && { key: "facebook", href: data.portfolioFacebook },
        data.portfolioYoutube && { key: "youtube", href: data.portfolioYoutube },
        data.portfolioLinkedin && { key: "linkedin", href: data.portfolioLinkedin },
        data.portfolioWebsite && { key: "website", href: data.portfolioWebsite },
        data.portfolioEmail && { key: "email", href: `mailto:${data.portfolioEmail}` },
    ].filter(Boolean)

    const tags = (data.portfolioSpecialty || "").split(",").map(s => s.trim()).filter(Boolean)

    return (
        <div style={styles.page}>
            {/* COVER */}
            <div style={{ ...styles.cover, backgroundImage: data.portfolioCoverUrl ? `url(${data.portfolioCoverUrl})` : undefined }}>
                {!data.portfolioCoverUrl && <div style={styles.coverPlaceholder}><Camera size={40} color="rgba(255,255,255,0.2)" /></div>}
            </div>

            {/* HEADER */}
            <div style={styles.headerWrap}>
                <div style={styles.headerInner}>
                    <div style={styles.avatarWrap}>
                        {data.portfolioAvatarUrl
                            ? <img src={data.portfolioAvatarUrl} alt={data.name} style={styles.avatar} />
                            : <div style={styles.avatarFallback}>{data.name?.[0]?.toUpperCase()}</div>}
                    </div>
                    <div style={styles.headerInfo}>
                        <h1 style={styles.name}>{data.name}</h1>
                        <p style={styles.meta}>
                            {data.portfolioSpecialty && <span>{data.portfolioSpecialty.split(",")[0]}</span>}
                            {data.portfolioCity && <><span style={styles.dot}>·</span><span><MapPin size={12} style={{ verticalAlign: -2 }} /> {data.portfolioCity}</span></>}
                        </p>
                    </div>
                    <div style={styles.headerActions}>
                        {data.portfolioEmail && (
                            <a href={`mailto:${data.portfolioEmail}`} style={styles.btnPrimary}>
                                <MessageCircle size={14} /> Contactar
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div style={styles.tabs}>
                {["galleries", "about"].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}>
                        {tab === "galleries" ? "Galerías" : "Sobre mí"}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div style={styles.content}>
                {activeTab === "galleries" && (
                    <div style={styles.grid}>
                        {data.galleries.length === 0
                            ? <p style={styles.empty}>No hay galerías públicas aún.</p>
                            : data.galleries.map(g => (
                                <Link key={g.id} href={`/g/${g.slug}`} style={styles.galleryCard}>
                                    <div style={{ ...styles.galleryThumb, backgroundImage: g.coverImage ? `url(${g.coverImage})` : undefined }}>
                                        {!g.coverImage && <Camera size={28} color="rgba(255,255,255,0.3)" />}
                                    </div>
                                    <div style={styles.galleryInfo}>
                                        <p style={styles.galleryTitle}>{g.title}</p>
                                        <p style={styles.galleryCount}><Camera size={11} /> {g._count.photos} fotos</p>
                                    </div>
                                </Link>
                            ))}
                    </div>
                )}

                {activeTab === "about" && (
                    <div style={styles.aboutCard}>
                        {data.portfolioBio && (
                            <div style={styles.bioSection}>
                                <h3 style={styles.sectionTitle}>Sobre mí</h3>
                                <p style={styles.bio}>{data.portfolioBio}</p>
                            </div>
                        )}
                        {socials.length > 0 && (
                            <div style={styles.socialSection}>
                                <h3 style={styles.sectionTitle}>Redes sociales</h3>
                                <div style={styles.socialRow}>
                                    {socials.map(({ key, href }) => {
                                        const { icon: Icon, label, color } = SOCIAL_ICONS[key]
                                        return (
                                            <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                                                title={label} style={{ ...styles.socialBtn, color }}>
                                                <Icon size={20} />
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                        {tags.length > 0 && (
                            <div style={styles.tagsSection}>
                                <h3 style={styles.sectionTitle}>Especialidades</h3>
                                <div style={styles.tagsRow}>
                                    {tags.map(t => <span key={t} style={styles.tag}>#{t}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const styles = {
    page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', system-ui, sans-serif" },
    loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
    spinner: { width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6" },
    notFound: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 12, color: "#94a3b8" },
    cover: { height: 220, background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" },
    coverPlaceholder: { display: "flex", alignItems: "center", justifyContent: "center" },
    headerWrap: { background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 24px" },
    headerInner: { maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "flex-end", gap: 16, paddingBottom: 16, position: "relative" },
    avatarWrap: { marginTop: -40, flexShrink: 0 },
    avatar: { width: 80, height: 80, borderRadius: "50%", border: "4px solid white", objectFit: "cover", display: "block" },
    avatarFallback: { width: 80, height: 80, borderRadius: "50%", border: "4px solid white", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "white" },
    headerInfo: { flex: 1 },
    name: { fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 2px" },
    meta: { fontSize: 13, color: "#64748b", margin: 0, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
    dot: { color: "#cbd5e1" },
    headerActions: { display: "flex", gap: 8, marginBottom: 2 },
    btnPrimary: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg,#1a1a2e,#1e3a5f)", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" },
    tabs: { maxWidth: 860, margin: "0 auto", padding: "0 24px", display: "flex", gap: 4, borderBottom: "1px solid #e2e8f0", background: "white" },
    tab: { padding: "12px 18px", fontSize: 13, fontWeight: 600, color: "#64748b", background: "none", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", transition: "all 0.15s" },
    tabActive: { color: "#0f172a", borderBottomColor: "#1e3a5f" },
    content: { maxWidth: 860, margin: "24px auto", padding: "0 24px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 16 },
    galleryCard: { borderRadius: 14, overflow: "hidden", background: "white", border: "1px solid #e2e8f0", textDecoration: "none", display: "block", transition: "transform 0.15s, box-shadow 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
    galleryThumb: { height: 140, background: "#1a1a2e", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" },
    galleryInfo: { padding: "12px 14px" },
    galleryTitle: { fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    galleryCount: { fontSize: 11, color: "#94a3b8", margin: 0, display: "flex", alignItems: "center", gap: 4 },
    empty: { color: "#94a3b8", fontSize: 13, gridColumn: "1/-1" },
    aboutCard: { background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, display: "flex", flexDirection: "column", gap: 24 },
    bioSection: {},
    sectionTitle: { fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 10px" },
    bio: { fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" },
    socialSection: {},
    socialRow: { display: "flex", gap: 12, flexWrap: "wrap" },
    socialBtn: { width: 40, height: 40, borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "background 0.15s" },
    tagsSection: {},
    tagsRow: { display: "flex", gap: 8, flexWrap: "wrap" },
    tag: { fontSize: 12, fontWeight: 700, color: "#1e3a5f", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "4px 12px" },
}