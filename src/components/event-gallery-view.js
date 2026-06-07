"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Lock, Globe, Camera, Loader2, Upload,
    Users, Star, Video, QrCode, LogIn,
    Check, X, ScanFace, RefreshCw, Heart,
    LayoutGrid, Rows, ChevronLeft,
    ChevronRight, Download, Play, Trash2, Pencil
} from "lucide-react"
import CartDrawer from "@/components/cart-drawer"
import PhotoCard from "@/components/photo-card"
import FaceSearch from "@/components/face-search"

const LS_LIKES = (slug) => `ev_likes_${slug}`
const LS_FAVS = (slug) => `ev_favs_${slug}`
function getLikesLS(slug) { try { return JSON.parse(localStorage.getItem(LS_LIKES(slug)) || "[]") } catch { return [] } }
function getFavsLS(slug) { try { return JSON.parse(localStorage.getItem(LS_FAVS(slug)) || "[]") } catch { return [] } }
function toggleLikeLS(slug, id) { const s = new Set(getLikesLS(slug)); s.has(id) ? s.delete(id) : s.add(id); localStorage.setItem(LS_LIKES(slug), JSON.stringify([...s])) }
function toggleFavLS(slug, id) { const s = new Set(getFavsLS(slug)); s.has(id) ? s.delete(id) : s.add(id); localStorage.setItem(LS_FAVS(slug), JSON.stringify([...s])) }

