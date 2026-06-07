const PREFIX = "pm_gallery_pwd_"

export function saveGalleryPassword(slug, password) {
    if (typeof window === "undefined") return
    if (!password) {
        sessionStorage.removeItem(`${PREFIX}${slug}`)
    } else {
        sessionStorage.setItem(`${PREFIX}${slug}`, password)
    }
}

export function getGalleryPassword(slug) {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem(`${PREFIX}${slug}`) || null
}

export function clearGalleryPassword(slug) {
    if (typeof window === "undefined") return
    sessionStorage.removeItem(`${PREFIX}${slug}`)
}