// ── Community Lightbox ────────────────────────────────────────────────────────
function CommunityLightbox({ photos, index, slug, likedIds, favIds, likeCounts, onLike, onFav, onClose, onNav }) {
    const photo = photos[index]
    if (!photo) return null
    const liked = likedIds.has(photo.id)
    const faved = favIds.has(photo.id)
    const count = likeCounts[photo.id] ?? photo.likesCount ?? 0

    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") onNav(1); if (e.key === "ArrowLeft") onNav(-1) }
        document.body.style.overflow = "hidden"
        window.addEventListener("keydown", h)
        return () => { window.removeEventListener("keydown", h); document.body.style.overflow = "" }
    }, [onClose, onNav])

    const touchRef = useRef(null)

    return (
        <div style={LB.backdrop}
            onTouchStart={e => { touchRef.current = e.touches[0].clientX }}
            onTouchEnd={e => {
                if (touchRef.current === null) return
                const d = touchRef.current - e.changedTouches[0].clientX
                if (Math.abs(d) > 50) onNav(d > 0 ? 1 : -1)
                touchRef.current = null
            }}
        >
            <button style={LB.closeBtn} onClick={onClose}><X size={20} /></button>

            {photos.length > 1 && <button style={{ ...LB.navBtn, left: 12 }} onClick={() => onNav(-1)}><ChevronLeft size={24} /></button>}

            <div style={LB.mediaWrap}>
                {photo.isVideo
                    ? <video src={photo.bunnyUrl} controls autoPlay style={LB.media} playsInline />
                    : <img src={photo.bunnyUrl} alt="" style={LB.media} draggable={false} onContextMenu={e => e.preventDefault()} />
                }
            </div>

            {photos.length > 1 && <button style={{ ...LB.navBtn, right: 12 }} onClick={() => onNav(1)}><ChevronRight size={24} /></button>}

            <div style={LB.bar}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {photo.guest.selfieUrl
                        ? <img src={photo.guest.selfieUrl} alt="" style={LB.barAvatar} />
                        : <div style={LB.barAvatarFallback}>{photo.guest.name[0]}</div>}
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0 }}>{photo.guest.name}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>{index + 1} / {photos.length}</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button style={LB.actionBtn(liked)} onClick={() => onLike(photo.id)}>
                        <Heart size={16} fill={liked ? "currentColor" : "none"} />
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{count}</span>
                    </button>
                    <button style={LB.actionBtn(faved)} onClick={() => onFav(photo.id)}>
                        <Star size={16} fill={faved ? "currentColor" : "none"} />
                    </button>
                    {!photo.isVideo && (
                        <a href={photo.bunnyUrl} download target="_blank" rel="noreferrer" style={LB.downloadBtn}>
                            <Download size={15} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}

const LB = {
    backdrop: { position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.93)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',system-ui,sans-serif" },
    closeBtn: { position: "absolute", top: 14, right: 14, width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "white", cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" },
    navBtn: { position: "absolute", top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "white", cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" },
    mediaWrap: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 0, padding: "56px 60px 80px", boxSizing: "border-box" },
    media: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8, userSelect: "none" },
    bar: { position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)" },
    barAvatar: { width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
    barAvatarFallback: { width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "white", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
    actionBtn: (a) => ({ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 20, border: "none", background: a ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)", color: "white", cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }),
    downloadBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", textDecoration: "none" },
}

// ── Pro Lightbox ──────────────────────────────────────────────────────────────
function ProLightbox({ photos, index, galleryPassword, proFree, onClose, onNav, proFavIds, onFavToggle }) {
    const photo = photos[index]
    if (!photo) return null
    const isFaved = proFavIds.has(photo.id)
    const imgSrc = proFree ? photo.bunnyUrl : `/api/photos/protected/${photo.id}${galleryPassword ? `?pwd=${encodeURIComponent(galleryPassword)}` : ""}`

    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") onNav(1); if (e.key === "ArrowLeft") onNav(-1) }
        document.body.style.overflow = "hidden"
        window.addEventListener("keydown", h)
        return () => { window.removeEventListener("keydown", h); document.body.style.overflow = "" }
    }, [onClose, onNav])

    const touchRef = useRef(null)

    return (
        <div style={LB.backdrop}
            onTouchStart={e => { touchRef.current = e.touches[0].clientX }}
            onTouchEnd={e => {
                if (touchRef.current === null) return
                const d = touchRef.current - e.changedTouches[0].clientX
                if (Math.abs(d) > 50) onNav(d > 0 ? 1 : -1)
                touchRef.current = null
            }}
        >
            <button style={LB.closeBtn} onClick={onClose}><X size={20} /></button>
            {photos.length > 1 && <button style={{ ...LB.navBtn, left: 12 }} onClick={() => onNav(-1)}><ChevronLeft size={24} /></button>}
            <div style={LB.mediaWrap}>
                <img src={imgSrc} alt={photo.title || "Foto"} style={LB.media} draggable={false} onContextMenu={e => e.preventDefault()} />
            </div>
            {photos.length > 1 && <button style={{ ...LB.navBtn, right: 12 }} onClick={() => onNav(1)}><ChevronRight size={24} /></button>}
            <div style={LB.bar}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>{index + 1} / {photos.length}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button style={LB.actionBtn(isFaved)} onClick={() => onFavToggle(photo)}>
                        <Star size={16} fill={isFaved ? "currentColor" : "none"} />
                    </button>
                    {proFree && (
                        <a href={photo.bunnyUrl} download target="_blank" rel="noreferrer" style={LB.downloadBtn}>
                            <Download size={15} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EventGalleryView({ gallery, slug, galleryPassword }) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("community")
    const [communityPhotos, setCommunityPhotos] = useState([])
    const [communityLoading, setCommunityLoading] = useState(false)
    const [guestInfo, setGuestInfo] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState([])
    const [showUploadSheet, setShowUploadSheet] = useState(false)
    const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

    const [viewMode, setViewMode] = useState("grid")
    const [sortBy, setSortBy] = useState("recent")
    const [filterGuestId, setFilterGuestId] = useState(null)
    const [filterFavs, setFilterFavs] = useState(false)

    const [lbIndex, setLbIndex] = useState(null)
    const [lbPhotos, setLbPhotos] = useState([])
    const [lbIsPro, setLbIsPro] = useState(false)

    const [likedIds, setLikedIds] = useState(new Set())
    const [favIds, setFavIds] = useState(new Set())
    const [likeCounts, setLikeCounts] = useState({})

    const [showFavsPro, setShowFavsPro] = useState(false)
    const [proFavIds, setProFavIds] = useState(new Set())
    const [showFaceSearch, setShowFaceSearch] = useState(false)
    const [toast, setToast] = useState(null)

    // Borrar foto propia
    const [deleteConfirm, setDeleteConfirm] = useState(null) // photoId a confirmar

    // Cambiar selfie
    const [showSelfieModal, setShowSelfieModal] = useState(false)
    const [selfieStep, setSelfieStep] = useState("camera") // "camera" | "preview"
    const [selfieDataUrl, setSelfieDataUrl] = useState(null)
    const [selfieUploading, setSelfieUploading] = useState(false)
    const selfieVideoRef = useRef(null)
    const selfieCanvasRef = useRef(null)
    const selfieStreamRef = useRef(null)
    const selfieInputRef = useRef(null)

    const proFree = gallery.proPhotosAreFree

    useEffect(() => {
        setLikedIds(new Set(getLikesLS(slug)))
        setFavIds(new Set(getFavsLS(slug)))
        const syncProFavs = () => {
            try {
                const raw = localStorage.getItem("pm_favorites")
                setProFavIds(new Set(raw ? JSON.parse(raw).map(f => f.id) : []))
            } catch { }
        }
        syncProFavs()
        window.addEventListener("favorites-updated", syncProFavs)
        return () => window.removeEventListener("favorites-updated", syncProFavs)
    }, [slug])

    useEffect(() => {
        try {
            const s = localStorage.getItem(`event_guest_${slug}`)
            if (s) setGuestInfo(JSON.parse(s))
        } catch { }
    }, [slug])

    const fetchCommunity = useCallback(async () => {
        setCommunityLoading(true)
        try {
            const res = await fetch(`/api/event/community?gallerySlug=${slug}`)
            const data = await res.json()
            const photos = data.photos || []
            setCommunityPhotos(photos)
            const counts = {}
            photos.forEach(p => { counts[p.id] = p.likesCount ?? 0 })
            setLikeCounts(prev => ({ ...counts, ...prev }))
        } catch { }
        setCommunityLoading(false)
    }, [slug])

    useEffect(() => { if (activeTab === "community") fetchCommunity() }, [activeTab, fetchCommunity])

    const handleUpload = async (files) => {
        if (!files?.length || !guestInfo) return
        setUploading(true)
        const arr = Array.from(files)
        setUploadProgress(arr.map(f => ({ name: f.name, status: "pending" })))
        const fd = new FormData()
        fd.append("accessToken", guestInfo.token)
        fd.append("gallerySlug", slug)
        arr.forEach(f => fd.append("files", f))
        try {
            setUploadProgress(arr.map(f => ({ name: f.name, status: "uploading" })))
            const res = await fetch("/api/event/upload", { method: "POST", body: fd })
            const data = await res.json()
            setUploadProgress(arr.map(f => {
                const err = data.errors?.find(e => e.name === f.name)
                return { name: f.name, status: err ? "error" : "done", error: err?.error }
            }))
            showToast(`${data.uploaded?.length ?? 0} foto${data.uploaded?.length !== 1 ? "s" : ""} subida${data.uploaded?.length !== 1 ? "s" : ""}`, "success")
            if (activeTab === "community") await fetchCommunity()
        } catch {
            setUploadProgress(arr.map(f => ({ name: f.name, status: "error", error: "Error de red" })))
        } finally {
            setUploading(false)
            setTimeout(() => setUploadProgress([]), 5000)
        }
    }

    const handleLike = async (photoId) => {
        const already = likedIds.has(photoId)
        const action = already ? "unlike" : "like"
        setLikedIds(prev => { const s = new Set(prev); already ? s.delete(photoId) : s.add(photoId); return s })
        setLikeCounts(prev => ({ ...prev, [photoId]: Math.max(0, (prev[photoId] ?? 0) + (already ? -1 : 1)) }))
        toggleLikeLS(slug, photoId)
        try { await fetch("/api/event/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photoId, action }) }) } catch { }
    }

    const handleFav = (photoId) => {
        setFavIds(prev => { const s = new Set(prev); s.has(photoId) ? s.delete(photoId) : s.add(photoId); return s })
        toggleFavLS(slug, photoId)
    }

    const handleDeletePhoto = async (photoId) => {
        if (!guestInfo) return
        try {
            const res = await fetch(`/api/event/community/${photoId}?accessToken=${encodeURIComponent(guestInfo.token)}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error()
            setCommunityPhotos(prev => prev.filter(p => p.id !== photoId))
            showToast("Foto eliminada", "success")
        } catch {
            showToast("No se pudo eliminar la foto", "error")
        } finally {
            setDeleteConfirm(null)
        }
    }

    // ── Selfie modal helpers ────────────────────────────────────────────────
    const startSelfieCamera = useCallback(async () => {
        setSelfieStep("camera")
        setSelfieDataUrl(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
            })
            selfieStreamRef.current = stream
            if (selfieVideoRef.current) {
                selfieVideoRef.current.srcObject = stream
                await selfieVideoRef.current.play()
            }
        } catch {
            showToast("No se pudo acceder a la cámara", "error")
        }
    }, [])

    const stopSelfieCamera = useCallback(() => {
        if (selfieStreamRef.current) {
            selfieStreamRef.current.getTracks().forEach(t => t.stop())
            selfieStreamRef.current = null
        }
    }, [])

    const openSelfieModal = () => {
        setShowSelfieModal(true)
        setTimeout(() => startSelfieCamera(), 100)
    }

    const closeSelfieModal = () => {
        stopSelfieCamera()
        setShowSelfieModal(false)
        setSelfieDataUrl(null)
        setSelfieStep("camera")
    }

    const takeSelfie = () => {
        if (!selfieVideoRef.current || !selfieCanvasRef.current) return
        const video = selfieVideoRef.current
        const canvas = selfieCanvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
        setSelfieDataUrl(dataUrl)
        setSelfieStep("preview")
        stopSelfieCamera()
    }

    const handleSelfieFromFile = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            setSelfieDataUrl(ev.target.result)
            setSelfieStep("preview")
            stopSelfieCamera()
        }
        reader.readAsDataURL(file)
    }

    const confirmSelfie = async () => {
        if (!selfieDataUrl || !guestInfo) return
        setSelfieUploading(true)
        try {
            const res = await fetch("/api/event/guest/selfie", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken: guestInfo.token, selfieDataUrl }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // Actualizar localStorage con la nueva selfie URL
            const updated = { ...guestInfo, selfieUrl: data.selfieUrl }
            setGuestInfo(updated)
            localStorage.setItem(`event_guest_${slug}`, JSON.stringify(updated))

            // Refrescar fotos de comunidad para que se vea la nueva selfie en todas
            await fetchCommunity()
            showToast("Selfie actualizada", "success")
            closeSelfieModal()
        } catch {
            showToast("Error al guardar la selfie", "error")
        } finally {
            setSelfieUploading(false)
        }
    }

    const showToast = (msg, type = "info") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

    const openLightbox = (list, idx, isPro = false) => { setLbPhotos(list); setLbIndex(idx); setLbIsPro(isPro) }
    const navLightbox = (dir) => setLbIndex(prev => (prev + dir + lbPhotos.length) % lbPhotos.length)

    const handleProFavToggle = (photo) => {
        try {
            const FAVORITES_KEY = "pm_favorites"
            const imgSrc = proFree ? photo.bunnyUrl : `/api/photos/protected/${photo.id}${galleryPassword ? `?pwd=${encodeURIComponent(galleryPassword)}` : ""}`
            const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")
            const exists = favs.find(p => p.id === photo.id)
            const updated = exists ? favs.filter(p => p.id !== photo.id) : [...favs, { id: photo.id, title: photo.title, price: photo.price, previewUrl: imgSrc }]
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
            window.dispatchEvent(new Event("favorites-updated"))
        } catch { }
    }

    // Process community photos
    const guestMap = {}
    communityPhotos.forEach(p => {
        if (!guestMap[p.guest.id]) guestMap[p.guest.id] = { ...p.guest, photos: [] }
        guestMap[p.guest.id].photos.push(p)
    })
    const guestGroups = Object.values(guestMap)

    let displayed = filterGuestId ? communityPhotos.filter(p => p.guest.id === filterGuestId) : communityPhotos
    if (filterFavs) displayed = displayed.filter(p => favIds.has(p.id))
    if (sortBy === "likes") displayed = [...displayed].sort((a, b) => (likeCounts[b.id] ?? b.likesCount ?? 0) - (likeCounts[a.id] ?? a.likesCount ?? 0))
    const displayedImages = displayed.filter(p => !p.isVideo)

    const displayedPro = showFavsPro ? (gallery.photos || []).filter(p => proFavIds.has(p.id)) : gallery.photos || []

    return (
        <div style={S.page}>
            {lbIndex !== null && lbPhotos.length > 0 && lbIsPro && (
                <ProLightbox
                    photos={lbPhotos} index={lbIndex}
                    galleryPassword={galleryPassword} proFree={proFree}
                    proFavIds={proFavIds} onFavToggle={handleProFavToggle}
                    onClose={() => setLbIndex(null)} onNav={navLightbox}
                />
            )}
            {lbIndex !== null && lbPhotos.length > 0 && !lbIsPro && (
                <CommunityLightbox
                    photos={lbPhotos} index={lbIndex} slug={slug}
                    likedIds={likedIds} favIds={favIds} likeCounts={likeCounts}
                    onLike={handleLike} onFav={handleFav}
                    onClose={() => setLbIndex(null)} onNav={navLightbox}
                />
            )}

            {/* Hero */}
            <div style={S.hero}>
                {gallery.coverImage && <img src={gallery.coverImage} alt="" style={S.heroBg} />}
                <div style={S.heroOverlay} />
                <div style={S.heroInner}>
                    <div style={S.heroMeta}>
                        {gallery.isPublic ? <span style={S.heroBadge("pub")}><Globe size={9} /> Pública</span> : <span style={S.heroBadge("priv")}><Lock size={9} /> Privada</span>}
                        <span style={S.heroBadge("event")}><Camera size={9} /> Evento</span>
                        {proFree && <span style={S.heroBadge("free")}><Check size={9} /> Fotos gratis</span>}
                    </div>
                    <h1 style={S.heroTitle}>{gallery.title}</h1>
                    {gallery.description && <p style={S.heroDesc}>{gallery.description}</p>}
                    <div style={S.heroStats}>
                        <span>{gallery.photos?.length ?? 0} fotos pro</span>
                        <span style={{ opacity: 0.35 }}>·</span>
                        <span>{communityPhotos.length} de invitados</span>
                    </div>
                    {gallery.photographerName && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                            {gallery.photographerAvatar ? (
                                <img src={gallery.photographerAvatar} alt={gallery.photographerName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,.3)", flexShrink: 0 }} />
                            ) : (
                                <div style={{ width: 250, height: 250, borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "white", border: "2px solid rgba(255,255,255,.3)", flexShrink: 0 }}>
                                    {gallery.photographerName[0]?.toUpperCase()}
                                </div>
                            )}
                            {gallery.photographerPortfolioSlug ? (
                                <a href={`/p/${gallery.photographerPortfolioSlug}`} style={{ textDecoration: "none" }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0, textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(255,255,255,.4)" }}>{gallery.photographerName}</p>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", margin: 0 }}>Ver portfolio →</p>
                                </a>
                            ) : (
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0 }}>{gallery.photographerName}</p>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,.45)", margin: 0 }}>Fotógrafo</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div style={S.body}>
                {/* Tabs */}
                <div style={S.tabRow}>
                    <div style={S.tabBar}>
                        <button style={S.tab(activeTab === "community")} onClick={() => setActiveTab("community")}><Users size={13} /> Invitados <span style={S.tabPill(activeTab === "community")}>{communityPhotos.length}</span></button>
                        <button style={S.tab(activeTab === "pro")} onClick={() => setActiveTab("pro")}><Star size={13} /> Profesional <span style={S.tabPill(activeTab === "pro")}>{gallery.photos?.length ?? 0}</span></button>
                    </div>
                    {activeTab === "pro" && (
                        <div style={{ display: "flex", gap: 6 }}>
                            <button style={S.iconBtn(showFavsPro)} onClick={() => setShowFavsPro(v => !v)} title="Mis favoritos">
                                <Star size={13} fill={showFavsPro ? "currentColor" : "none"} />
                                {proFavIds.size > 0 && <span style={S.iconBadge}>{proFavIds.size}</span>}
                            </button>
                            <button style={S.iconBtn(false)} onClick={() => setShowFaceSearch(true)} title="Buscarme"><ScanFace size={13} /></button>
                        </div>
                    )}
                    {activeTab === "community" && (
                        <div style={{ display: "flex", gap: 6 }}>
                            <button style={S.iconBtn(filterFavs)} onClick={() => setFilterFavs(v => !v)} title="Mis favoritas">
                                <Star size={13} fill={filterFavs ? "currentColor" : "none"} />
                                {favIds.size > 0 && <span style={S.iconBadge}>{favIds.size}</span>}
                            </button>
                            <button style={S.iconBtn(sortBy === "likes")} onClick={() => setSortBy(s => s === "likes" ? "recent" : "likes")} title={sortBy === "likes" ? "Ver recientes" : "Ordenar por likes"}>
                                <Heart size={13} fill={sortBy === "likes" ? "currentColor" : "none"} />
                            </button>
                            <button style={S.iconBtn(false)} onClick={() => setViewMode(v => v === "grid" ? "rows" : "grid")} title="Cambiar vista">
                                {viewMode === "grid" ? <Rows size={13} /> : <LayoutGrid size={13} />}
                            </button>
                            <button style={S.iconBtn(false)} onClick={fetchCommunity} title="Actualizar"><RefreshCw size={13} /></button>
                        </div>
                    )}
                </div>

                {/* Check-in banner */}
                {!guestInfo && (
                    <div style={S.checkinBanner}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={S.checkinIcon}><QrCode size={18} color="#6366f1" /></div>
                            <div>
                                <p style={S.checkinTitle}>¿Estás en el evento?</p>
                                <p style={S.checkinSub}>Registrate para subir tus fotos y videos</p>
                            </div>
                        </div>
                        <button style={S.checkinCta} onClick={() => router.push(`/g/${slug}/checkin`)}><LogIn size={13} /> Unirse</button>
                    </div>
                )}

                {/* Guest upload bar */}
                {guestInfo && (
                    <div style={S.guestBar}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ position: "relative", flexShrink: 0 }}>
                                {guestInfo.selfieUrl
                                    ? <img src={guestInfo.selfieUrl} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }} />
                                    : <div style={S.guestAvatar}>{guestInfo.name?.[0]?.toUpperCase()}</div>
                                }
                                <button
                                    title="Cambiar selfie"
                                    style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: "#4f46e5", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                                    onClick={openSelfieModal}
                                >
                                    <Pencil size={8} color="white" />
                                </button>
                            </div>
                            <div>
                                <p style={S.guestName}>Hola, {guestInfo.name.split(" ")[0]}!</p>
                                <p style={S.guestSub}>Podés subir fotos y videos</p>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button style={S.uploadCta} onClick={() => setShowUploadSheet(true)}>
                                <Camera size={13} /> Subir
                            </button>
                        </div>
                        {/* Input para archivos de galería (sin capture) */}
                        <input ref={fileInputRef} type="file" multiple
                            accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
                            style={{ display: "none" }}
                            onChange={e => { setShowUploadSheet(false); handleUpload(e.target.files) }}
                        />
                        {/* Input exclusivo para cámara (foto + video) */}
                        <input ref={cameraInputRef} type="file" multiple
                            accept="image/*,video/*"
                            capture="environment"
                            style={{ display: "none" }}
                            onChange={e => { setShowUploadSheet(false); handleUpload(e.target.files) }}
                        />
                    </div>
                )}

                {/* ── Upload sheet (cámara / galería) ── */}
                {showUploadSheet && (
                    <>
                        {/* Backdrop */}
                        <div
                            onClick={() => setShowUploadSheet(false)}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, backdropFilter: "blur(2px)" }}
                        />
                        {/* Bottom sheet */}
                        <div style={{
                            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 51,
                            background: "var(--pb-color-surface, #fff)",
                            borderRadius: "20px 20px 0 0",
                            padding: "8px 20px 36px",
                            boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
                            animation: "slideUp 0.22s cubic-bezier(0.32,0.72,0,1)",
                        }}>
                            {/* Handle */}
                            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--pb-color-border,#e2e8f0)", margin: "10px auto 20px" }} />
                            <p style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--pb-color-text,#0f172a)", textAlign: "center" }}>
                                Subir fotos o videos
                            </p>
                            {/* Opción cámara */}
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", gap: 14,
                                    padding: "14px 16px", borderRadius: 14, border: "none",
                                    background: "var(--pb-color-bg,#f8fafc)", cursor: "pointer",
                                    marginBottom: 10, fontFamily: "inherit",
                                }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: "var(--pb-color-accent,#4f46e5)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Camera size={20} color="var(--pb-color-accent-fg,#fff)" />
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--pb-color-text,#0f172a)" }}>Cámara</p>
                                    <p style={{ margin: 0, fontSize: 12, color: "var(--pb-color-text-muted,#64748b)" }}>Sacar foto o grabar video ahora</p>
                                </div>
                            </button>
                            {/* Opción galería */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", gap: 14,
                                    padding: "14px 16px", borderRadius: 14, border: "none",
                                    background: "var(--pb-color-bg,#f8fafc)", cursor: "pointer",
                                    fontFamily: "inherit",
                                }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: "var(--pb-color-border,#e2e8f0)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Upload size={20} color="var(--pb-color-text,#475569)" />
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--pb-color-text,#0f172a)" }}>Galería / archivos</p>
                                    <p style={{ margin: 0, fontSize: 12, color: "var(--pb-color-text-muted,#64748b)" }}>Elegir fotos o videos existentes</p>
                                </div>
                            </button>
                        </div>
                    </>
                )}

                {/* Upload progress */}
                {uploadProgress.length > 0 && (
                    <div style={S.progressBox}>
                        {uploadProgress.map((f, i) => (
                            <div key={i} style={S.progressItem}>
                                <div style={{ ...S.progressDot, background: f.status === "done" ? "#10b981" : f.status === "error" ? "#ef4444" : "#3b82f6" }} />
                                <span style={S.progressName}>{f.name}</span>
                                <span style={{ fontSize: 11, fontWeight: 600, flexShrink: 0, color: f.status === "done" ? "#10b981" : f.status === "error" ? "#ef4444" : "#3b82f6" }}>{f.status === "done" ? "✓ Lista" : f.status === "error" ? (f.error || "Error") : "Subiendo..."}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── TAB PROFESIONAL ── */}
                {activeTab === "pro" && (
                    <>
                        {proFree && <div style={S.freeNotice}><Check size={13} color="#059669" /> Las fotos del fotógrafo son de descarga gratuita</div>}
                        {displayedPro.length === 0 ? (
                            <div style={S.empty}>
                                <Camera size={36} color="#cbd5e1" strokeWidth={1.3} />
                                <p style={S.emptyTitle}>{showFavsPro ? "Sin favoritos aún" : "El fotógrafo aún no subió fotos"}</p>
                                {showFavsPro && <button style={S.emptyAction} onClick={() => setShowFavsPro(false)}>Ver todas</button>}
                            </div>
                        ) : (
                            <div style={S.grid}>
                                {displayedPro.map((photo, idx) => (
                                    <PhotoCard key={photo.id} photo={photo} galleryPassword={galleryPassword}
                                        onZoom={() => openLightbox(displayedPro, idx, true)}
                                        isTiered={!proFree && gallery.pricingMode === "tiered"} isFree={proFree}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── TAB COMUNIDAD ── */}
                {activeTab === "community" && (
                    communityLoading ? (
                        <div style={S.centerSection}><Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} /></div>
                    ) : communityPhotos.length === 0 ? (
                        <div style={S.empty}>
                            <Users size={36} color="#cbd5e1" strokeWidth={1.3} />
                            <p style={S.emptyTitle}>Aún no hay fotos de invitados</p>
                            <p style={S.emptySub}>{guestInfo ? "¡Subí las tuyas!" : "Registrate para subir fotos."}</p>
                            {!guestInfo && <button style={S.emptyAction} onClick={() => router.push(`/g/${slug}/checkin`)}>Unirse al evento</button>}
                        </div>
                    ) : (
                        <>
                            {/* Guest banners — solo cuando no hay filtro activo */}
                            {!filterGuestId && !filterFavs && (
                                <div style={S.guestBanners}>
                                    {guestGroups.map(g => (
                                        <button key={g.id} style={S.guestBannerCard} onClick={() => setFilterGuestId(g.id)}>
                                            {g.selfieUrl
                                                ? <img src={g.selfieUrl} alt="" style={S.bannerAvatar} />
                                                : <div style={S.bannerAvatarFallback}>{g.name[0]}</div>}
                                            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                                                <p style={S.bannerName}>{g.name}</p>
                                                <p style={S.bannerSub}>{g.photos.length} {g.photos.length === 1 ? "foto" : "fotos"}</p>
                                            </div>
                                            <div style={S.bannerStrip}>
                                                {g.photos.slice(0, 3).map(p =>
                                                    p.isVideo
                                                        ? <div key={p.id} style={S.bannerThumbVideo}><Play size={10} color="white" /></div>
                                                        : <img key={p.id} src={p.bunnyUrl} alt="" style={S.bannerThumb} />
                                                )}
                                                {g.photos.length > 3 && <div style={S.bannerThumbMore}>+{g.photos.length - 3}</div>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Active filter header */}
                            {(filterGuestId || filterFavs) && (
                                <div style={S.filterHeader}>
                                    {filterGuestId && (() => {
                                        const g = guestGroups.find(x => x.id === filterGuestId)
                                        return g ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                {g.selfieUrl
                                                    ? <img src={g.selfieUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                                                    : <div style={{ ...S.bannerAvatarFallback, width: 28, height: 28, fontSize: 12 }}>{g.name[0]}</div>}
                                                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Fotos de {g.name}</span>
                                                <span style={S.countBadge}>{displayed.length}</span>
                                            </div>
                                        ) : null
                                    })()}
                                    {filterFavs && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <Star size={15} color="#f59e0b" fill="#f59e0b" />
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Mis favoritas</span>
                                            <span style={S.countBadge}>{displayed.length}</span>
                                        </div>
                                    )}
                                    <button style={S.clearFilter} onClick={() => { setFilterGuestId(null); setFilterFavs(false) }}><X size={12} /> Limpiar</button>
                                </div>
                            )}

                            {sortBy === "likes" && <div style={S.sortBadge}><Heart size={11} fill="currentColor" /> Ordenado por likes</div>}

                            {displayed.length === 0 && (
                                <div style={S.empty}>
                                    <Star size={28} color="#cbd5e1" />
                                    <p style={S.emptyTitle}>Sin resultados</p>
                                    <button style={S.emptyAction} onClick={() => { setFilterGuestId(null); setFilterFavs(false) }}>Ver todas</button>
                                </div>
                            )}

                            {/* GRID */}
                            {viewMode === "grid" && displayed.length > 0 && (
                                <div style={S.grid}>
                                    {displayed.map((photo) => {
                                        const liked = likedIds.has(photo.id)
                                        const faved = favIds.has(photo.id)
                                        const count = likeCounts[photo.id] ?? photo.likesCount ?? 0
                                        const imgIdx = displayedImages.indexOf(photo)
                                        return (
                                            <div key={photo.id} style={S.commThumb} className="comm-thumb pb-photo-card">
                                                {photo.isVideo ? (
                                                    <div style={S.videoWrap}>
                                                        <div style={S.videoPlayIcon}><Play size={22} color="white" /></div>
                                                        <video src={photo.bunnyUrl} style={S.commMedia} muted playsInline
                                                            onMouseEnter={e => e.target.play()}
                                                            onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0 }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <img src={photo.bunnyUrl} alt="" style={S.commMedia} onClick={() => openLightbox(displayedImages, imgIdx)} />
                                                )}
                                                <div style={S.guestBadge}>
                                                    {photo.guest.selfieUrl
                                                        ? <img src={photo.guest.selfieUrl} alt="" style={S.guestBadgeImg} />
                                                        : <span style={S.guestBadgeInit}>{photo.guest.name[0]}</span>}
                                                    <span style={S.guestBadgeName}>{photo.guest.name.split(" ")[0]}</span>
                                                </div>
                                                <div style={S.thumbActions} className="thumb-actions">
                                                    <button style={S.thumbBtn(liked)} onClick={e => { e.stopPropagation(); handleLike(photo.id) }}>
                                                        <Heart size={12} fill={liked ? "currentColor" : "none"} />{count > 0 && <span>{count}</span>}
                                                    </button>
                                                    <button style={S.thumbBtn(faved)} onClick={e => { e.stopPropagation(); handleFav(photo.id) }}>
                                                        <Star size={12} fill={faved ? "currentColor" : "none"} />
                                                    </button>
                                                    {guestInfo && photo.guest.id === guestInfo.id && (
                                                        <button style={{ ...S.thumbBtn(false), background: "rgba(239,68,68,.8)" }} onClick={e => { e.stopPropagation(); setDeleteConfirm(photo.id) }}>
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* ROWS */}
                            {viewMode === "rows" && displayed.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {displayed.map((photo) => {
                                        const liked = likedIds.has(photo.id)
                                        const faved = favIds.has(photo.id)
                                        const count = likeCounts[photo.id] ?? photo.likesCount ?? 0
                                        const imgIdx = displayedImages.indexOf(photo)
                                        return (
                                            <div key={photo.id} style={S.rowCard}>
                                                <div style={S.rowThumb} onClick={() => !photo.isVideo && openLightbox(displayedImages, imgIdx)}>
                                                    {photo.isVideo
                                                        ? <div style={{ position: "relative", width: "100%", height: "100%", background: "#1e293b" }}><div style={S.videoPlayIcon}><Play size={18} color="white" /></div><video src={photo.bunnyUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline /></div>
                                                        : <img src={photo.bunnyUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />}
                                                </div>
                                                <div style={S.rowInfo}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        {photo.guest.selfieUrl
                                                            ? <img src={photo.guest.selfieUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                                                            : <div style={{ ...S.bannerAvatarFallback, width: 32, height: 32, fontSize: 13 }}>{photo.guest.name[0]}</div>}
                                                        <div>
                                                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{photo.guest.name}</p>
                                                            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{photo.isVideo ? "Video" : "Foto"}</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                                        <button style={S.rowBtn(liked, "like")} onClick={() => handleLike(photo.id)}>
                                                            <Heart size={12} fill={liked ? "currentColor" : "none"} /><span>{count} {count === 1 ? "like" : "likes"}</span>
                                                        </button>
                                                        <button style={S.rowBtn(faved, "fav")} onClick={() => handleFav(photo.id)}>
                                                            <Star size={12} fill={faved ? "currentColor" : "none"} /><span>{faved ? "Guardada" : "Guardar"}</span>
                                                        </button>
                                                        {guestInfo && photo.guest.id === guestInfo.id && (
                                                            <button style={S.rowBtn(false, "del")} onClick={() => setDeleteConfirm(photo.id)}>
                                                                <Trash2 size={12} /><span>Borrar</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )
                )}
            </div>

            {/* ── Modal: Confirmar borrado ── */}
            {deleteConfirm && (
                <div style={S.modalBackdrop}>
                    <div style={S.modalBox}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                            <Trash2 size={22} color="#ef4444" />
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", textAlign: "center" }}>¿Borrar esta foto?</p>
                        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", textAlign: "center" }}>Esta acción no se puede deshacer.</p>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ flex: 1, padding: "10px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "white", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }} onClick={() => setDeleteConfirm(null)}>
                                Cancelar
                            </button>
                            <button style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, background: "#ef4444", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }} onClick={() => handleDeletePhoto(deleteConfirm)}>
                                Sí, borrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Cambiar selfie ── */}
            {showSelfieModal && (
                <div style={S.modalBackdrop}>
                    <div style={{ ...S.modalBox, maxWidth: 360, padding: 0, overflow: "hidden" }}>
                        {/* Header */}
                        <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
                            <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Cambiar selfie</p>
                            <button style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={closeSelfieModal}>
                                <X size={15} color="#64748b" />
                            </button>
                        </div>

                        {/* Camera / Preview */}
                        <div style={{ padding: "16px 18px" }}>
                            <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: 14, overflow: "hidden", background: "#0f172a", marginBottom: 14 }}>
                                {selfieStep === "camera" ? (
                                    <>
                                        <video
                                            ref={selfieVideoRef}
                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" }}
                                            autoPlay playsInline muted
                                        />
                                        <button
                                            style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", width: 54, height: 54, borderRadius: "50%", border: "4px solid white", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,.4)" }}
                                            onClick={takeSelfie}
                                        >
                                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "white" }} />
                                        </button>
                                    </>
                                ) : (
                                    <img src={selfieDataUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                )}
                            </div>

                            <canvas ref={selfieCanvasRef} style={{ display: "none" }} />

                            {selfieStep === "camera" ? (
                                <button
                                    style={{ width: "100%", padding: "10px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "white", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                    onClick={() => selfieInputRef.current?.click()}
                                >
                                    <Upload size={14} /> Elegir desde galería
                                </button>
                            ) : (
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        style={{ flex: 1, padding: "10px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "white", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                                        onClick={startSelfieCamera}
                                    >
                                        <RefreshCw size={13} /> Repetir
                                    </button>
                                    <button
                                        style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", fontSize: 13, fontWeight: 700, cursor: selfieUploading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: selfieUploading ? 0.7 : 1 }}
                                        onClick={confirmSelfie}
                                        disabled={selfieUploading}
                                    >
                                        {selfieUploading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />}
                                        {selfieUploading ? "Guardando..." : "Usar esta"}
                                    </button>
                                </div>
                            )}

                            <input
                                ref={selfieInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/heic"
                                style={{ display: "none" }}
                                onChange={handleSelfieFromFile}
                            />
                        </div>
                    </div>
                </div>
            )}

            {!proFree && activeTab === "pro" && <CartDrawer galleryId={gallery.id} hasMpToken={gallery.hasMpToken ?? false} gallery={gallery} />}

            {showFaceSearch && (
                <FaceSearch photos={gallery.photos} galleryPassword={galleryPassword}
                    onPhotoFound={photo => { openLightbox(gallery.photos, gallery.photos.findIndex(p => p.id === photo.id)); setShowFaceSearch(false) }}
                    onClose={() => setShowFaceSearch(false)}
                />
            )}

            {toast && (
                <div style={{ ...S.toast, background: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#0f172a" }}>
                    {toast.type === "success" ? <Check size={14} /> : <X size={14} />} {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .comm-thumb .thumb-actions { opacity: 0; transition: opacity 0.15s; }
                @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .comm-thumb:hover .thumb-actions { opacity: 1; }
                .comm-thumb:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -12px rgba(0,0,0,0.15); }
                .comm-thumb:hover img { transform: scale(var(--pb-photo-hover-scale, 1.04)); }
            `}</style>
        </div>
    )
}

const S = {
    page: { minHeight: "100dvh", background: "var(--pb-color-bg)", fontFamily: "var(--pb-font-family,'DM Sans',system-ui,sans-serif)" },
    body: { maxWidth: 980, margin: "0 auto", padding: "20px 14px 60px" },
    hero: { position: "relative", minHeight: 200, display: "flex", alignItems: "flex-end", background: "var(--pb-color-hero-bg)" },
    heroBg: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 },
    heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(0,0,0,.15),rgba(0,0,0,.82))" },
    heroInner: { position: "relative", padding: "20px 16px 24px", width: "100%", maxWidth: 980, margin: "0 auto" },
    heroMeta: { display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" },
    heroTitle: { fontSize: 24, fontWeight: 800, color: "white", margin: "0 0 5px", letterSpacing: "-.02em" },
    heroDesc: { fontSize: 13, color: "rgba(255,255,255,.65)", margin: "0 0 10px" },
    heroStats: { display: "flex", gap: 7, fontSize: 11, color: "rgba(255,255,255,.45)", flexWrap: "wrap" },
    heroBadge: (t) => ({
        display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
        ...(t === "pub" ? { background: "rgba(16,185,129,.2)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,.3)" } :
            t === "priv" ? { background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", border: "1px solid rgba(255,255,255,.2)" } :
                t === "event" ? { background: "var(--pb-color-accent)", color: "var(--pb-color-accent-fg)", border: "1px solid var(--pb-color-accent)", opacity: 0.85 } :
                    { background: "rgba(16,185,129,.25)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,.35)" }),
    }),
    tabRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" },
    tabBar: { display: "flex", gap: 3, background: "var(--pb-color-surface)", border: "1px solid var(--pb-color-border)", borderRadius: 12, padding: 3, flex: 1, minWidth: 240 },
    tab: (a) => ({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 9, border: "none", background: a ? "var(--pb-color-accent)" : "transparent", color: a ? "var(--pb-color-accent-fg)" : "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .13s" }),
    tabPill: (a) => ({ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20, background: a ? "rgba(255,255,255,.18)" : "#f1f5f9", color: a ? "white" : "#94a3b8" }),
    iconBtn: (a) => ({ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--pb-color-border)", background: a ? "var(--pb-color-accent)" : "var(--pb-color-surface)", color: a ? "var(--pb-color-accent-fg)" : "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }),
    iconBadge: { position: "absolute", top: -5, right: -5, background: "#f59e0b", color: "white", fontSize: 9, fontWeight: 800, borderRadius: 10, padding: "1px 4px", minWidth: 14, textAlign: "center" },
    checkinBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--pb-color-surface)", border: "1.5px solid var(--pb-color-accent)", borderRadius: 14, padding: "12px 14px", marginBottom: 14, flexWrap: "wrap" },
    checkinIcon: { width: 38, height: 38, borderRadius: 11, background: "var(--pb-color-bg)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.1)", flexShrink: 0 },
    checkinTitle: { fontSize: 13, fontWeight: 700, color: "var(--pb-color-accent)", margin: "0 0 1px" },
    checkinSub: { fontSize: 11, color: "var(--pb-color-accent)", margin: 0 },
    checkinCta: { display: "flex", alignItems: "center", gap: 6, background: "var(--pb-color-accent)", color: "var(--pb-color-accent-fg)", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    guestBar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "var(--pb-color-surface)", border: "1.5px solid var(--pb-color-border)", borderRadius: 14, padding: "11px 14px", marginBottom: 14, flexWrap: "wrap" },
    guestAvatar: { width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "var(--pb-color-accent)", color: "var(--pb-color-accent-fg)", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
    guestName: { fontSize: 13, fontWeight: 700, color: "var(--pb-color-text,#0f172a)", margin: "0 0 1px" },
    guestSub: { fontSize: 11, color: "var(--pb-color-text-muted,#64748b)", margin: 0 },
    uploadCta: { display: "flex", alignItems: "center", gap: 5, background: "var(--pb-color-accent)", color: "var(--pb-color-accent-fg)", border: "none", borderRadius: 10, padding: "8px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    progressBox: { background: "var(--pb-color-surface)", border: "1px solid var(--pb-color-border)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 5 },
    progressItem: { display: "flex", alignItems: "center", gap: 8 },
    progressDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
    progressName: { fontSize: 12, color: "#475569", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    freeNotice: { display: "flex", alignItems: "center", gap: 7, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "9px 13px", marginBottom: 12, fontSize: 12, fontWeight: 600, color: "#065f46" },
    grid: { display: "grid", gridTemplateColumns: "var(--pb-photo-columns, repeat(auto-fill, minmax(155px, 1fr)))", gap: "var(--pb-photo-gap, 8px)" },
    commThumb: { position: "relative", aspectRatio: "1", borderRadius: "var(--pb-photo-radius, 12px)", overflow: "hidden", background: "var(--pb-color-border, #e2e8f0)", cursor: "pointer", transition: "transform var(--pb-transition-speed, 0.2s) var(--pb-transition-easing, ease), box-shadow var(--pb-transition-speed, 0.2s) var(--pb-transition-easing, ease)" },
    commMedia: { width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform var(--pb-transition-speed, 0.2s) var(--pb-transition-easing, ease)" },
    videoWrap: { position: "relative", width: "100%", height: "100%", background: "#1e293b" },
    videoPlayIcon: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, pointerEvents: "none" },
    guestBadge: { position: "absolute", bottom: 5, left: 5, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,.55)", borderRadius: 20, padding: "2px 8px 2px 3px", backdropFilter: "blur(4px)" },
    guestBadgeImg: { width: 16, height: 16, borderRadius: "50%", objectFit: "cover" },
    guestBadgeInit: { width: 16, height: 16, borderRadius: "50%", background: "#6366f1", color: "white", fontSize: 8, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" },
    guestBadgeName: { fontSize: 10, fontWeight: 600, color: "white" },
    thumbActions: { position: "absolute", top: 5, right: 5, display: "flex", gap: 4, flexDirection: "column" },
    thumbBtn: (a) => ({ display: "flex", alignItems: "center", gap: 3, padding: "4px 7px", borderRadius: 16, border: "none", background: a ? "rgba(239,68,68,.85)" : "rgba(0,0,0,.45)", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(4px)", transition: "all .15s" }),
    guestBanners: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 },
    guestBannerCard: { display: "flex", alignItems: "center", gap: 12, background: "var(--pb-color-surface)", border: "1.5px solid var(--pb-color-border)", borderRadius: 14, padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", transition: "all .13s" },
    bannerAvatar: { width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #e2e8f0" },
    bannerAvatarFallback: { width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: "var(--pb-color-accent)", color: "var(--pb-color-accent-fg)", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
    bannerName: { fontSize: 13, fontWeight: 700, color: "var(--pb-color-text,#0f172a)", margin: "0 0 2px" },
    bannerSub: { fontSize: 11, color: "#94a3b8", margin: 0 },
    bannerStrip: { display: "flex", gap: 4, flexShrink: 0 },
    bannerThumb: { width: 40, height: 40, borderRadius: 8, objectFit: "cover" },
    bannerThumbVideo: { width: 40, height: 40, borderRadius: 8, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center" },
    bannerThumbMore: { width: 40, height: 40, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#64748b" },
    filterHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, background: "var(--pb-color-surface)", border: "1px solid var(--pb-color-border)", borderRadius: 12, padding: "8px 12px" },
    countBadge: { fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#64748b", padding: "2px 7px", borderRadius: 20 },
    clearFilter: { display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 20, background: "white", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    sortBadge: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 20, padding: "4px 10px", marginBottom: 12 },
    rowCard: { display: "flex", gap: 0, background: "var(--pb-color-surface)", border: "1px solid var(--pb-color-border)", borderRadius: 14, overflow: "hidden" },
    rowThumb: { width: 100, height: 100, flexShrink: 0, position: "relative", overflow: "hidden", background: "#f1f5f9" },
    rowInfo: { flex: 1, padding: "12px 14px" },
    rowBtn: (a, t) => ({ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1.5px solid", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .13s", background: t === "del" ? "#fef2f2" : a ? (t === "like" ? "#fef2f2" : "#fefce8") : "white", color: t === "del" ? "#ef4444" : a ? (t === "like" ? "#dc2626" : "#d97706") : "#64748b", borderColor: t === "del" ? "#fecaca" : a ? (t === "like" ? "#fecaca" : "#fde68a") : "#e2e8f0" }),
    modalBackdrop: { position: "fixed", inset: 0, zIndex: 9500, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif" },
    modalBox: { background: "white", borderRadius: 20, width: "100%", maxWidth: 380, padding: 24, boxShadow: "0 32px 80px rgba(0,0,0,.3)" },
    empty: { textAlign: "center", padding: "52px 20px" },
    emptyTitle: { fontSize: 14, fontWeight: 600, color: "#94a3b8", margin: "12px 0 4px" },
    emptySub: { fontSize: 12, color: "#cbd5e1", margin: 0 },
    emptyAction: { marginTop: 14, padding: "8px 18px", background: "var(--pb-color-accent)", color: "var(--pb-color-accent-fg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    centerSection: { display: "flex", justifyContent: "center", padding: "40px 0" },
    toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "white", fontSize: 13, fontWeight: 600, padding: "10px 18px", borderRadius: 12, display: "flex", alignItems: "center", gap: 7, boxShadow: "0 8px 24px rgba(0,0,0,.2)", zIndex: 9999, whiteSpace: "nowrap" },
}